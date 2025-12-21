import { createContext, useContext, ReactNode } from "react";
import { useTasks } from "@/hooks/useTasks";
import { Task } from "@/types";

interface TaskContextType {
  tasks: Task[];
  scheduledTasks: Task[];
  unscheduledTasks: Task[];
  loading: boolean;
  fetchTasks: () => Promise<void>;
  addTask: (taskData: Partial<Task>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | null>(null);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const taskState = useTasks();

  return (
    <TaskContext.Provider value={taskState}>{children}</TaskContext.Provider>
  );
};

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTaskContext must be used within TaskProvider");
  }
  return context;
};
