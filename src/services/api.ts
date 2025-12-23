import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add userId for auto-sync
api.interceptors.request.use((config) => {
  const userId = localStorage.getItem("userId");
  // Only add userId if not already present in params (avoid duplication)
  if (userId && !config.params?.userId) {
    config.params = {
      ...config.params,
      userId,
    };
  }
  return config;
});

export default api;
