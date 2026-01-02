import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Project } from "@/types/index";
import { projectService } from "@/services/project.service";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Query Keys
export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (filters: string) => [...projectKeys.lists(), { filters }] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

// Query: Get all projects
export const useProjectsQuery = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: projectKeys.lists(),
    queryFn: projectService.getAll,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Query: Get project by ID
export const useProjectQuery = (id: string) => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectService.getById(id),
    enabled: isAuthenticated && !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Mutation: Create project
export const useCreateProject = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Partial<Project>) => projectService.create(data),
    onMutate: async (newProject) => {
      await queryClient.cancelQueries({ queryKey: projectKeys.lists() });

      const previousProjects = queryClient.getQueryData<Project[]>(
        projectKeys.lists()
      );

      if (previousProjects) {
        const optimisticProject = {
          ...newProject,
          _id: `temp-${Date.now()}`,
          progress: 0,
          status: "active",
        } as Project;

        queryClient.setQueryData<Project[]>(projectKeys.lists(), [
          ...previousProjects,
          optimisticProject,
        ]);
      }

      return { previousProjects };
    },
    onError: (_err, _newProject, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(projectKeys.lists(), context.previousProjects);
      }
      toast({ variant: "destructive", title: "Failed to create project" });
    },
    onSuccess: () => {
      toast({ title: "Project created successfully" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      // Also invalidate dashboard since it shows projects
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

// Mutation: Update project
export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) =>
      projectService.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: projectKeys.lists() });

      const previousProjects = queryClient.getQueryData<Project[]>(
        projectKeys.lists()
      );

      if (previousProjects) {
        queryClient.setQueryData<Project[]>(
          projectKeys.lists(),
          previousProjects.map((project) =>
            project._id === id ? { ...project, ...data } : project
          )
        );
      }

      return { previousProjects };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(projectKeys.lists(), context.previousProjects);
      }
      toast({ variant: "destructive", title: "Failed to update project" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

// Mutation: Delete project
export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => projectService.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: projectKeys.lists() });

      const previousProjects = queryClient.getQueryData<Project[]>(
        projectKeys.lists()
      );

      if (previousProjects) {
        queryClient.setQueryData<Project[]>(
          projectKeys.lists(),
          previousProjects.filter((project) => project._id !== id)
        );
      }

      return { previousProjects };
    },
    onError: (_err, _id, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(projectKeys.lists(), context.previousProjects);
      }
      toast({ variant: "destructive", title: "Failed to delete project" });
    },
    onSuccess: () => {
      toast({ title: "Project deleted successfully" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

// Hook that provides all project operations (for backwards compatibility)
export const useProjectsWithMutations = () => {
  const { data: projects = [], isLoading, refetch } = useProjectsQuery();
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  return {
    // Data
    projects,
    loading: isLoading,

    // Actions
    fetchProjects: refetch,
    addProject: (data: Partial<Project>) => createMutation.mutateAsync(data),
    updateProject: (id: string, data: Partial<Project>) =>
      updateMutation.mutateAsync({ id, data }),
    deleteProject: (id: string) => deleteMutation.mutateAsync(id),

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
