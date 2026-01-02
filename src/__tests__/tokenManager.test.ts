import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  authStateManager,
  userStorage,
  userIdStorage,
  clearAllAuthData,
} from './tokenManager';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('tokenManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  describe('userStorage', () => {
    it('should set user data', () => {
      const user = { id: '123', email: 'test@test.com', name: 'Test' };
      userStorage.set(user);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'axis_user',
        JSON.stringify(user)
      );
    });

    it('should get user data', () => {
      const user = { id: '123', email: 'test@test.com', name: 'Test' };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(user));

      const result = userStorage.get();

      expect(result).toEqual(user);
    });

    it('should return null for invalid JSON', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      const result = userStorage.get();

      expect(result).toBeNull();
    });

    it('should return null when no data exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = userStorage.get();

      expect(result).toBeNull();
    });

    it('should clear user data', () => {
      userStorage.clear();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('axis_user');
    });
  });

  describe('userIdStorage', () => {
    it('should set user id', () => {
      userIdStorage.set('user123');

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'axis_user_id',
        'user123'
      );
    });

    it('should get user id', () => {
      mockLocalStorage.getItem.mockReturnValue('user456');

      const result = userIdStorage.get();

      expect(result).toBe('user456');
    });

    it('should clear user id', () => {
      userIdStorage.clear();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('axis_user_id');
    });
  });

  describe('authStateManager', () => {
    it('should set authenticated state to true', () => {
      authStateManager.setAuthenticated(true);

      expect(authStateManager.isAuthenticated()).toBe(true);
    });

    it('should set authenticated state to false', () => {
      authStateManager.setAuthenticated(false);

      expect(authStateManager.isAuthenticated()).toBe(false);
    });
  });

  describe('clearAllAuthData', () => {
    it('should clear all auth-related storage', () => {
      clearAllAuthData();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('axis_user');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('axis_user_id');
    });
  });
});
