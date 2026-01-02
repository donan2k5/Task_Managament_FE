/**
 * Auth State Manager - Quản lý auth state với HTTP-only cookies
 *
 * Cookie-based Auth:
 * - Access token: HTTP-only cookie (server-side, không thể access từ JS)
 * - Refresh token: HTTP-only cookie (server-side)
 * - User data: localStorage (cho UX persistence)
 *
 * Khi reload page: Browser tự gửi cookies, không cần refresh manual
 */

type AuthStateCallback = (isAuthenticated: boolean) => void;

class AuthStateManager {
  private _isAuthenticated: boolean = false;
  private subscribers: Set<AuthStateCallback> = new Set();

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this._isAuthenticated;
  }

  // Set auth state
  setAuthenticated(value: boolean): void {
    this._isAuthenticated = value;
    this.notifySubscribers();
  }

  // Subscribe to auth state changes
  subscribe(callback: AuthStateCallback): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Notify all subscribers when auth state changes
  private notifySubscribers(): void {
    this.subscribers.forEach((callback) => {
      callback(this._isAuthenticated);
    });
  }
}

// Singleton instance
export const authStateManager = new AuthStateManager();

// Legacy tokenManager compatibility (deprecated, use authStateManager)
export const tokenManager = {
  getAccessToken: () => null, // Tokens are in HTTP-only cookies now
  setAccessToken: (_token: string | null) => {
    // No-op, tokens handled by cookies
  },
  clearAccessToken: () => {
    // No-op
  },
  hasAccessToken: () => authStateManager.isAuthenticated(),
  subscribe: (callback: (token: string | null) => void) => {
    return authStateManager.subscribe((isAuth) => {
      callback(isAuth ? "cookie-auth" : null);
    });
  },
};

// refreshTokenStorage deprecated - tokens are in HTTP-only cookies
export const refreshTokenStorage = {
  get: (): string | null => null,
  set: (_token: string): void => {},
  clear: (): void => {},
  has: (): boolean => false,
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

// Clear all auth data (localStorage only - cookies cleared by server)
export const clearAllAuthData = (): void => {
  authStateManager.setAuthenticated(false);
  userStorage.clear();
  userIdStorage.clear();
  // Clear legacy data if exists
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};
