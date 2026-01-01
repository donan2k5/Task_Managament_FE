/**
 * Token Manager - Quản lý access token trong memory (không lưu localStorage)
 *
 * Best Practice:
 * - Access token: Lưu trong memory, an toàn hơn với XSS
 * - Refresh token: Lưu trong localStorage (hoặc httpOnly cookie nếu BE hỗ trợ)
 * - Khi reload page: Dùng refresh token để lấy access token mới
 */

type TokenChangeCallback = (token: string | null) => void;

class TokenManager {
  private accessToken: string | null = null;
  private subscribers: Set<TokenChangeCallback> = new Set();

  // Lấy access token từ memory
  getAccessToken(): string | null {
    return this.accessToken;
  }

  // Set access token vào memory
  setAccessToken(token: string | null): void {
    this.accessToken = token;
    this.notifySubscribers();
  }

  // Clear access token
  clearAccessToken(): void {
    this.accessToken = null;
    this.notifySubscribers();
  }

  // Subscribe to token changes
  subscribe(callback: TokenChangeCallback): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Notify all subscribers when token changes
  private notifySubscribers(): void {
    this.subscribers.forEach((callback) => {
      callback(this.accessToken);
    });
  }

  // Check if user has access token
  hasAccessToken(): boolean {
    return !!this.accessToken;
  }
}

// Singleton instance
export const tokenManager = new TokenManager();

// Refresh token management (localStorage - acceptable per guide)
const REFRESH_TOKEN_KEY = "refreshToken";

export const refreshTokenStorage = {
  get: (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  set: (token: string): void => {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  clear: (): void => {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  has: (): boolean => {
    return !!localStorage.getItem(REFRESH_TOKEN_KEY);
  },
};

// User storage (localStorage - for persistence)
const USER_KEY = "user";

export const userStorage = {
  get: <T>(): T | null => {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as T;
    } catch {
      return null;
    }
  },

  set: <T>(user: T): void => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clear: (): void => {
    localStorage.removeItem(USER_KEY);
  },
};

// Legacy userId support
const USER_ID_KEY = "userId";

export const userIdStorage = {
  get: (): string | null => {
    return localStorage.getItem(USER_ID_KEY);
  },

  set: (userId: string): void => {
    localStorage.setItem(USER_ID_KEY, userId);
  },

  clear: (): void => {
    localStorage.removeItem(USER_ID_KEY);
  },
};

// Clear all auth data
export const clearAllAuthData = (): void => {
  tokenManager.clearAccessToken();
  refreshTokenStorage.clear();
  userStorage.clear();
  userIdStorage.clear();
  // Also clear legacy accessToken if exists
  localStorage.removeItem("accessToken");
};
