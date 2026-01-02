// Habit types for frontend
export interface Habit {
  _id: string;
  name: string;
  icon: string;
  color: string;
  frequency: 'daily' | 'weekly';
  targetDays: number[];
  isActive: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HabitLog {
  _id: string;
  habitId: string;
  date: string;
  completed: boolean;
  note?: string;
}

export interface HabitWithStats {
  habit: Habit;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate: number;
  thisWeekLogs: { date: string; completed: boolean }[];
}

export interface CreateHabitDto {
  name: string;
  icon?: string;
  color?: string;
  frequency?: 'daily' | 'weekly';
  targetDays?: number[];
  description?: string;
}

export interface UpdateHabitDto extends Partial<CreateHabitDto> {
  isActive?: boolean;
}
