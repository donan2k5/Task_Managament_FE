import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Task } from "@/types/index";
import { taskService } from "@/services/task.service";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Query Keys
export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (filters: string) => [...taskKeys.lists(), { filters }] as const,
  details: () => [...taskKeys.all, "detail"] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  calendar: (start: string, end: string) =>
    [...taskKeys.all, "calendar", { start, end }] as const,
};

// Query: Get all tasks
export const useTasksQuery = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: taskKeys.lists(),
    queryFn: taskService.getAll,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Query: Get calendar tasks for date range
export const useCalendarTasksQuery = (start: Date, end: Date) => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: taskKeys.calendar(start.toISOString(), end.toISOString()),
    queryFn: () => taskService.getCalendarTasks(start, end),
    enabled: isAuthenticated && !!start && !!end,
    staleTime: 5 * 60 * 1000,
  });
};

// Mutation: Create task
export const useCreateTask = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Partial<Task>) => taskService.create(data),
    onMutate: async (newTask) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.lists());

      // Optimistically update to the new value
      if (previousTasks) {
        const optimisticTask = {
          ...newTask,
          _id: `temp-${Date.now()}`,
          status: newTask.status || "backlog",
          completed: false,
          isUrgent: newTask.isUrgent || false,
          isImportant: newTask.isImportant || false,
        } as Task;

        queryClient.setQueryData<Task[]>(taskKeys.lists(), [
          ...previousTasks,
          optimisticTask,
        ]);
      }

      return { previousTasks };
    },
    onError: (_err, _newTask, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.lists(), context.previousTasks);
      }
      toast({ variant: "destructive", title: "Failed to create task" });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

// Mutation: Update task
export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) => {
      const { _id, createdAt, updatedAt, __v, ...cleanData } = data as any;
      return taskService.update(id, cleanData);
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.lists());

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          taskKeys.lists(),
          previousTasks.map((task) =>
            task._id === id ? { ...task, ...data } : task
          )
        );
      }

      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.lists(), context.previousTasks);
      }
      toast({ variant: "destructive", title: "Failed to update task" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

// Mutation: Delete task
export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => taskService.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.lists());

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          taskKeys.lists(),
          previousTasks.filter((task) => task._id !== id)
        );
      }

      return { previousTasks };
    },
    onError: (_err, _id, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.lists(), context.previousTasks);
      }
      toast({ variant: "destructive", title: "Failed to delete task" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

// Hook that provides all task operations (for backwards compatibility)
export const useTasksWithMutations = () => {
  const { data: tasks = [], isLoading, refetch } = useTasksQuery();
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();

  // Derived data
  const scheduledTasks = tasks.filter((t) => t.scheduledDate);
  const unscheduledTasks = tasks.filter(
    (t) => !t.scheduledDate && t.status !== "done"
  );

  // Calendar tasks - filter from existing tasks for a date range
  // This is a no-op function for compatibility, tasks are already loaded
  const fetchCalendarTasks = (_start: Date, _end: Date) => {
    // Data is already available from the main query
    // React Query handles caching automatically
  };

  return {
    // Data
    tasks,
    scheduledTasks,
    unscheduledTasks,
    calendarTasks: scheduledTasks, // Tasks with scheduledDate for calendar view
    loading: isLoading,

    // Actions
    fetchTasks: refetch,
    fetchCalendarTasks,
    addTask: (data: Partial<Task>) => createMutation.mutateAsync(data),
    updateTask: (id: string, data: Partial<Task>) =>
      updateMutation.mutateAsync({ id, data }),
    deleteTask: (id: string) => deleteMutation.mutateAsync(id),

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
