import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from './auth.service';
import api from './api';
import {
  authStateManager,
  userStorage,
  userIdStorage,
  clearAllAuthData,
} from './tokenManager';

// Mock dependencies
vi.mock('./api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('./tokenManager', () => ({
  authStateManager: {
    setAuthenticated: vi.fn(),
    isAuthenticated: vi.fn(),
  },
  userStorage: {
    set: vi.fn(),
    get: vi.fn(),
  },
  userIdStorage: {
    set: vi.fn(),
    get: vi.fn(),
    clear: vi.fn(),
  },
  clearAllAuthData: vi.fn(),
}));

// Mock fetch for refreshAccessToken
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should call API and store user on success', async () => {
      const mockUser = { id: '123', email: 'test@example.com', name: 'Test' };
      const mockResponse = { data: { user: mockUser } };
      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test',
      });

      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test',
      });
      expect(userStorage.set).toHaveBeenCalledWith(mockUser);
      expect(userIdStorage.set).toHaveBeenCalledWith('123');
      expect(authStateManager.setAuthenticated).toHaveBeenCalledWith(true);
      expect(result.user).toEqual(mockUser);
    });
  });

  describe('login', () => {
    it('should call API and store user on success', async () => {
      const mockUser = { id: '456', email: 'user@test.com', name: 'User' };
      const mockResponse = { data: { user: mockUser } };
      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await authService.login({
        email: 'user@test.com',
        password: 'password',
      });

      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'user@test.com',
        password: 'password',
      });
      expect(result.user).toEqual(mockUser);
    });
  });

  describe('checkAuth', () => {
    it('should return user on valid session', async () => {
      const mockUser = { id: '789', email: 'check@test.com', name: 'Check' };
      vi.mocked(api.get).mockResolvedValue({ data: mockUser });

      const result = await authService.checkAuth();

      expect(api.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockUser);
    });

    it('should clear auth and return null on error', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Unauthorized'));

      const result = await authService.checkAuth();

      expect(clearAllAuthData).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh tokens successfully', async () => {
      const mockUser = { id: '111', email: 'refresh@test.com', name: 'Refresh' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ user: mockUser }),
      });

      const result = await authService.refreshAccessToken();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/refresh'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
      expect(result?.user).toEqual(mockUser);
    });

    it('should clear auth on refresh failure', async () => {
      mockFetch.mockResolvedValue({ ok: false });

      const result = await authService.refreshAccessToken();

      expect(clearAllAuthData).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('logout', () => {
    it('should call logout API and clear auth data', async () => {
      vi.mocked(api.post).mockResolvedValue({});

      await authService.logout();

      expect(api.post).toHaveBeenCalledWith('/auth/logout');
      expect(clearAllAuthData).toHaveBeenCalled();
    });

    it('should clear auth data even on API error', async () => {
      vi.mocked(api.post).mockRejectedValue(new Error('Network error'));

      await authService.logout();

      expect(clearAllAuthData).toHaveBeenCalled();
    });
  });

  describe('logoutAll', () => {
    it('should call logout-all API and clear auth data', async () => {
      vi.mocked(api.post).mockResolvedValue({});

      await authService.logoutAll();

      expect(api.post).toHaveBeenCalledWith('/auth/logout-all');
      expect(clearAllAuthData).toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = { id: '222', email: 'profile@test.com', name: 'Profile' };
      vi.mocked(api.get).mockResolvedValue({ data: mockUser });

      const result = await authService.getProfile();

      expect(api.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockUser);
    });

    it('should return null on error', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Error'));

      const result = await authService.getProfile();

      expect(result).toBeNull();
    });
  });

  describe('Google OAuth', () => {
    it('getGoogleAuthUrl should return correct URL', () => {
      const url = authService.getGoogleAuthUrl();
      expect(url).toContain('/auth/google');
    });

    it('checkGoogleStatus should fetch status', async () => {
      const mockStatus = { isConnected: true, email: 'google@test.com' };
      vi.mocked(api.get).mockResolvedValue({ data: mockStatus });

      const result = await authService.checkGoogleStatus();

      expect(api.get).toHaveBeenCalledWith('/auth/google/status');
      expect(result).toEqual(mockStatus);
    });

    it('disconnectGoogle should call API', async () => {
      vi.mocked(api.delete).mockResolvedValue({});

      await authService.disconnectGoogle();

      expect(api.delete).toHaveBeenCalledWith('/auth/google/disconnect');
    });
  });

  describe('Auth State Management', () => {
    it('handleAuthSuccess should store user data', () => {
      const mockUser = { id: '333', email: 'handle@test.com', name: 'Handle' };

      authService.handleAuthSuccess({ user: mockUser });

      expect(userStorage.set).toHaveBeenCalledWith(mockUser);
      expect(userIdStorage.set).toHaveBeenCalledWith('333');
      expect(authStateManager.setAuthenticated).toHaveBeenCalledWith(true);
    });

    it('getStoredUser should retrieve user from storage', () => {
      const mockUser = { id: '444', email: 'stored@test.com', name: 'Stored' };
      vi.mocked(userStorage.get).mockReturnValue(mockUser);

      const result = authService.getStoredUser();

      expect(result).toEqual(mockUser);
    });

    it('clearAuth should clear all auth data', () => {
      authService.clearAuth();

      expect(clearAllAuthData).toHaveBeenCalled();
    });

    it('isAuthenticated should check auth state', () => {
      vi.mocked(authStateManager.isAuthenticated).mockReturnValue(true);

      const result = authService.isAuthenticated();

      expect(result).toBe(true);
    });
  });

  describe('Legacy Methods', () => {
    it('getUserId should return user id from stored user', () => {
      const mockUser = { id: '555', email: 'legacy@test.com', name: 'Legacy' };
      vi.mocked(userStorage.get).mockReturnValue(mockUser);

      const result = authService.getUserId();

      expect(result).toBe('555');
    });

    it('setUserId should store user id', () => {
      authService.setUserId('666');

      expect(userIdStorage.set).toHaveBeenCalledWith('666');
    });

    it('removeUserId should clear user id', () => {
      authService.removeUserId();

      expect(userIdStorage.clear).toHaveBeenCalled();
    });
  });
});
