export interface Task {
  id: string;
  name: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  dueDate: string;
  status: 'in-progress' | 'todo' | 'upcoming';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  progress: number;
  color: string;
  icon: string;
  tasksCount: number;
  teammates: number;
}

export interface Goal {
  id: string;
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
  type: 'meeting' | 'task' | 'reminder';
  platform?: string;
  attendees?: number;
}

export interface WeeklyStats {
  day: string;
  hours: number;
  dayName: string;
}

export const currentUser = {
  name: 'Courtney Henry',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
  status: 'online' as const,
};

export const tasks: Task[] = [
  { id: '1', name: 'One-on-One Meeting', priority: 'high', completed: false, dueDate: 'Today', status: 'in-progress' },
  { id: '2', name: 'Send a summary email to stakeholders', priority: 'low', completed: false, dueDate: '3 days left', status: 'in-progress' },
  { id: '3', name: 'Review product roadmap', priority: 'medium', completed: false, dueDate: 'Today', status: 'todo' },
  { id: '4', name: 'Team sync meeting prep', priority: 'high', completed: false, dueDate: 'Tomorrow', status: 'upcoming' },
];

export const projects: Project[] = [
  { id: '1', name: 'Product launch', description: '', progress: 73, color: 'hsl(330 80% 60%)', icon: '🚀', tasksCount: 6, teammates: 12 },
  { id: '2', name: 'Team brainstorm', description: '', progress: 45, color: 'hsl(220 90% 55%)', icon: '💡', tasksCount: 2, teammates: 32 },
  { id: '3', name: 'Branding launch', description: '', progress: 28, color: 'hsl(174 70% 45%)', icon: '🎨', tasksCount: 4, teammates: 8 },
];

export const goals: Goal[] = [
  { id: '1', name: 'Check Emails and Messages', project: 'Product launch', category: 'My Projects', progress: 73, color: 'hsl(174 70% 45%)' },
  { id: '2', name: 'Prepare a brief status update to the client', project: 'Product launch', category: 'My Projects', progress: 11, color: 'hsl(25 95% 55%)' },
  { id: '3', name: 'Update project documentation', project: 'Team brainstorm', category: 'My Projects', progress: 63, color: 'hsl(174 70% 45%)' },
];

export const upcomingEvents: ScheduleEvent[] = [
  { id: '1', title: 'Meeting with VP', startTime: '10:00', endTime: '11:00 am', date: 'Today', type: 'meeting', platform: 'Google Meet', attendees: 4 },
  { id: '2', title: 'Sprint Planning', startTime: '13:00', endTime: '14:30', date: 'Tomorrow', type: 'meeting' },
  { id: '3', title: 'Design Review', startTime: '15:00', endTime: '16:00', date: 'Dec 20', type: 'meeting' },
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

export const calendarDays = [
  { day: 4, name: 'Fri' },
  { day: 5, name: 'Sat' },
  { day: 6, name: 'Sun' },
  { day: 7, name: 'Mon', isToday: true },
  { day: 8, name: 'Tue' },
  { day: 9, name: 'Wed' },
  { day: 10, name: 'Thu' },
];

export const reminders = [
  { id: '1', text: 'Assess any new risks identified in the morning meeting.' },
  { id: '2', text: "Outline key points for tomorrow's stand-up meeting." },
];

export const sidebarProjects = [
  { id: '1', name: 'Product launch', color: 'hsl(330 80% 60%)' },
  { id: '2', name: 'Team brainstorm', color: 'hsl(220 90% 55%)' },
  { id: '3', name: 'Branding launch', color: 'hsl(174 70% 45%)' },
];

export const getTotalWeeklyHours = () => {
  return weeklyStats.reduce((sum, day) => sum + day.hours, 0).toFixed(1);
};

export const getCurrentDayIndex = () => {
  const today = new Date().getDay();
  return today === 0 ? 6 : today - 1;
};
