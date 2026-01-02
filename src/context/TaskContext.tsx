import { createContext, useContext, ReactNode } from "react";
import { useTasksWithMutations } from "@/hooks/queries/useTasks";
import { Task } from "@/types";

interface TaskContextType {
  tasks: Task[];
  scheduledTasks: Task[];
  unscheduledTasks: Task[];
  loading: boolean;
  fetchTasks: () => Promise<void>;
  addTask: (taskData: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<Task>;
  // New mutation states for UX
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export const TaskContext = createContext<TaskContextType | null>(null);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const taskState = useTasksWithMutations();

  // Wrap refetch to match the old signature
  const fetchTasks = async () => {
    await taskState.fetchTasks();
  };

  const value: TaskContextType = {
    tasks: taskState.tasks,
    scheduledTasks: taskState.scheduledTasks,
    unscheduledTasks: taskState.unscheduledTasks,
    loading: taskState.loading,
    fetchTasks,
    addTask: taskState.addTask,
    updateTask: taskState.updateTask,
    deleteTask: taskState.deleteTask,
    isCreating: taskState.isCreating,
    isUpdating: taskState.isUpdating,
    isDeleting: taskState.isDeleting,
  };

  return (
    <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
  );
};

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTaskContext must be used within TaskProvider");
  }
  return context;
};
