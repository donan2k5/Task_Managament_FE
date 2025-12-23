import api from "./api";
import { GoogleAuthStatus, TokenRefreshResult } from "@/types/index";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const authService = {
  // Get Google OAuth URL - redirects browser to Google consent screen
  getGoogleAuthUrl: (): string => {
    return `${BASE_URL}/auth/google`;
  },

  // Redirect to Google OAuth flow
  connectGoogle: (): void => {
    window.location.href = `${BASE_URL}/auth/google`;
  },

  // Check if user has valid Google connection
  checkGoogleStatus: async (userId: string): Promise<GoogleAuthStatus> => {
    const response = await api.get<GoogleAuthStatus>(
      `/auth/google/status/${userId}`
    );
    return response.data;
  },

  // Disconnect Google account
  disconnectGoogle: async (userId: string): Promise<void> => {
    await api.delete(`/auth/google/disconnect/${userId}`);
  },

  // Manually refresh access token
  refreshToken: async (userId: string): Promise<TokenRefreshResult> => {
    const response = await api.post<TokenRefreshResult>(
      `/auth/google/refresh/${userId}`
    );
    return response.data;
  },

  // Get userId from localStorage
  getUserId: (): string | null => {
    return localStorage.getItem("userId");
  },

  // Save userId to localStorage
  setUserId: (userId: string): void => {
    localStorage.setItem("userId", userId);
  },

  // Remove userId from localStorage
  removeUserId: (): void => {
    localStorage.removeItem("userId");
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem("userId");
  },
};
