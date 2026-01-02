import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CalendarCard } from './CalendarCard';

// Mock the hook
vi.mock('@/hooks/useTasks', () => ({
  useTasks: () => ({
    calendarTasks: [],
    fetchCalendarTasks: vi.fn(),
    loading: false,
  }),
}));

describe('CalendarCard', () => {
  it('renders correctly', () => {
    render(<CalendarCard />);
    expect(screen.getByText(/Weekly Schedule/i)).toBeInTheDocument();
    expect(screen.getByText(/NO TASKS SCHEDULED/i)).toBeInTheDocument();
  });
});
