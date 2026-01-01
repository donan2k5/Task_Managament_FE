import api from "./api";
import {
  SyncResult,
  TaskWithSync,
  SyncStatus,
  SyncInitializeResponse,
} from "@/types/index";

// All endpoints use JWT token for authentication
// Backend extracts userId from JWT, no need to pass userId
export const syncService = {
  // Initialize sync - creates "Axis" calendar and sets up webhooks
  initialize: async (): Promise<SyncInitializeResponse> => {
    const response = await api.post<SyncInitializeResponse>("/sync/initialize");
    return response.data;
  },

  // Get sync status
  getStatus: async (): Promise<SyncStatus> => {
    const response = await api.get<SyncStatus>("/sync/status");
    return response.data;
  },

  // Disconnect sync (keeps OAuth connection)
  disconnect: async (): Promise<void> => {
    await api.delete("/sync/disconnect");
  },

  // Sync single task to Google Calendar
  syncTask: async (taskId: string): Promise<TaskWithSync> => {
    const response = await api.post<TaskWithSync>(`/sync/task/${taskId}`);
    return response.data;
  },

  // Sync all tasks to Google Calendar
  syncAllTasks: async (): Promise<SyncResult> => {
    const response = await api.post<SyncResult>("/sync/tasks/all");
    return response.data;
  },

  // Pull changes from Google Calendar to the app
  syncFromGoogle: async (): Promise<SyncResult> => {
    const response = await api.post<SyncResult>("/sync/from-google");
    return response.data;
  },

  // Enable webhook for real-time sync
  enableWebhook: async (): Promise<void> => {
    await api.post("/sync/webhook/enable");
  },

  // Disable webhook
  disableWebhook: async (): Promise<void> => {
    await api.delete("/sync/webhook/disable");
  },
};
