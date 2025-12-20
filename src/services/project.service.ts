import api from "./api";
import { Project } from "@/types/index";

export const projectService = {
  getAll: async () => {
    const response = await api.get<Project[]>("/projects");
    return response.data;
  },
  create: async (data: Partial<Project>) => {
    const response = await api.post<Project>("/projects", data);
    return response.data;
  },
};
