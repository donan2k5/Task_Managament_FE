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
import { Task, Project, HeaderStats, ScheduleEvent } from "@/types/index";

// Dashboard Summary Type
export interface DashboardSummary {
  tasks: Task[];
  overdueTasks: Task[];
  projects: Project[];
  upcomingEvents: ScheduleEvent[];
  headerStats: HeaderStats;
  user: {
    name: string;
    status: string;
  };
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
