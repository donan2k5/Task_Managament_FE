// src/types/index.ts

export interface Task {
  _id: string;
  title: string;
  project?: string;
  description?: string;

  // Date assignment (for Today/Next 7 Days filters) - date only, no time
  assignedDate?: string; // ISO String (e.g., "2024-12-20") - which day task belongs to

  // Scheduling (for calendar events) - both are full Date/DateTime ISO strings
  scheduledDate?: string; // Start date/time ISO String (e.g., "2024-12-20T14:30:00Z")
  scheduledEndDate?: string; // End date/time ISO String (e.g., "2024-12-20T15:30:00Z")

  // Deadline (separate concept - user-set due date)
  deadline?: string; // ISO String - When the task is DUE

  isUrgent: boolean;
  isImportant: boolean;
  completed: boolean;
  status: "todo" | "done";
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

// ==================== Authentication Types ====================

// User data returned from auth endpoints
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  annotation?: string;
  authMethods: ("local" | "google")[];
  googleConnected: boolean;
}

// Response from login/register/refresh endpoints
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

// Error response format
export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}

// Request DTOs
export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface SetPasswordDto {
  password: string;
  confirmPassword: string;
}

// Google Auth Types
export interface GoogleAuthStatus {
  isConnected: boolean;
  email?: string;
  lastSyncedAt?: string;
}

export interface TokenRefreshResult {
  success: boolean;
  expiresAt: string;
}

// Sync Status Types (Single Dedicated Calendar Model - "Axis")
export interface SyncStatus {
  enabled: boolean;
  calendarId: string | null;
  webhookActive: boolean;
}

export interface SyncInitializeResponse {
  user: {
    _id: string;
    email: string;
    dedicatedCalendarId: string;
    autoSyncEnabled: boolean;
  };
  message: string;
}

// Google Calendar Types
export interface CalendarData {
  id: string | null;
  name: string | null;
  description?: string | null;
  primary: boolean;
  accessRole: string | null;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

export interface ImportResult {
  project: Project;
  tasksCreated: number;
}

// Extended Project with Google Sync fields
export interface ProjectWithSync extends Project {
  googleCalendarId?: string;
  syncWithGoogle?: boolean;
  lastSyncedAt?: string;
  dueDate?: string;
  coverImage?: string;
}

// Extended Task with Google Sync fields
export interface TaskWithSync extends Task {
  googleCalendarId?: string;
}
