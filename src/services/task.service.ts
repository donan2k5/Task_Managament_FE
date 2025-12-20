import api from "./api";
import { Task } from "@/types/index";

export const taskService = {
  // ... các hàm cũ giữ nguyên ...
  getAll: async () => {
    const response = await api.get<Task[]>("/tasks");
    return response.data;
  },

  // NEW: Lấy task theo dải thời gian cho Calendar
  getCalendarTasks: async (start: Date, end: Date) => {
    const response = await api.get<Task[]>("/tasks/calendar", {
      params: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    });
    return response.data;
  },

  create: async (data: Partial<Task>) => {
    const response = await api.post<Task>("/tasks", data);
    return response.data;
  },

  update: async (id: string, data: Partial<Task>) => {
    const response = await api.patch<Task>(`/tasks/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<Task>(`/tasks/${id}`);
    return response.data;
  },
};
