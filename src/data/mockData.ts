export interface Task {
  id: string;
  name: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  dueDate: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  progress: number;
  color: string;
  tasksCount: number;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  date: string;
  type: 'meeting' | 'task' | 'reminder';
}

export interface WeeklyStats {
  day: string;
  hours: number;
  dayName: string;
}

export const currentUser = {
  name: 'Alex Mitchell',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
  status: 'online' as const,
};

export const todayTasks: Task[] = [
  { id: '1', name: 'Review product roadmap', priority: 'high', completed: false, dueDate: 'Today' },
  { id: '2', name: 'Team sync meeting prep', priority: 'high', completed: false, dueDate: 'Today' },
  { id: '3', name: 'Update API documentation', priority: 'medium', completed: true, dueDate: 'Today' },
  { id: '4', name: 'Code review for PR #142', priority: 'medium', completed: false, dueDate: 'Today' },
  { id: '5', name: 'Send weekly status report', priority: 'low', completed: false, dueDate: 'Today' },
];

export const allTasks: Task[] = [
  ...todayTasks,
  { id: '6', name: 'Design system audit', priority: 'medium', completed: false, dueDate: 'Tomorrow' },
  { id: '7', name: 'User interview prep', priority: 'high', completed: false, dueDate: 'Tomorrow' },
  { id: '8', name: 'Database optimization', priority: 'low', completed: false, dueDate: 'Dec 21' },
  { id: '9', name: 'Q4 planning session', priority: 'high', completed: false, dueDate: 'Dec 22' },
  { id: '10', name: 'Security patch deployment', priority: 'high', completed: false, dueDate: 'Dec 23' },
];

export const projects: Project[] = [
  { id: '1', name: 'Product Launch', description: 'Q1 2024 release preparation', progress: 73, color: 'hsl(174 60% 45%)', tasksCount: 12 },
  { id: '2', name: 'API Integration', description: 'Third-party service connections', progress: 45, color: 'hsl(38 90% 55%)', tasksCount: 8 },
  { id: '3', name: 'Mobile App', description: 'React Native development', progress: 28, color: 'hsl(262 60% 55%)', tasksCount: 15 },
  { id: '4', name: 'Documentation', description: 'Developer docs & guides', progress: 91, color: 'hsl(152 55% 45%)', tasksCount: 5 },
];

export const upcomingEvents: ScheduleEvent[] = [
  { id: '1', title: 'Team Standup', startTime: '09:00', endTime: '09:30', date: 'Today', type: 'meeting' },
  { id: '2', title: 'Product Review', startTime: '14:00', endTime: '15:00', date: 'Today', type: 'meeting' },
  { id: '3', title: '1:1 with Manager', startTime: '10:00', endTime: '10:30', date: 'Tomorrow', type: 'meeting' },
  { id: '4', title: 'Sprint Planning', startTime: '13:00', endTime: '14:30', date: 'Dec 20', type: 'meeting' },
  { id: '5', title: 'Design Review', startTime: '15:00', endTime: '16:00', date: 'Dec 20', type: 'meeting' },
  { id: '6', title: 'Client Call', startTime: '11:00', endTime: '12:00', date: 'Dec 21', type: 'meeting' },
];

export const weeklyStats: WeeklyStats[] = [
  { day: 'Mon', hours: 6.5, dayName: 'Monday' },
  { day: 'Tue', hours: 7.2, dayName: 'Tuesday' },
  { day: 'Wed', hours: 5.8, dayName: 'Wednesday' },
  { day: 'Thu', hours: 8.1, dayName: 'Thursday' },
  { day: 'Fri', hours: 6.0, dayName: 'Friday' },
  { day: 'Sat', hours: 2.5, dayName: 'Saturday' },
  { day: 'Sun', hours: 1.0, dayName: 'Sunday' },
];

export const getTotalWeeklyHours = () => {
  return weeklyStats.reduce((sum, day) => sum + day.hours, 0).toFixed(1);
};

export const getCurrentDayIndex = () => {
  const today = new Date().getDay();
  // Convert to Mon=0, Tue=1, etc. (Sunday becomes 6)
  return today === 0 ? 6 : today - 1;
};
