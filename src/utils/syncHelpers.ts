interface TaskSyncEligibilityProps {
  hasScheduledDate: boolean;
  isSyncEnabled: boolean;
}

export const getTaskSyncEligibility = ({
  hasScheduledDate,
  isSyncEnabled,
}: TaskSyncEligibilityProps): {
  eligible: boolean;
  reason?: string;
} => {
  if (!isSyncEnabled) {
    return {
      eligible: false,
      reason: "Google Calendar sync is not enabled",
    };
  }

  if (!hasScheduledDate) {
    return {
      eligible: false,
      reason: "Task must have a scheduled date to sync",
    };
  }

  return { eligible: true };
};

export const formatLastSyncTime = (lastSyncedAt?: string): string => {
  if (!lastSyncedAt) return "Never synced";

  const syncDate = new Date(lastSyncedAt);
  const now = new Date();
  const diffMs = now.getTime() - syncDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
};
