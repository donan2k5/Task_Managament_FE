import { Cloud, CloudOff, RefreshCw, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { getTaskSyncEligibility } from "@/utils/syncHelpers";

export { getTaskSyncEligibility };

interface SyncStatusBadgeProps {
  synced: boolean;
  lastSyncedAt?: string;
  variant?: "default" | "compact";
}

export const SyncStatusBadge = ({
  synced,
  lastSyncedAt,
  variant = "default",
}: SyncStatusBadgeProps) => {
  const formattedDate = lastSyncedAt
    ? format(new Date(lastSyncedAt), "MMM d, yyyy h:mm a")
    : null;

  if (!synced) {
    if (variant === "compact") {
      return (
        <Tooltip>
          <TooltipTrigger>
            <CloudOff className="w-4 h-4 text-gray-400" />
          </TooltipTrigger>
          <TooltipContent>Not synced with Google Calendar</TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Badge variant="secondary" className="gap-1">
        <CloudOff className="w-3 h-3" />
        Not Synced
      </Badge>
    );
  }

  if (variant === "compact") {
    return (
      <Tooltip>
        <TooltipTrigger>
          <Cloud className="w-4 h-4 text-green-500" />
        </TooltipTrigger>
        <TooltipContent>
          Synced with Google Calendar
          {formattedDate && <span className="block text-xs">{formattedDate}</span>}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger>
        <Badge variant="default" className="gap-1 bg-green-100 text-green-800">
          <Cloud className="w-3 h-3" />
          Synced
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        {formattedDate ? `Last synced: ${formattedDate}` : "Synced with Google Calendar"}
      </TooltipContent>
    </Tooltip>
  );
};

interface TaskSyncButtonProps {
  taskId: string;
  isSynced: boolean;
  eligibility: { eligible: boolean; reason?: string };
  onSync: (taskId: string) => void;
  isLoading?: boolean;
}

export const TaskSyncButton = ({
  taskId,
  isSynced,
  eligibility,
  onSync,
  isLoading = false,
}: TaskSyncButtonProps) => {
  if (!eligibility.eligible) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <button disabled className="p-1.5 rounded-md bg-gray-100 cursor-not-allowed">
            <Calendar className="w-4 h-4 text-gray-400" />
          </button>
        </TooltipTrigger>
        <TooltipContent>{eligibility.reason}</TooltipContent>
      </Tooltip>
    );
  }

  if (isLoading) {
    return (
      <button disabled className="p-1.5 rounded-md bg-blue-100">
        <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
      </button>
    );
  }

  if (isSynced) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <div className="p-1.5 rounded-md bg-green-100">
            <Cloud className="w-4 h-4 text-green-600" />
          </div>
        </TooltipTrigger>
        <TooltipContent>Synced with Google Calendar</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger>
        <button
          onClick={() => onSync(taskId)}
          className="p-1.5 rounded-md bg-gray-100 hover:bg-blue-100 transition-colors"
        >
          <Calendar className="w-4 h-4 text-gray-600 hover:text-blue-600" />
        </button>
      </TooltipTrigger>
      <TooltipContent>Click to sync with Google Calendar</TooltipContent>
    </Tooltip>
  );
};

interface GlobalSyncStatusProps {
  isEnabled: boolean;
  webhookActive: boolean;
}

export const GlobalSyncStatus = ({ isEnabled, webhookActive }: GlobalSyncStatusProps) => {
  if (!isEnabled) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="secondary" className="gap-1">
            <CloudOff className="w-3 h-3" />
            Sync Off
          </Badge>
        </TooltipTrigger>
        <TooltipContent>Google Calendar sync is disabled</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger>
        <Badge
          variant="default"
          className={`gap-1 ${
            webhookActive
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          <Cloud className="w-3 h-3" />
          {webhookActive ? "Syncing" : "Sync Active"}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        {webhookActive
          ? "Real-time sync active with Google Calendar"
          : "Sync active (real-time updates may be delayed)"}
      </TooltipContent>
    </Tooltip>
  );
};
