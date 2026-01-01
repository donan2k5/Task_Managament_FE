import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  MoreHorizontal,
  ArrowLeft,
  CheckCircle,
  Circle,
  Clock,
  Calendar,
  Loader2,
  Search,
  Filter,
  ChevronDown,
  Trash2,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { projectService } from "@/services/project.service";
import { toast } from "sonner";
import { taskService } from "@/services/task.service";
import { Project, Task } from "@/types/index";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "detail";
type TaskFilter = "all" | "pending" | "completed";

const Projects = () => {
  const [projectList, setProjectList] = useState<
    (Project & { animatedProgress: number })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  // Create project dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newProjectColor, setNewProjectColor] = useState("#8B5CF6");

  // Load Projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectService.getAll();
        setProjectList(data.map((p) => ({ ...p, animatedProgress: 0 })));
        setTimeout(() => {
          setProjectList((prev) =>
            prev.map((p) => ({ ...p, animatedProgress: p.progress || 0 }))
          );
        }, 100);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Load tasks when a project is selected
  const loadProjectTasks = async (project: Project) => {
    setSelectedProject(project);
    setViewMode("detail");
    setLoadingTasks(true);
    try {
      const tasks = await projectService.getTasks(project._id);
      setProjectTasks(tasks);
    } catch (err) {
      console.error(err);
      // Fallback: try to get all tasks and filter
      try {
        const allTasks = await taskService.getAll();
        setProjectTasks(allTasks.filter((t) => t.project === project.name || t.project === project._id));
      } catch {
        setProjectTasks([]);
      }
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleBackToGrid = () => {
    setViewMode("grid");
    setSelectedProject(null);
    setProjectTasks([]);
    setTaskFilter("all");
    setSearchQuery("");
  };

  const handleToggleTaskComplete = async (taskId: string, completed: boolean) => {
    try {
      await taskService.update(taskId, { completed: !completed, status: !completed ? "done" : "todo" });
      setProjectTasks((prev) =>
        prev.map((t) =>
          t._id === taskId ? { ...t, completed: !completed, status: !completed ? "done" : "todo" } : t
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    let tasks = projectTasks;

    // Apply filter
    if (taskFilter === "pending") {
      tasks = tasks.filter((t) => !t.completed);
    } else if (taskFilter === "completed") {
      tasks = tasks.filter((t) => t.completed);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      tasks = tasks.filter((t) => t.title.toLowerCase().includes(query));
    }

    return tasks;
  }, [projectTasks, taskFilter, searchQuery]);

  // Task stats
  const taskStats = useMemo(() => {
    const total = projectTasks.length;
    const completed = projectTasks.filter((t) => t.completed).length;
    const pending = total - completed;
    return { total, completed, pending };
  }, [projectTasks]);

  // Handle delete project
  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    setIsDeletingProject(true);
    try {
      // Check if project has tasks
      if ((projectToDelete.tasksCount || 0) > 0) {
        toast.error("Cannot delete project with tasks. Please remove all tasks first.");
        return;
      }

      await projectService.delete(projectToDelete._id);
      setProjectList((prev) => prev.filter((p) => p._id !== projectToDelete._id));
      toast.success("Project deleted successfully");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    } finally {
      setIsDeletingProject(false);
      setProjectToDelete(null);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    if ((project.tasksCount || 0) > 0) {
      toast.error("Cannot delete project with tasks. Please remove all tasks first.");
      return;
    }
    setProjectToDelete(project);
  };

  // Handle create new project
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast.error("Project name is required");
      return;
    }

    setIsCreatingProject(true);
    try {
      const newProject = await projectService.create({
        name: newProjectName.trim(),
        description: newProjectDescription.trim() || undefined,
        color: newProjectColor,
      });
      setProjectList((prev) => [
        ...prev,
        { ...newProject, animatedProgress: 0 },
      ]);
      toast.success("Project created successfully");
      setShowCreateDialog(false);
      setNewProjectName("");
      setNewProjectDescription("");
      setNewProjectColor("#8B5CF6");
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleOpenCreateDialog = () => {
    setNewProjectName("");
    setNewProjectDescription("");
    setNewProjectColor("#8B5CF6");
    setShowCreateDialog(true);
  };

  if (loading)
    return (
      <DashboardLayout>
        <div className="p-10 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {viewMode === "grid" && (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Header */}
              <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex items-start justify-between gap-4 flex-wrap"
              >
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-1">
                    Projects
                  </h1>
                  <p className="text-muted-foreground">
                    Track progress across all your projects
                  </p>
                </div>
                <Button className="gap-2" onClick={handleOpenCreateDialog}>
                  <Plus className="w-4 h-4" /> New Project
                </Button>
              </motion.header>

              {/* Project Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projectList.map((project, index) => (
                  <motion.div
                    key={project._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="dashboard-card group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => loadProjectTasks(project)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <div
                          className="project-icon text-xl w-10 h-10 flex items-center justify-center rounded-lg"
                          style={{
                            backgroundColor: `${project.color}20`,
                            color: project.color,
                          }}
                        >
                          {project.icon || project.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {project.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {project.tasksCount || 0} tasks
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem
                            onClick={(e) => handleDeleteClick(e, project)}
                            className={cn(
                              "gap-2",
                              (project.tasksCount || 0) > 0
                                ? "text-muted-foreground cursor-not-allowed"
                                : "text-red-600 focus:text-red-600"
                            )}
                            disabled={(project.tasksCount || 0) > 0}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Project
                            {(project.tasksCount || 0) > 0 && (
                              <span className="text-xs text-muted-foreground ml-2">
                                (has tasks)
                              </span>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Progress: </span>
                          <span className="font-medium text-foreground">
                            {project.progress || 0}%
                          </span>
                        </div>
                      </div>

                      <div className="progress-bar h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${project.animatedProgress}%`,
                            background: project.color || "hsl(262, 83%, 58%)",
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {Math.round(
                            ((project.progress || 0) / 100) *
                              (project.tasksCount || 0)
                          )}{" "}
                          of {project.tasksCount || 0} tasks done
                        </span>
                        <span className="text-primary font-medium">
                          View Tasks
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Create new project card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: projectList.length * 0.1, duration: 0.4 }}
                  className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
                  onClick={handleOpenCreateDialog}
                >
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Plus className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-muted-foreground">
                    Create New Project
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )}

          {viewMode === "detail" && selectedProject && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Back button and project header */}
              <div className="mb-6">
                <Button
                  variant="ghost"
                  onClick={handleBackToGrid}
                  className="gap-2 mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Projects
                </Button>

                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="text-2xl w-14 h-14 flex items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `${selectedProject.color}20`,
                        color: selectedProject.color,
                      }}
                    >
                      {selectedProject.icon || selectedProject.name.charAt(0)}
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-foreground">
                        {selectedProject.name}
                      </h1>
                      {selectedProject.description && (
                        <p className="text-muted-foreground mt-1">
                          {selectedProject.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" /> Add Task
                  </Button>
                </div>
              </div>

              {/* Task Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg border p-4">
                  <div className="text-2xl font-bold text-foreground">
                    {taskStats.total}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Tasks</div>
                </div>
                <div className="bg-white rounded-lg border p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {taskStats.completed}
                  </div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="bg-white rounded-lg border p-4">
                  <div className="text-2xl font-bold text-orange-500">
                    {taskStats.pending}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex gap-4 mb-6 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Filter className="w-4 h-4" />
                      {taskFilter === "all"
                        ? "All Tasks"
                        : taskFilter === "pending"
                        ? "Pending"
                        : "Completed"}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setTaskFilter("all")}>
                      All Tasks
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTaskFilter("pending")}>
                      Pending
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTaskFilter("completed")}>
                      Completed
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Task List */}
              {loadingTasks ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border">
                  <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-foreground mb-1">No tasks found</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? "Try a different search term"
                      : taskFilter !== "all"
                      ? "No tasks match this filter"
                      : "Add your first task to get started"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTasks.map((task, index) => (
                    <motion.div
                      key={task._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "bg-white rounded-lg border p-4 hover:shadow-sm transition-shadow",
                        task.completed && "opacity-70"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleToggleTaskComplete(task._id, task.completed)}
                          className="mt-0.5 flex-shrink-0"
                        >
                          {task.completed ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4
                              className={cn(
                                "font-medium",
                                task.completed && "line-through text-muted-foreground"
                              )}
                            >
                              {task.title}
                            </h4>
                            <div className="flex gap-2 flex-shrink-0">
                              {task.isUrgent && (
                                <Badge variant="destructive" className="text-xs">
                                  Urgent
                                </Badge>
                              )}
                              {task.isImportant && (
                                <Badge variant="default" className="text-xs">
                                  Important
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            {task.scheduledDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {format(new Date(task.scheduledDate), "MMM d, yyyy")}
                              </div>
                            )}
                            {task.scheduledDate && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {format(new Date(task.scheduledDate), "HH:mm")}
                              </div>
                            )}
                            {task.deadline && (
                              <div className="flex items-center gap-1 text-orange-500">
                                <Clock className="w-3.5 h-3.5" />
                                Due: {format(new Date(task.deadline), "MMM d")}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete Project Confirmation Dialog */}
      <AlertDialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{projectToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingProject}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={isDeletingProject}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeletingProject ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a new project to organize your tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="project-name">Project Name *</Label>
              <Input
                id="project-name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Enter project name..."
                disabled={isCreatingProject}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project-description">Description</Label>
              <Input
                id="project-description"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                placeholder="Enter project description..."
                disabled={isCreatingProject}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project-color">Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="project-color"
                  value={newProjectColor}
                  onChange={(e) => setNewProjectColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-border"
                  disabled={isCreatingProject}
                />
                <div className="flex gap-2">
                  {["#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#3B82F6", "#EF4444"].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewProjectColor(color)}
                      className={cn(
                        "w-8 h-8 rounded-full transition-all",
                        newProjectColor === color && "ring-2 ring-offset-2 ring-primary"
                      )}
                      style={{ backgroundColor: color }}
                      disabled={isCreatingProject}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={isCreatingProject}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={isCreatingProject || !newProjectName.trim()}
            >
              {isCreatingProject ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Projects;
