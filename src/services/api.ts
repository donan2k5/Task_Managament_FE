import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { userStorage, userIdStorage, clearAllAuthData } from "./tokenManager";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Flag to prevent multiple refresh attempts and redirect loops
let isRefreshing = false;
let hasRedirected = false;
let failedQueue: Array<{
  resolve: () => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

const clearAuthAndRedirect = () => {
  // Only redirect once
  if (hasRedirected) return;
  hasRedirected = true;

  clearAllAuthData();

  // Only redirect if not already on login page
  if (
    !window.location.pathname.startsWith("/login") &&
    !window.location.pathname.startsWith("/register") &&
    !window.location.pathname.startsWith("/auth/callback")
  ) {
    window.location.href = "/login";
  }
};

// Reset redirect flag when page loads
if (typeof window !== "undefined") {
  window.addEventListener("load", () => {
    hasRedirected = false;
  });
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Send cookies automatically
});

// No request interceptor needed - cookies are sent automatically with withCredentials

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If no config or already retried, just reject
    if (!originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If error is not 401, just reject
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // If already refreshing, queue this request
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: () => {
            resolve(api(originalRequest));
          },
          reject: (err: Error) => {
            reject(err);
          },
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Refresh token using fetch with credentials (cookies)
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Send cookies
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const data = await response.json();

      // Only store user data (tokens are in HTTP-only cookies)
      if (data.user) {
        userStorage.set(data.user);
        userIdStorage.set(data.user.id);
      }

      // Process queued requests
      processQueue(null);

      // Retry original request (cookies already updated by server)
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh failed - clear auth and redirect
      processQueue(new Error("Token refresh failed"));
      clearAuthAndRedirect();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
