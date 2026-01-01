import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { authService } from "@/services/auth.service";
import { syncService } from "@/services/sync.service";
import { tokenManager, userStorage } from "@/services/tokenManager";
import {
  AuthUser,
  AuthResponse,
  LoginDto,
  RegisterDto,
  GoogleAuthStatus,
  SyncStatus,
} from "@/types/index";

interface AuthContextType {
  // User & Auth State
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Legacy userId support
  userId: string | null;

  // Google & Sync Status
  googleStatus: GoogleAuthStatus | null;
  syncStatus: SyncStatus | null;
  isSyncLoading: boolean;
  isGoogleConnected: boolean;
  isSyncEnabled: boolean;

  // Auth Actions
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;

  // OAuth Callback Handler
  handleOAuthCallback: (
    accessToken: string,
    refreshToken: string,
    userId: string
  ) => Promise<void>;

  // Google Actions
  connectGoogle: () => void;
  disconnectGoogle: () => Promise<void>;
  checkGoogleStatus: () => Promise<void>;

  // Sync Actions
  checkSyncStatus: () => Promise<void>;
  initializeSync: () => Promise<boolean>;
  disconnectSync: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [googleStatus, setGoogleStatus] = useState<GoogleAuthStatus | null>(
    null
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncLoading, setIsSyncLoading] = useState(false);

  // Refs to prevent duplicate API calls
  const hasCheckedStatus = useRef(false);

  // Derived state
  const userId = user?.id || null;
  // User is authenticated only if they have an access token
  const isAuthenticated = !!accessToken && !!user;

