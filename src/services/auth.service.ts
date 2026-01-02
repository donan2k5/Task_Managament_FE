import api from "./api";
import {
  AuthUser,
  LoginDto,
  RegisterDto,
  GoogleAuthStatus,
  TokenRefreshResult,
  SetPasswordDto,
} from "@/types/index";
import {
  authStateManager,
  userStorage,
  userIdStorage,
  clearAllAuthData,
} from "./tokenManager";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Cookie auth response (no tokens in body)
interface CookieAuthResponse {
  user: AuthUser;
}

export const authService = {
  // ==================== Email/Password Authentication ====================

  // Register new user
  register: async (data: RegisterDto): Promise<CookieAuthResponse> => {
    const response = await api.post<CookieAuthResponse>("/auth/register", data);
    authService.handleAuthSuccess(response.data);
    return response.data;
  },

  // Login with email/password
  login: async (data: LoginDto): Promise<CookieAuthResponse> => {
    const response = await api.post<CookieAuthResponse>("/auth/login", data);
    authService.handleAuthSuccess(response.data);
    return response.data;
  },

  /**
   * Check auth status by calling /auth/me
   * Cookies are sent automatically
   */
  checkAuth: async (): Promise<AuthUser | null> => {
    try {
      const response = await api.get<AuthUser>("/auth/me");
      authService.handleAuthSuccess({ user: response.data });
      return response.data;
    } catch {
      clearAllAuthData();
      return null;
    }
  },

  /**
   * Refresh tokens (cookies handled by server)
   */
  refreshAccessToken: async (): Promise<CookieAuthResponse | null> => {
    try {
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Send cookies
      });

      if (!response.ok) {
        clearAllAuthData();
        return null;
      }

      const data: CookieAuthResponse = await response.json();
      authService.handleAuthSuccess(data);
      return data;
    } catch (error) {
      console.error("Token refresh failed:", error);
      clearAllAuthData();
      return null;
    }
  },

  // Logout current device
  logout: async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout API error:", error);
    }
    clearAllAuthData();
  },

  // Logout all devices
  logoutAll: async (): Promise<void> => {
    try {
      await api.post("/auth/logout-all");
    } catch (error) {
      console.error("Logout all API error:", error);
    }
    clearAllAuthData();
  },

  // Get current user profile
  getProfile: async (): Promise<AuthUser | null> => {
    try {
      const response = await api.get<AuthUser>("/auth/me");
      return response.data;
    } catch {
      return null;
    }
  },

  // Set password for Google-only users
  setPassword: async (data: SetPasswordDto): Promise<void> => {
    await api.post("/auth/set-password", data);
  },

  // ==================== Google OAuth ====================

  // Get Google OAuth URL - redirects browser to Google consent screen
  getGoogleAuthUrl: (): string => {
    return `${BASE_URL}/auth/google`;
  },

  // Redirect to Google OAuth flow
  connectGoogle: (): void => {
    window.location.href = `${BASE_URL}/auth/google`;
  },

  // Check if user has valid Google connection
  // Backend extracts userId from JWT token
  checkGoogleStatus: async (): Promise<GoogleAuthStatus> => {
    const response = await api.get<GoogleAuthStatus>("/auth/google/status");
    return response.data;
  },

  // Disconnect Google account
  // Backend extracts userId from JWT token
  disconnectGoogle: async (): Promise<void> => {
    await api.delete("/auth/google/disconnect");
  },

  // Manually refresh Google access token
  // Backend extracts userId from JWT token
  refreshGoogleToken: async (): Promise<TokenRefreshResult> => {
    const response = await api.post<TokenRefreshResult>("/auth/google/refresh");
    return response.data;
  },

  // ==================== Auth State Management ====================

  /**
   * Handle successful auth - store user data
   * Tokens are in HTTP-only cookies (managed by server)
   */
  handleAuthSuccess: (data: CookieAuthResponse): void => {
    // User data -> localStorage (for persistence across reloads)
    userStorage.set(data.user);
    userIdStorage.set(data.user.id);
    // Update auth state
    authStateManager.setAuthenticated(true);
  },

  // Get stored user data
  getStoredUser: (): AuthUser | null => {
    return userStorage.get<AuthUser>();
  },

  // Clear all auth data
  clearAuth: (): void => {
    clearAllAuthData();
  },

  // Check if user is authenticated (based on stored user data)
  isAuthenticated: (): boolean => {
    return authStateManager.isAuthenticated();
  },

  // ==================== Legacy Methods (for backward compatibility) ====================

  // Get userId from localStorage
  getUserId: (): string | null => {
    const user = authService.getStoredUser();
    return user?.id || userIdStorage.get();
  },

  // Save userId to localStorage
  setUserId: (userId: string): void => {
    userIdStorage.set(userId);
  },

  // Remove userId from localStorage
  removeUserId: (): void => {
    userIdStorage.clear();
  },

  // Refresh token (legacy - for Google token refresh)
  refreshToken: async (): Promise<TokenRefreshResult> => {
    return authService.refreshGoogleToken();
  },

  // Legacy compatibility - these do nothing now with cookie auth
  getAccessToken: (): string | null => null,
  getRefreshToken: (): string | null => null,
  hasRefreshToken: (): boolean => false,
  hasAccessToken: (): boolean => authStateManager.isAuthenticated(),
};
