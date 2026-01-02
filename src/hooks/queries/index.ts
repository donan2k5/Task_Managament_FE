// Task Queries & Mutations
export {
  taskKeys,
  useTasksQuery,
  useCalendarTasksQuery,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useTasksWithMutations,
} from "./useTasks";

// Project Queries & Mutations
export {
  projectKeys,
  useProjectsQuery,
  useProjectQuery,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useProjectsWithMutations,
} from "./useProjects";

// Dashboard Queries
export {
  dashboardKeys,
  useDashboardQuery,
  useDashboardWithActions,
} from "./useDashboard";
export type { DashboardSummary } from "./useDashboard";
