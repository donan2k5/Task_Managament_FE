import api from "./api";

export const dashboardService = {
  getSummary: async () => {
    const response = await api.get("/dashboard/summary");
    return response.data;
  },
  getWeeklyReport: async (date?: string) => {
    const params = date ? { date } : {};
    const response = await api.get("/dashboard/reports/weekly", { params });
    return response.data;
  },
};
