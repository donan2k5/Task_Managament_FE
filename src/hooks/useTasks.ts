import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Task } from "@/types/index";
import { taskService } from "@/services/task.service";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/auth.service";
import { tokenManager } from "@/services/tokenManager";

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarTasks, setCalendarTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const hasFetched = useRef(false);

  // Fetch All Tasks
  const fetchTasks = useCallback(async () => {
    // Only fetch if authenticated
    if (!authService.isAuthenticated()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await taskService.getAll();
      setTasks(data);
      hasFetched.current = true;
    } catch (err: any) {
      // Don't show error toast for auth errors
      if (err?.response?.status !== 401) {
        toast({
          variant: "destructive",
          title: "Load error",
          description: err.message,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Initial fetch attempt
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Subscribe to token changes - re-fetch when token becomes available
  useEffect(() => {
    const unsubscribe = tokenManager.subscribe((token) => {
      // If token just became available and we haven't fetched yet, fetch now
      if (token && !hasFetched.current) {
        fetchTasks();
      }
      // If token is cleared, reset state
      if (!token) {
        setTasks([]);
        setCalendarTasks([]);
        hasFetched.current = false;
      }
    });

    return unsubscribe;
  }, [fetchTasks]);

  // Derived: Scheduled tasks (have scheduledDate) - includes done tasks for calendar view
  const scheduledTasks = useMemo(
    () => tasks.filter((t) => t.scheduledDate),
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
