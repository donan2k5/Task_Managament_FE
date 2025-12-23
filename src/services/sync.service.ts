import api from "./api";
import {
  SyncResult,
  TaskWithSync,
  SyncStatus,
  SyncInitializeResponse,
} from "@/types/index";

export const syncService = {
  // Initialize sync - creates "Axis" calendar and sets up webhooks
  initialize: async (userId: string): Promise<SyncInitializeResponse> => {
    const response = await api.post<SyncInitializeResponse>(
      `/sync/initialize?userId=${userId}`
    );
    return response.data;
  },

  // Get sync status
  getStatus: async (userId: string): Promise<SyncStatus> => {
    const response = await api.get<SyncStatus>(
      `/sync/status?userId=${userId}`
    );
    return response.data;
  },

  // Disconnect sync (keeps OAuth connection)
  disconnect: async (userId: string): Promise<void> => {
    await api.delete(`/sync/disconnect?userId=${userId}`);
  },

  // Sync single task to Google Calendar
  syncTask: async (taskId: string, userId: string): Promise<TaskWithSync> => {
    const response = await api.post<TaskWithSync>(
      `/sync/task/${taskId}?userId=${userId}`
    );
    return response.data;
  },

  // Sync all tasks to Google Calendar
  syncAllTasks: async (userId: string): Promise<SyncResult> => {
    const response = await api.post<SyncResult>(
      `/sync/tasks/all?userId=${userId}`
    );
    return response.data;
  },

  // Pull changes from Google Calendar to the app
  syncFromGoogle: async (userId: string): Promise<SyncResult> => {
    const response = await api.post<SyncResult>(
      `/sync/from-google?userId=${userId}`
    );
    return response.data;
  },

  // Enable webhook for real-time sync
  enableWebhook: async (userId: string): Promise<void> => {
    await api.post(`/sync/webhook/enable?userId=${userId}`);
  },

  // Disable webhook
  disableWebhook: async (userId: string): Promise<void> => {
    await api.delete(`/sync/webhook/disable?userId=${userId}`);
  },
};