  /**
   * App Initialization Flow (theo best practice):
   * 1. Check có refreshToken trong storage không
   * 2. Nếu KHÔNG có: User chưa login
   * 3. Nếu CÓ: Gọi POST /auth/refresh để lấy accessToken mới
   *    - Nếu thành công: user đã login, lưu accessToken vào memory
   *    - Nếu thất bại: refresh token hết hạn, clear & redirect login
   */
  useEffect(() => {
    const initAuth = async () => {
      // Check có refresh token không (access token KHÔNG lưu localStorage)
      const hasRefreshToken = authService.hasRefreshToken();

      if (!hasRefreshToken) {
        // User chưa login hoặc đã logout
        // Clear legacy data nếu có
        authService.clearAuth();
        setIsLoading(false);
        return;
      }

      // Có refresh token -> gọi refresh để lấy access token mới
      try {
        const response = await authService.refreshAccessToken();

        if (response) {
          // Refresh thành công -> user đã login
          setAccessToken(response.accessToken);
          setUser(response.user);
        } else {
          // Refresh thất bại -> token hết hạn
          authService.clearAuth();
        }
      } catch {
        // Lỗi refresh -> clear auth
        authService.clearAuth();
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Subscribe to token changes from tokenManager
  useEffect(() => {
    const unsubscribe = tokenManager.subscribe((token) => {
      setAccessToken(token);
    });
    return unsubscribe;
  }, []);

  // Check Google & Sync status ONCE when user is authenticated
  useEffect(() => {
    // Only check status if user has proper JWT authentication AND hasn't checked yet
    if (userId && accessToken && !hasCheckedStatus.current) {
      hasCheckedStatus.current = true;
      checkGoogleStatus();
      checkSyncStatus();
    }
    // Reset flag when user logs out
    if (!userId || !accessToken) {
      hasCheckedStatus.current = false;
      setGoogleStatus(null);
      setSyncStatus(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, accessToken]);

  // ==================== Auth Actions ====================

  const login = useCallback(async (email: string, password: string) => {
    const data: LoginDto = { email, password };
    const response = await authService.login(data);
    handleAuthSuccess(response);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const data: RegisterDto = { name, email, password };
      const response = await authService.register(data);
      handleAuthSuccess(response);
    },
    []
  );

  const loginWithGoogle = useCallback(() => {
    // Store current path for redirect after auth
    sessionStorage.setItem("authRedirect", window.location.pathname);
    authService.connectGoogle();
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setAccessToken(null);
    setGoogleStatus(null);
    setSyncStatus(null);
  }, []);

  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await authService.refreshAccessToken();
      if (response) {
        handleAuthSuccess(response);
        return true;
      }
      return false;
    } catch {
      setUser(null);
      setAccessToken(null);
      return false;
    }
  }, []);

  const handleAuthSuccess = (response: AuthResponse) => {
    // Access token được lưu vào tokenManager (memory) bởi authService.handleAuthSuccess
    // Chỉ cần update React state
    setAccessToken(response.accessToken);
    setUser(response.user);
  };

  /**
   * Handle OAuth callback - được gọi từ AuthCallback page
   * Cập nhật cả tokenManager và React state
   */
  const handleOAuthCallback = useCallback(
    async (
      callbackAccessToken: string,
      callbackRefreshToken: string,
      callbackUserId: string
    ) => {
      // Tạo user object tạm thời
      const tempUser: AuthUser = {
        id: callbackUserId,
        email: "",
        name: "",
        authMethods: ["google"],
        googleConnected: true,
      };

      // Lưu tokens vào storage/memory
      authService.handleAuthSuccess({
        accessToken: callbackAccessToken,
        refreshToken: callbackRefreshToken,
        user: tempUser,
      });

      // Update React state ngay lập tức
      setAccessToken(callbackAccessToken);
      setUser(tempUser);

      // Fetch full user profile
      try {
        const profile = await authService.getProfile();
        if (profile) {
          setUser(profile);
          // Cập nhật user trong storage
          userStorage.set(profile);
        }
      } catch {
        // Profile fetch failed, dùng temp user
      }
    },
    []
  );

  // ==================== Google Actions ====================

  const connectGoogle = useCallback(() => {
    sessionStorage.setItem("authRedirect", window.location.pathname);
    authService.connectGoogle();
  }, []);

  const checkGoogleStatus = useCallback(async () => {
    // Only check if user is authenticated (has access token)
    if (!accessToken) return;

    try {
      const status = await authService.checkGoogleStatus();
      setGoogleStatus(status);
    } catch (error) {
      console.error("Failed to check Google status:", error);
      setGoogleStatus({ isConnected: false });
    }
  }, [accessToken]);

  const disconnectGoogle = useCallback(async () => {
    if (!accessToken) return;

    try {
      await authService.disconnectGoogle();
      setGoogleStatus({ isConnected: false });
      setSyncStatus({ enabled: false, calendarId: null, webhookActive: false });
    } catch (error) {
      console.error("Failed to disconnect Google:", error);
      throw error;
    }
  }, [accessToken]);

  // ==================== Sync Actions ====================

  const checkSyncStatus = useCallback(async () => {
    if (!accessToken) return;

    try {
      const status = await syncService.getStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error("Failed to check sync status:", error);
      setSyncStatus({ enabled: false, calendarId: null, webhookActive: false });
    }
  }, [accessToken]);

  const initializeSync = useCallback(async (): Promise<boolean> => {
    if (!accessToken) return false;

    setIsSyncLoading(true);
    try {
      await syncService.initialize();
      await checkSyncStatus();
      return true;
    } catch (error) {
      console.error("Failed to initialize sync:", error);
      return false;
    } finally {
      setIsSyncLoading(false);
    }
  }, [accessToken, checkSyncStatus]);

  const disconnectSync = useCallback(async () => {
    if (!accessToken) return;

    setIsSyncLoading(true);
    try {
      await syncService.disconnect();
      setSyncStatus({ enabled: false, calendarId: null, webhookActive: false });
    } catch (error) {
      console.error("Failed to disconnect sync:", error);
      throw error;
    } finally {
      setIsSyncLoading(false);
    }
  }, [accessToken]);

  const value: AuthContextType = {
    // User & Auth State
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    userId,

    // Google & Sync Status
    googleStatus,
    syncStatus,
    isSyncLoading,
    isGoogleConnected: googleStatus?.isConnected ?? false,
    isSyncEnabled: syncStatus?.enabled ?? false,

    // Auth Actions
    login,
    register,
    loginWithGoogle,
    logout,
    refreshAuth,

    // OAuth Callback Handler
    handleOAuthCallback,

    // Google Actions
    connectGoogle,
    disconnectGoogle,
    checkGoogleStatus,

    // Sync Actions
    checkSyncStatus,
    initializeSync,
    disconnectSync,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
