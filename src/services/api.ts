import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import {
  tokenManager,
  refreshTokenStorage,
  userStorage,
  userIdStorage,
  clearAllAuthData,
} from "./tokenManager";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Flag to prevent multiple refresh attempts and redirect loops
let isRefreshing = false;
let hasRedirected = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
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

// Reset redirect flag when page loads (in case user manually navigates)
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
});

// Request interceptor to add auth header
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Lấy access token từ memory (không phải localStorage)
  const accessToken = tokenManager.getAccessToken();

  // Add Authorization header if token exists
  // Backend sẽ extract userId từ JWT token, không cần gửi userId riêng
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

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

    // Check if we have a refresh token
    const refreshToken = refreshTokenStorage.get();
    if (!refreshToken) {
      // No refresh token - clear auth and redirect (but don't retry)
      clearAuthAndRedirect();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // If already refreshing, queue this request
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
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
      // Refresh the token using fetch to avoid interceptor loops
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const data = await response.json();

      // Store new tokens properly
      // Access token -> memory only
      tokenManager.setAccessToken(data.accessToken);

      // Refresh token -> localStorage
      refreshTokenStorage.set(data.refreshToken);

      // User data -> localStorage
      if (data.user) {
        userStorage.set(data.user);
        userIdStorage.set(data.user.id);
      }

      // Update authorization header
      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

      // Process queued requests
      processQueue(null, data.accessToken);

      return api(originalRequest);
    } catch (refreshError) {
      // Refresh failed - clear auth and redirect
      processQueue(new Error("Token refresh failed"), null);
      clearAuthAndRedirect();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
