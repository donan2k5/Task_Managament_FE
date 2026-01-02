import api from "./api";

export interface PomodoroSession {
    _id?: string;
    userId?: string;
    taskId?: string | { _id: string; title: string; project?: string };
    startTime: string;
    endTime: string;
    duration: number; // seconds
    mode: 'focus' | 'shortBreak' | 'longBreak';
    note?: string;
    createdAt?: string;
}

export const pomodoroService = {
  createSession: async (session: Omit<PomodoroSession, "_id" | "userId">) => {
    const response = await api.post("/pomodoro/session", session);
    return response.data;
  },
  getHistory: async () => {
    const response = await api.get("/pomodoro/history");
    return response.data;
  },
};
