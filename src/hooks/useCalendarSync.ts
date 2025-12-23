import { useState, useCallback } from "react";
import { syncService } from "@/services/sync.service";
import { useAuth } from "@/context/AuthContext";
import { SyncResult, TaskWithSync } from "@/types/index";
import { toast } from "sonner";

// Sync lock to prevent concurrent sync operations
const syncLocks = new Set<string>();

export const useCalendarSync = () => {
  const {
    userId,
    isGoogleConnected,
    isSyncEnabled,
    syncStatus,
    initializeSync,
    disconnectSync,
    checkSyncStatus,
  } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Acquire lock for a resource
  const acquireLock = useCallback((resourceId: string): boolean => {
    if (syncLocks.has(resourceId)) {
      return false;
    }
    syncLocks.add(resourceId);
    return true;
  }, []);

  // Release lock for a resource
  const releaseLock = useCallback((resourceId: string): void => {
    syncLocks.delete(resourceId);
  }, []);

  // Execute with lock
  const withLock = useCallback(
    async <T>(resourceId: string, fn: () => Promise<T>): Promise<T | null> => {
      if (!acquireLock(resourceId)) {
        toast.info("Sync already in progress");
        return null;
      }

      try {
        return await fn();
      } finally {
        releaseLock(resourceId);
      }
    },
    [acquireLock, releaseLock]
  );

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
        return true;
      }
      return false;
    },
    []
  );

  // Initialize sync (creates Axis calendar)
  const handleInitializeSync = useCallback(async (): Promise<boolean> => {
    if (!userId) {
      toast.error("User not authenticated");
      return false;
    }

    return withLock("initialize-sync", async () => {
      setIsLoading(true);
      setError(null);

      try {
        const success = await initializeSync();
        if (success) {
          toast.success("Google Calendar sync initialized! Your Axis calendar is ready.");
        } else {
          toast.error("Failed to initialize sync");
        }
        return success;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to initialize sync";
        if (!handleAuthError(message)) {
          setError(message);
          toast.error(message);
        }
        return false;
      } finally {
        setIsLoading(false);
      }
    }) ?? false;
  }, [userId, initializeSync, handleAuthError, withLock]);

  // Disconnect sync
  const handleDisconnectSync = useCallback(async (): Promise<boolean> => {
    if (!userId) {
      toast.error("User not authenticated");
      return false;
    }

    return withLock("disconnect-sync", async () => {
      setIsLoading(true);
      setError(null);

      try {
        await disconnectSync();
        toast.success("Google Calendar sync disconnected");
        return true;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to disconnect sync";
        setError(message);
        toast.error(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    }) ?? false;
  }, [userId, disconnectSync, withLock]);

  // Sync single task to Google Calendar
  const syncTask = useCallback(
    async (taskId: string): Promise<TaskWithSync | null> => {
      if (!userId) {
        toast.error("User not authenticated");
        return null;
      }

      if (!isSyncEnabled) {
        toast.error("Please enable Google Calendar sync first");
        return null;
      }

      return withLock(`task-${taskId}`, async () => {
        setIsLoading(true);
        setError(null);

        try {
          const result = await syncService.syncTask(taskId, userId);
          toast.success("Task synced to Google Calendar");
          return result;
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : "Failed to sync task";
          if (!handleAuthError(message)) {
            setError(message);
            toast.error(message);
          }
          return null;
        } finally {
          setIsLoading(false);
        }
      });
    },
    [userId, isSyncEnabled, handleAuthError, withLock]
  );

  // Sync all tasks to Google Calendar
  const syncAllTasks = useCallback(async (): Promise<SyncResult | null> => {
    if (!userId) {
      toast.error("User not authenticated");
      return null;
    }

    if (!isSyncEnabled) {
      toast.error("Please enable Google Calendar sync first");
      return null;
    }

    return withLock("sync-all-tasks", async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await syncService.syncAllTasks(userId);

        if (result.success) {
          toast.success(`Successfully synced ${result.synced} tasks to Google Calendar`);
        } else if (result.synced > 0 && result.failed > 0) {
          toast.warning(
            `Synced ${result.synced} tasks, but ${result.failed} failed`
          );
        } else if (result.failed > 0) {
          toast.error(`Failed to sync ${result.failed} tasks`);
        }

        return result;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to sync tasks";
        if (!handleAuthError(message)) {
          setError(message);
          toast.error(message);
        }
        return null;
      } finally {
        setIsLoading(false);
      }
    });
  }, [userId, isSyncEnabled, handleAuthError, withLock]);

  // Sync from Google to App
  const syncFromGoogle = useCallback(async (): Promise<SyncResult | null> => {
    if (!userId) {
      toast.error("User not authenticated");
      return null;
    }

    if (!isSyncEnabled) {
      toast.error("Please enable Google Calendar sync first");
      return null;
    }

    return withLock("sync-from-google", async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await syncService.syncFromGoogle(userId);

        if (result.success) {
          toast.success(`Synced ${result.synced} events from Google Calendar`);
        } else if (result.synced > 0 && result.failed > 0) {
          toast.warning(
            `Synced ${result.synced} events, but ${result.failed} failed`
          );
        } else if (result.failed > 0) {
          toast.error(`Failed to sync ${result.failed} events`);
        }

        return result;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to sync from Google";
        if (!handleAuthError(message)) {
          setError(message);
          toast.error(message);
        }
        return null;
      } finally {
        setIsLoading(false);
      }
    });
  }, [userId, isSyncEnabled, handleAuthError, withLock]);

  // Enable webhook
  const enableWebhook = useCallback(async (): Promise<boolean> => {
    if (!userId) {
      toast.error("User not authenticated");
      return false;
    }

    return withLock("enable-webhook", async () => {
      setIsLoading(true);
      setError(null);

      try {
        await syncService.enableWebhook(userId);
        await checkSyncStatus();
        toast.success("Real-time sync enabled");
        return true;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to enable webhook";
        if (!handleAuthError(message)) {
          setError(message);
          toast.error(message);
        }
        return false;
      } finally {
        setIsLoading(false);
      }
    }) ?? false;
  }, [userId, checkSyncStatus, handleAuthError, withLock]);

  // Disable webhook
  const disableWebhook = useCallback(async (): Promise<boolean> => {
    if (!userId) {
      toast.error("User not authenticated");
      return false;
    }

    return withLock("disable-webhook", async () => {
      setIsLoading(true);
      setError(null);

      try {
        await syncService.disableWebhook(userId);
        await checkSyncStatus();
        toast.success("Real-time sync disabled");
        return true;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to disable webhook";
        setError(message);
        toast.error(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    }) ?? false;
  }, [userId, checkSyncStatus, withLock]);

  return {
    isLoading,
    error,
    isGoogleConnected,
    isSyncEnabled,
    syncStatus,
    initializeSync: handleInitializeSync,
    disconnectSync: handleDisconnectSync,
    syncTask,
    syncAllTasks,
    syncFromGoogle,
    enableWebhook,
    disableWebhook,
    checkSyncStatus,
  };
};
