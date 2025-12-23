import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { authService } from "@/services/auth.service";
import { syncService } from "@/services/sync.service";
import { GoogleAuthStatus, SyncStatus } from "@/types/index";

interface AuthContextType {
  userId: string | null;
  googleStatus: GoogleAuthStatus | null;
  syncStatus: SyncStatus | null;
  isLoading: boolean;
  isSyncLoading: boolean;
  isGoogleConnected: boolean;
  isSyncEnabled: boolean;
  connectGoogle: () => void;
  disconnectGoogle: () => Promise<void>;
  checkGoogleStatus: () => Promise<void>;
  checkSyncStatus: () => Promise<void>;
  initializeSync: () => Promise<boolean>;
  disconnectSync: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [googleStatus, setGoogleStatus] = useState<GoogleAuthStatus | null>(
    null
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncLoading, setIsSyncLoading] = useState(false);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedUserId = authService.getUserId();
    if (storedUserId) {
      setUserId(storedUserId);
    }
    setIsLoading(false);
  }, []);

  // Check Google status when userId changes
  useEffect(() => {
    if (userId) {
      checkGoogleStatus();
      checkSyncStatus();
    } else {
      setGoogleStatus(null);
      setSyncStatus(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const checkGoogleStatus = useCallback(async () => {
    if (!userId) return;

    try {
      const status = await authService.checkGoogleStatus(userId);
      setGoogleStatus(status);
    } catch (error) {
      console.error("Failed to check Google status:", error);
      setGoogleStatus({ isConnected: false });
    }
  }, [userId]);

  const checkSyncStatus = useCallback(async () => {
    if (!userId) return;

    try {
      const status = await syncService.getStatus(userId);
      setSyncStatus(status);
    } catch (error) {
      console.error("Failed to check sync status:", error);
      setSyncStatus({ enabled: false, calendarId: null, webhookActive: false });
    }
  }, [userId]);

  const initializeSync = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;

    setIsSyncLoading(true);
    try {
      await syncService.initialize(userId);
      await checkSyncStatus();
      return true;
    } catch (error) {
      console.error("Failed to initialize sync:", error);
      return false;
    } finally {
      setIsSyncLoading(false);
    }
  }, [userId, checkSyncStatus]);

  const disconnectSync = useCallback(async () => {
    if (!userId) return;

    setIsSyncLoading(true);
    try {
      await syncService.disconnect(userId);
      setSyncStatus({ enabled: false, calendarId: null, webhookActive: false });
    } catch (error) {
      console.error("Failed to disconnect sync:", error);
      throw error;
    } finally {
      setIsSyncLoading(false);
    }
  }, [userId]);

  const connectGoogle = useCallback(() => {
    authService.connectGoogle();
  }, []);

  const disconnectGoogle = useCallback(async () => {
    if (!userId) return;

    try {
      await authService.disconnectGoogle(userId);
      setGoogleStatus({ isConnected: false });
      setSyncStatus({ enabled: false, calendarId: null, webhookActive: false });
    } catch (error) {
      console.error("Failed to disconnect Google:", error);
      throw error;
    }
  }, [userId]);

  const logout = useCallback(() => {
    authService.removeUserId();
    setUserId(null);
    setGoogleStatus(null);
    setSyncStatus(null);
  }, []);

  // Handle auth callback - call this after OAuth redirect
  useEffect(() => {
    const handleAuthCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const callbackUserId = params.get("userId");
      const success = params.get("success");

      if (success === "true" && callbackUserId) {
        authService.setUserId(callbackUserId);
        setUserId(callbackUserId);
        // Clean up URL params
        window.history.replaceState({}, "", window.location.pathname);
      }
    };

    // Check if we're on the callback page
    if (window.location.pathname === "/auth/callback") {
      handleAuthCallback();
    }
  }, []);

  const value: AuthContextType = {
    userId,
    googleStatus,
    syncStatus,
    isLoading,
    isSyncLoading,
    isGoogleConnected: googleStatus?.isConnected ?? false,
    isSyncEnabled: syncStatus?.enabled ?? false,
    connectGoogle,
    disconnectGoogle,
    checkGoogleStatus,
    checkSyncStatus,
    initializeSync,
    disconnectSync,
    logout,
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
