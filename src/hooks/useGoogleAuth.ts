import { useCallback, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";

export const useGoogleAuth = () => {
  const {
    userId,
    googleStatus,
    syncStatus,
    isLoading,
    isSyncLoading,
    isGoogleConnected,
    isSyncEnabled,
    connectGoogle,
    disconnectGoogle,
    checkGoogleStatus,
    checkSyncStatus,
    initializeSync,
    disconnectSync,
    logout,
  } = useAuth();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleConnectGoogle = useCallback(() => {
    // Store current page for redirect after auth
    sessionStorage.setItem("authRedirect", window.location.pathname);
    connectGoogle();
  }, [connectGoogle]);

  const handleDisconnectGoogle = useCallback(async () => {
    try {
      await disconnectGoogle();
      toast.success("Google account disconnected");
    } catch (error) {
      toast.error("Failed to disconnect Google account");
      throw error;
    }
  }, [disconnectGoogle]);

  const refreshToken = useCallback(async () => {
    if (!userId) return null;

    setIsRefreshing(true);
    try {
      const result = await authService.refreshToken(userId);
      toast.success("Token refreshed successfully");
      return result;
    } catch (error) {
      toast.error("Failed to refresh token");
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  }, [userId]);

  // Check if we need to reconnect (for handling auth errors)
  const handleAuthError = useCallback(
    (errorMessage: string) => {
      const authErrors = [
        "Google Calendar not connected",
        "Google authentication expired",
        "Failed to refresh Google token",
      ];

      if (authErrors.some((msg) => errorMessage.includes(msg))) {
        toast.warning("Please reconnect your Google account to continue");
        sessionStorage.setItem("authRedirect", window.location.pathname);
        connectGoogle();
        return true;
      }
      return false;
    },
    [connectGoogle]
  );

  return {
    userId,
    googleStatus,
    syncStatus,
    isLoading,
    isSyncLoading,
    isGoogleConnected,
    isSyncEnabled,
    isRefreshing,
    connectGoogle: handleConnectGoogle,
    disconnectGoogle: handleDisconnectGoogle,
    refreshToken,
    checkGoogleStatus,
    checkSyncStatus,
    initializeSync,
    disconnectSync,
    handleAuthError,
    logout,
  };
};
