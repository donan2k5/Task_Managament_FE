import { useQuery, useQueryClient } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";
import { useAuth } from "@/context/AuthContext";
import { useCreateProject } from "./useProjects";

// Query Keys
export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: () => [...dashboardKeys.all, "summary"] as const,
};

// Dashboard Summary Type
export interface DashboardSummary {
  totalTasks: number;
  completedTasks: number;
  todayTasks: number;
  overdueTasks: number;
  projects: Array<{
    id: string;
    name: string;
    tasksCount: number;
    progress: number;
    color: string;
    icon: string;
  }>;
  recentTasks: Array<{
    id: string;
    title: string;
    status: string;
    project: string;
    scheduledDate?: string;
  }>;
}

// Query: Get dashboard summary
export const useDashboardQuery = () => {
  const { isAuthenticated } = useAuth();

  return useQuery<DashboardSummary>({
    queryKey: dashboardKeys.summary(),
    queryFn: dashboardService.getSummary,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};

// Hook with add project functionality (for backwards compatibility)
export const useDashboardWithActions = () => {
  const { data, isLoading, refetch } = useDashboardQuery();
  const createProjectMutation = useCreateProject();
  const queryClient = useQueryClient();

  const addProject = async (name: string) => {
    await createProjectMutation.mutateAsync({
      name,
      description: "New project",
      color: "hsl(262, 83%, 58%)",
      icon: "🚀",
    });
    // Invalidate dashboard to refresh project list
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
  };

  return {
    data,
    loading: isLoading,
    refetch,
    addProject,
    isAddingProject: createProjectMutation.isPending,
  };
};
