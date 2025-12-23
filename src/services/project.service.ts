import api from "./api";
import { Project, Task } from "@/types/index";

export const projectService = {
  getAll: async () => {
    const response = await api.get<Project[]>("/projects");
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<Project>(`/projects/${id}`);
    return response.data;
  },

  getTasks: async (projectId: string) => {
    const response = await api.get<Task[]>(`/projects/${projectId}/tasks`);
    return response.data;
  },

  create: async (data: Partial<Project>) => {
    const response = await api.post<Project>("/projects", data);
    return response.data;
  },

  update: async (id: string, data: Partial<Project>) => {
    const response = await api.patch<Project>(`/projects/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },
};
