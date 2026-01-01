import api from "./api";
import {
  AuthUser,
  AuthResponse,
  LoginDto,
  RegisterDto,
  GoogleAuthStatus,
  TokenRefreshResult,
  SetPasswordDto,
} from "@/types/index";
import {
  tokenManager,
  refreshTokenStorage,
  userStorage,
  userIdStorage,
  clearAllAuthData,
} from "./tokenManager";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const authService = {
  // ==================== Email/Password Authentication ====================

  // Register new user
  register: async (data: RegisterDto): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/register", data);
    authService.handleAuthSuccess(response.data);
    return response.data;
  },

  // Login with email/password
  login: async (data: LoginDto): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/login", data);
    authService.handleAuthSuccess(response.data);
    return response.data;
  },

  /**
   * Refresh access token
   * - Gọi khi app khởi động (có refresh token trong storage)
   * - Gọi khi nhận 401 từ API
   */
  refreshAccessToken: async (): Promise<AuthResponse | null> => {
    const refreshToken = refreshTokenStorage.get();
    if (!refreshToken) return null;

    try {
      // Use fetch directly to avoid interceptor loops
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        clearAllAuthData();
        return null;
      }

      const data: AuthResponse = await response.json();
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
    const refreshToken = refreshTokenStorage.get();
    const accessToken = tokenManager.getAccessToken();

    if (refreshToken && accessToken) {
      try {
        await fetch(`${BASE_URL}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ refreshToken }),
        });
      } catch (error) {
        console.error("Logout API error:", error);
      }
    }

    clearAllAuthData();
  },

  // Logout all devices
  logoutAll: async (): Promise<void> => {
    const accessToken = tokenManager.getAccessToken();

    if (accessToken) {
      try {
        await api.post("/auth/logout-all");
      } catch (error) {
        console.error("Logout all API error:", error);
      }
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

  // ==================== Token Management ====================

  /**
   * Handle successful auth - store tokens properly
   * - Access token: Memory only (via tokenManager)
   * - Refresh token: localStorage
   * - User data: localStorage (for persistence)
   */
  handleAuthSuccess: (data: AuthResponse): void => {
    // Access token -> memory only (KHÔNG lưu localStorage)
    tokenManager.setAccessToken(data.accessToken);

    // Refresh token -> localStorage
    refreshTokenStorage.set(data.refreshToken);

    // User data -> localStorage (for persistence across reloads)
    userStorage.set(data.user);

    // Also set userId for backward compatibility
    userIdStorage.set(data.user.id);
  },

  // Get access token from memory
  getAccessToken: (): string | null => {
    return tokenManager.getAccessToken();
  },

  // Get refresh token from storage
  getRefreshToken: (): string | null => {
    return refreshTokenStorage.get();
  },

  // Get stored user data
  getStoredUser: (): AuthUser | null => {
    return userStorage.get<AuthUser>();
  },

  // Clear all auth data
  clearAuth: (): void => {
    clearAllAuthData();
  },

  // Check if user has refresh token (can potentially authenticate)
  hasRefreshToken: (): boolean => {
    return refreshTokenStorage.has();
  },

  // Check if user has access token in memory
  hasAccessToken: (): boolean => {
    return tokenManager.hasAccessToken();
  },

  // Check if user is authenticated (has access token)
  isAuthenticated: (): boolean => {
    return tokenManager.hasAccessToken();
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
};
