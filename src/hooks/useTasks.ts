import { useState, useEffect, useCallback, useMemo } from "react";
import { Task } from "@/types/index";
import { taskService } from "@/services/task.service";
import { useToast } from "@/hooks/use-toast";

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarTasks, setCalendarTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch All Tasks
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await taskService.getAll();
      setTasks(data);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Load error",
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Derived: Scheduled tasks (have scheduledDate)
  const scheduledTasks = useMemo(
    () => tasks.filter((t) => t.scheduledDate && t.status !== "done"),
    [tasks]
  );

  // Derived: Unscheduled tasks (no scheduledDate, not done)
  const unscheduledTasks = useMemo(
    () => tasks.filter((t) => !t.scheduledDate && t.status !== "done"),
    [tasks]
  );

  // Fetch Calendar Tasks (for a specific date range)
  const fetchCalendarTasks = useCallback(
    async (startDate: Date, endDate: Date) => {
      try {
        // Filter from existing tasks or fetch from API
        const filtered = tasks.filter((t) => {
          if (!t.scheduledDate) return false;
          const taskDate = new Date(t.scheduledDate);
          return taskDate >= startDate && taskDate <= endDate;
        });
        setCalendarTasks(filtered);
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Calendar load error",
          description: err.message,
        });
      }
    },
    [tasks, toast]
  );

  // Add Task
  const addTask = async (taskData: Partial<Task>) => {
    const tempId = `temp-${Date.now()}`;
    const newTask = {
      ...taskData,
      _id: tempId,
      status: taskData.status || "backlog",
      completed: false,
      isUrgent: taskData.isUrgent || false,
      isImportant: taskData.isImportant || false,
    } as Task;

    setTasks((prev) => [...prev, newTask]);

    try {
      const { _id, ...payload } = newTask;
      const createdTask = await taskService.create(payload);
      setTasks((prev) =>
        prev.map((t) => (t._id === tempId ? createdTask : t))
      );
    } catch (err: any) {
      setTasks((prev) => prev.filter((t) => t._id !== tempId));
      toast({ variant: "destructive", title: "Add failed" });
    }
  };

  // Update Task
  const updateTask = async (id: string, updates: Partial<Task>) => {
    const originalTask = tasks.find((t) => t._id === id);
    if (!originalTask) return;

    const updatedTask = { ...originalTask, ...updates };

    // Optimistic update
    setTasks((prev) => prev.map((t) => (t._id === id ? updatedTask : t)));

    try {
      const { _id, createdAt, updatedAt, __v, ...cleanUpdates } =
        updates as any;
      await taskService.update(id, cleanUpdates);
    } catch (err: any) {
      // Rollback on error
      setTasks((prev) =>
        prev.map((t) => (t._id === id ? originalTask : t))
      );
      toast({ variant: "destructive", title: "Update failed" });
    }
  };

  // Delete Task
  const deleteTask = async (id: string) => {
    const originalTasks = [...tasks];
    setTasks((prev) => prev.filter((t) => t._id !== id));

    try {
      await taskService.delete(id);
    } catch (err: any) {
      setTasks(originalTasks);
      toast({ variant: "destructive", title: "Delete failed" });
    }
  };

  return {
    tasks,
    scheduledTasks,
    unscheduledTasks,
    calendarTasks,
    loading,
    fetchTasks,
    fetchCalendarTasks,
    addTask,
    updateTask,
    deleteTask,
  };
};
