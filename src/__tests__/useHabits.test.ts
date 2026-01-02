import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useLogHabit } from '../useHabits';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mocking dependencies if needed
vi.mock('@/services/api', () => ({
  default: {
    post: vi.fn().mockResolvedValue({ data: { success: true } }),
    get: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useLogHabit', () => {
  it('should optimistically update habit logs', async () => {
    const queryClient = new QueryClient();
    const habitId = 'habit-1';
    const date = new Date().toISOString();
    
    queryClient.setQueryData(['habits'], [
      {
        habit: { _id: habitId, name: 'Test Habit' },
        thisWeekLogs: []
      }
    ]);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useLogHabit(), { wrapper });

    await result.current.mutateAsync({ id: habitId, date, completed: true });

    const updatedData = queryClient.getQueryData<any[]>(['habits']);
    expect(updatedData?.[0].thisWeekLogs.length).toBe(1);
    expect(updatedData?.[0].thisWeekLogs[0].completed).toBe(true);
  });
});
