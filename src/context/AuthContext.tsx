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
import { authStateManager, userStorage } from "@/services/tokenManager";
import {
  AuthUser,
  GoogleAuthStatus,
  SyncStatus,
} from "@/types/index";

interface AuthContextType {
  // User & Auth State
  user: AuthUser | null;
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

  // OAuth Callback Handler (cookies already set by server)
  handleOAuthCallback: () => Promise<void>;

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
  // User is authenticated if we have user data (cookies are sent automatically)
  const isAuthenticated = !!user;

  /**
   * App Initialization Flow (Cookie-based Auth):
   * 1. Check if we have user data in localStorage (for immediate UX)
   * 2. Call /auth/me to verify session is still valid
   *    - Browser automatically sends HTTP-only cookies
   *    - If valid: update user data
   *    - If invalid (401): clear local data, user needs to login
   */
  useEffect(() => {
    const initAuth = async () => {
      // Try to get stored user for immediate UX
      const storedUser = userStorage.get<AuthUser>();
      if (storedUser) {
        setUser(storedUser);
      }

      // Verify session with server (cookies sent automatically)
      try {
        const currentUser = await authService.checkAuth();
        if (currentUser) {
          setUser(currentUser);
          authStateManager.setAuthenticated(true);
        } else {
          // Session invalid - clear local data
          setUser(null);
          authStateManager.setAuthenticated(false);
        }
      } catch {
        // Auth check failed - clear local data
        setUser(null);
        authStateManager.setAuthenticated(false);
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Check Google & Sync status ONCE when user is authenticated
  useEffect(() => {
    // Only check status if user is authenticated AND hasn't checked yet
    if (userId && !hasCheckedStatus.current) {
      hasCheckedStatus.current = true;
      checkGoogleStatus();
      checkSyncStatus();
    }
    // Reset flag when user logs out
    if (!userId) {
      hasCheckedStatus.current = false;
      setGoogleStatus(null);
      setSyncStatus(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ==================== Auth Actions ====================

  const login = useCallback(async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    setUser(response.user);
    authStateManager.setAuthenticated(true);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const response = await authService.register({ name, email, password });
      setUser(response.user);
      authStateManager.setAuthenticated(true);
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
    setGoogleStatus(null);
    setSyncStatus(null);
    authStateManager.setAuthenticated(false);
  }, []);

  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await authService.refreshAccessToken();
      if (response) {
        setUser(response.user);
        authStateManager.setAuthenticated(true);
        return true;
      }
      return false;
    } catch {
      setUser(null);
      authStateManager.setAuthenticated(false);
      return false;
    }
  }, []);

  /**
   * Handle OAuth callback - called from AuthCallback page
   * Cookies are already set by server, just need to fetch user profile
   */
  const handleOAuthCallback = useCallback(async () => {
    try {
      // Fetch user profile (cookies already set by server)
      const profile = await authService.getProfile();
      if (profile) {
        setUser(profile);
        userStorage.set(profile);
        authStateManager.setAuthenticated(true);
      }
    } catch {
      // Profile fetch failed
      console.error("Failed to fetch user profile after OAuth");
    }
  }, []);

  // ==================== Google Actions ====================

  const connectGoogle = useCallback(() => {
    sessionStorage.setItem("authRedirect", window.location.pathname);
    authService.connectGoogle();
  }, []);

  const checkGoogleStatus = useCallback(async () => {
    // Only check if user is authenticated
    if (!user) return;

    try {
      const status = await authService.checkGoogleStatus();
      setGoogleStatus(status);
    } catch (error) {
      console.error("Failed to check Google status:", error);
      setGoogleStatus({ isConnected: false });
    }
  }, [user]);

  const disconnectGoogle = useCallback(async () => {
    if (!user) return;

    try {
      await authService.disconnectGoogle();
      setGoogleStatus({ isConnected: false });
      setSyncStatus({ enabled: false, calendarId: null, webhookActive: false });
    } catch (error) {
      console.error("Failed to disconnect Google:", error);
      throw error;
    }
  }, [user]);

  // ==================== Sync Actions ====================

  const checkSyncStatus = useCallback(async () => {
    if (!user) return;

    try {
      const status = await syncService.getStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error("Failed to check sync status:", error);
      setSyncStatus({ enabled: false, calendarId: null, webhookActive: false });
    }
  }, [user]);

  const initializeSync = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

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
  }, [user, checkSyncStatus]);

  const disconnectSync = useCallback(async () => {
    if (!user) return;

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
  }, [user]);

  const value: AuthContextType = {
    // User & Auth State
    user,
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
