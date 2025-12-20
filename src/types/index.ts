// src/types/index.ts

export interface Task {
  _id: string;
  title: string;
  project?: string;

  // Start At (Ngày bắt đầu)
  scheduledDate: string; // ISO String
  scheduledTime?: string; // String "HH:mm" riêng lẻ (theo logic cũ của bạn)

  // Deadline (Hạn chót - Gộp cả ngày và giờ)
  deadline?: string; // ISO String (Chứa cả ngày + giờ)

  isUrgent: boolean;
  isImportant: boolean;
  completed: boolean;
  status: "backlog" | "todo" | "done";
  createdAt?: string;
  updatedAt?: string;
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  progress?: number;
  tasksCount?: number;
  teammates?: number;
  color?: string;
  icon?: string;
  status?: string;
}

export interface Goal {
  _id: string;
  name: string;
  project: string;
  category: string;
  progress: number;
  color: string;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  date: string;
  type: "meeting" | "task" | "reminder";
  platform?: string;
  location?: string;
  attendees?: number;
  color?: string;
}

export interface HeaderStats {
  totalHours: number;
  dailyAverage: number;
  trend: number;
  weeklyData: number[];
}
