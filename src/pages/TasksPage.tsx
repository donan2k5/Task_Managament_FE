import { useState, useMemo, useRef, forwardRef, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { format, isToday, isTomorrow, isPast, addDays, isWithinInterval, startOfDay, endOfDay, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";
import {
  Inbox,
  Calendar as CalendarIcon,
  CalendarDays,
  Hash,
  CheckCircle2,
  Plus,
  Zap,
  Clock,
  Target,
  AlertTriangle,
  Flame,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Home,
  Heart,
  Star,
  Folder,
  BookOpen,
  Code,
  Music,
  Dumbbell,
  ShoppingBag,
  Plane,
  Coffee,
  Lightbulb,
  Gamepad2,
  Camera,
  Palette,
  Flag,
  AlertCircle,
  Users,
  Undo2,
  GripVertical,
  RefreshCcw,
  X,
  PanelLeft,
  MoreHorizontal,
  Pencil,
} from "lucide-react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTaskContext } from "@/context/TaskContext";
import { useAuth } from "@/context/AuthContext";
import { useProjects } from "@/hooks/useProjects";
import { Task, Project } from "@/types/index";
import { AnimatePresence, motion } from "framer-motion";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

// Project Icons
const PROJECT_ICONS = [
  { id: "briefcase", icon: Briefcase, label: "Work" },
  { id: "home", icon: Home, label: "Home" },
  { id: "heart", icon: Heart, label: "Health" },
  { id: "star", icon: Star, label: "Important" },
  { id: "folder", icon: Folder, label: "General" },
  { id: "book", icon: BookOpen, label: "Study" },
  { id: "code", icon: Code, label: "Dev" },
  { id: "music", icon: Music, label: "Music" },
  { id: "dumbbell", icon: Dumbbell, label: "Fitness" },
  { id: "shopping", icon: ShoppingBag, label: "Shopping" },
  { id: "plane", icon: Plane, label: "Travel" },
  { id: "coffee", icon: Coffee, label: "Break" },
  { id: "lightbulb", icon: Lightbulb, label: "Ideas" },
  { id: "gamepad", icon: Gamepad2, label: "Games" },
  { id: "camera", icon: Camera, label: "Photos" },
  { id: "palette", icon: Palette, label: "Design" },
];

const getProjectIcon = (iconId?: string) => {
  const found = PROJECT_ICONS.find(p => p.id === iconId);
  return found?.icon || Hash;
};

// --- HELPER FORMAT ---
const getTaskDateLabel = (dateString?: string) => {
  if (!dateString) return null;
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "Invalid";
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    return format(d, "MMM d");
  } catch {
    return "Invalid";
  }
};

const getProjectColor = (projectName?: string) => {
  if (!projectName) return "bg-zinc-300";
  const char = projectName.charAt(0).toLowerCase();
  if (["a", "b", "c", "v"].includes(char)) return "bg-violet-500";
  if (["d", "e", "f", "i"].includes(char)) return "bg-blue-500";
  return "bg-orange-400";
};

// --- COMPONENT: DEADLINE BADGE ---
const DeadlineBadge = ({ deadline }: { deadline?: string }) => {
  if (!deadline) return null;
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return null;

  const isOverdue = isPast(d) && !isToday(d);
  const isDueToday = isToday(d);

  let containerClass = "bg-zinc-50 text-zinc-500 border-zinc-200";
  let Icon = Flag;
  let timeClass = "text-zinc-500 font-medium";

  if (isOverdue) {
    containerClass = "bg-red-50 text-red-600 border-red-200 shadow-sm";
    Icon = AlertCircle;
    timeClass = "text-red-700 font-bold";
  } else if (isDueToday) {
    containerClass = "bg-amber-50 text-amber-600 border-amber-200";
    Icon = Clock;
    timeClass = "text-amber-700 font-bold";
  } else {
    containerClass = "bg-indigo-50 text-indigo-600 border-indigo-200";
  }

  return (
    <div
      className={cn(
        "text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1.5 transition-colors",
        containerClass
      )}
    >
      <Icon className="w-3 h-3" />
      <span>{format(d, "MMM d")}</span>
      <span className="opacity-40 text-current mx-0.5">|</span>
      <span className={timeClass}>{format(d, "HH:mm")}</span>
    </div>
  );
};

// --- COMPONENT: SHOWY TASK CARD ---
interface TaskCardProps {
  task: Task;
  index?: number;
  onComplete?: (id: string) => void;
  onRestore?: (id: string) => void;
  onClick?: (task: Task) => void;
  isReadOnly?: boolean;
  colorVariant?: "white" | "rose" | "blue" | "amber" | "zinc";
  compact?: boolean;
}

const TaskCard = ({
  task,
  index = 0,
  onComplete,
  onRestore,
  onClick,
  isReadOnly = false,
  colorVariant = "white",
  compact = false,
  isDragging = false
}: TaskCardProps & { isDragging?: boolean }) => {
  const colorStyles: Record<string, string> = {
    white: "bg-white border-zinc-200 hover:border-indigo-300",
    rose: "bg-white border-rose-100 hover:border-rose-300 hover:bg-rose-50",
    blue: "bg-white border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50",
    amber: "bg-white border-amber-100 hover:border-amber-300 hover:bg-amber-50",
    zinc: "bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50",
  };

  const content = (
      <div
        onClick={() => !isReadOnly && onClick && onClick(task)}
        className={cn(
          "group p-3 rounded-xl border shadow-sm relative flex gap-3 items-start select-none bg-white",
          !isReadOnly && "cursor-pointer hover:shadow-md",
          !isReadOnly && !isDragging && "transition-all",
          !isReadOnly ? colorStyles[colorVariant] : "border-zinc-100 opacity-75",
          compact && "p-2"
        )}
      >
        {!compact && (
          <div
            className={cn(
              "w-1 h-8 rounded-full shrink-0 mt-1",
              getProjectColor(task.project)
            )}
          />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <p
              className={cn(
                "text-sm font-semibold text-zinc-800 leading-snug line-clamp-2 mt-0.5",
                task.completed && "line-through text-zinc-400"
              )}
            >
              {task.title}
            </p>
            <div className="shrink-0 flex gap-1">
              {!isReadOnly && onComplete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete(task._id);
                  }}
                  className="group/btn relative w-5 h-5 rounded-full border-2 border-zinc-300 hover:border-emerald-500 hover:bg-emerald-50 flex items-center justify-center transition-all duration-200"
                  title="Mark as done"
                >
                  <CheckCircle2
                    className="w-3 h-3 text-emerald-600 opacity-0 scale-50 group-hover/btn:opacity-100 group-hover/btn:scale-100 transition-all duration-200"
                    strokeWidth={3}
                  />
                </button>
              )}
            </div>
          </div>

          {!compact && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {task.project && (
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide flex items-center gap-1 bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-100">
                  <Briefcase className="w-3 h-3 text-zinc-400" /> {task.project}
                </span>
              )}

              {task.scheduledDate && (
                <div className="text-[10px] px-1.5 py-0.5 rounded flex items-center bg-zinc-50 text-zinc-500 border border-zinc-100 gap-1.5">
                  <span className="flex items-center gap-1 font-semibold">
                    <CalendarIcon className="w-3 h-3" />
                    {getTaskDateLabel(task.scheduledDate)}
                  </span>
                </div>
              )}
              <DeadlineBadge deadline={task.deadline} />
            </div>
          )}
        </div>
      </div>
  );

  if (isReadOnly) return content;

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{ 
            ...provided.draggableProps.style,
            zIndex: snapshot.isDragging ? 99999 : undefined,
          }}
          className={cn(
            "relative",
            snapshot.isDragging ? "opacity-100 scale-[1.05] shadow-2xl z-[99999]" : "z-10"
          )}
        >
           <div className={cn(
             "w-full transition-none",
             snapshot.isDragging && "rotate-1"
           )}>
            {content}
           </div>
        </div>
      )}
    </Draggable>
  );
};

// --- COMPONENT: CREATE TASK DIALOG ---
interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (task: Partial<Task>) => void;
  projects: Project[];
  defaultValues?: Partial<Task>;
}

const CreateTaskDialog = ({ open, onOpenChange, onCreate, projects, defaultValues }: CreateTaskDialogProps) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project: "",
    isUrgent: false,
    isImportant: false,
    scheduledDate: undefined as Date | undefined,
    deadline: undefined as Date | undefined,
  });

  useEffect(() => {
    if (open) {
      setFormData({
        title: defaultValues?.title || "",
        description: defaultValues?.description || "",
        project: defaultValues?.project || "",
        isUrgent: defaultValues?.isUrgent || false,
        isImportant: defaultValues?.isImportant || false,
        scheduledDate: defaultValues?.scheduledDate ? new Date(defaultValues.scheduledDate) : undefined,
        deadline: defaultValues?.deadline ? new Date(defaultValues.deadline) : undefined,
      });
    }
  }, [open, defaultValues]);

  const handleSubmit = () => {
    if (!formData.title.trim()) return;

    const finalProject =
      formData.project === "no_project" || formData.project === ""
        ? undefined
        : formData.project;

    // Determine status logic (preserving existing backend logic preference if any)
    const initialStatus = (formData.isUrgent || formData.isImportant) ? "todo" : "backlog";

    onCreate({
      ...formData,
      status: defaultValues?.status || initialStatus,
      completed: false,
      scheduledDate: formData.scheduledDate?.toISOString(),
      deadline: formData.deadline?.toISOString(),
      project: finalProject,
    });

    setFormData({
      title: "",
      description: "",
      project: "",
      isUrgent: false,
      isImportant: false,
      scheduledDate: undefined,
      deadline: undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] z-[150]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Title</Label>
            <Input
              placeholder="Task title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Add details..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Project</Label>
              <Select
                value={formData.project}
                onValueChange={(val) =>
                  setFormData({ ...formData, project: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent className="z-[160]">
                  <SelectItem value="no_project">No Project</SelectItem>
                  {projects.map((p: Project) => (
                    <SelectItem key={p._id} value={p.name}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Priority</Label>
              <div className="flex gap-2 h-10 items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFormData({ ...formData, isUrgent: !formData.isUrgent })
                  }
                  className={cn(
                    formData.isUrgent
                      ? "bg-rose-50 text-rose-600 border-rose-200"
                      : "text-zinc-500"
                  )}
                >
                  Urgent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      isImportant: !formData.isImportant,
                    })
                  }
                  className={cn(
                    formData.isImportant
                      ? "bg-amber-50 text-amber-600 border-amber-200"
                      : "text-zinc-500"
                  )}
                >
                  Important
                </Button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !formData.scheduledDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.scheduledDate ? (
                      format(formData.scheduledDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[160]">
                  <Calendar
                    mode="single"
                    selected={formData.scheduledDate}
                    onSelect={(d) =>
                      setFormData({ ...formData, scheduledDate: d })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label>Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !formData.deadline && "text-muted-foreground"
                    )}
                  >
                    <Flag className="mr-2 h-4 w-4" />
                    {formData.deadline ? (
                      format(formData.deadline, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[160]">
                  <Calendar
                    mode="single"
                    selected={formData.deadline}
                    onSelect={(d) => setFormData({ ...formData, deadline: d })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-violet-600 text-white">
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- COMPONENT: MATRIX QUADRANT ---
interface MatrixQuadrantProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tasks: Task[];
  droppableId: string;
  colorTheme: "rose" | "blue" | "amber" | "zinc";
  onComplete: (id: string) => void;
  onTaskClick: (task: Task) => void;
}

const MatrixQuadrant = ({
  title,
  subtitle,
  icon: Icon,
  tasks,
  droppableId,
  colorTheme,
  onComplete,
  onTaskClick,
}: MatrixQuadrantProps) => {
  const themes: Record<string, { border: string; header: string }> = {
    rose: { border: "border-rose-200", header: "bg-rose-100 text-rose-800" },
    blue: { border: "border-indigo-200", header: "bg-indigo-100 text-indigo-800" },
    amber: { border: "border-amber-200", header: "bg-amber-100 text-amber-800" },
    zinc: { border: "border-zinc-200", header: "bg-zinc-200 text-zinc-800" },
  };
  const theme = themes[colorTheme];

  return (
    <div
      className={cn(
        "rounded-xl border flex flex-col relative bg-white h-full",
        theme.border
      )}
    >
      <div className={cn("flex justify-between items-center px-4 py-3 border-b shrink-0 rounded-t-xl", theme.header, theme.border)}>
         <div className="flex items-center gap-2">
             <Icon className="w-4 h-4" />
             <span className="text-sm font-bold">{title}</span>
         </div>
         <span className="text-[10px] font-bold opacity-60 uppercase">{subtitle}</span>
      </div>
      
      <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 overflow-y-auto p-3 space-y-2 min-h-[150px] transition-colors duration-200 rounded-b-xl",
              snapshot.isDraggingOver ? "bg-violet-50/50" : ""
            )}
          >
             {tasks.map((task, index) => (
                 <TaskCard
                   key={task._id}
                   task={task}
                   index={index}
                   colorVariant={colorTheme}
                   onComplete={onComplete}
                   onClick={onTaskClick}
                 />
             ))}
             {provided.placeholder}
             
             {/* Simple Quick Add for Quadrant */}
             <div className="pt-2">
                <input 
                  type="text"
                  placeholder="+ Quick add..."
                  className="w-full bg-white/50 border-none rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-400 outline-none placeholder:text-zinc-400"
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      const target = e.currentTarget;
                      const title = target.value.trim();
                      if (!title) return;
                      target.value = "";
                      
                      const props: any = {};
                      if (droppableId === "do-first") { props.isUrgent = true; props.isImportant = true; }
                      else if (droppableId === "schedule") { props.isUrgent = false; props.isImportant = true; }
                      else if (droppableId === "delegate") { props.isUrgent = true; props.isImportant = false; }
                      else if (droppableId === "eliminate") { props.isUrgent = false; props.isImportant = false; }
                      
                      await createTask.mutateAsync({
                        title,
                        status: "todo",
                        ...props
                      });
                      toast.success(`Task added to ${title}`);
                    }
                  }}
                />
             </div>
          </div>
        )}
      </Droppable>
    </div>
  );
};

// Types
type ViewTab = "today" | "plan" | "week" | "month";

const TasksPage = ({ initialTab = "today" }: { initialTab?: ViewTab }) => {
  const { tasks: allTasks, updateTask, addTask, deleteTask } = useTaskContext();
  const { projects, addProject, updateProject, deleteProject } = useProjects();

  const [activeTab, setActiveTab] = useState<ViewTab>(initialTab);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isMobileProjectOpen, setIsMobileProjectOpen] = useState(false);
  const [quickAddInput, setQuickAddInput] = useState("");
  const [isQuickAddPending, setIsQuickAddPending] = useState(false);

  // Quick Add for Today View
  const handleQuickAddToday = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!quickAddInput.trim() || isQuickAddPending) return;

    setIsQuickAddPending(true);
    try {
      await createTask.mutateAsync({
        title: quickAddInput.trim(),
        scheduledDate: new Date().toISOString(),
        status: "todo"
      });
      setQuickAddInput("");
      toast.success("Task added to Today");
    } finally {
      setIsQuickAddPending(false);
    }
  };
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectIcon, setNewProjectIcon] = useState("folder");
  const [editingProject, setEditingProject] = useState<any>(null);
  const [monthViewDate, setMonthViewDate] = useState(new Date());

  // New State for Create Dialog & Undo
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [createTaskDefaultValues, setCreateTaskDefaultValues] = useState<Partial<Task>>({});
  const [showUndo, setShowUndo] = useState(false);
  const [lastCompleted, setLastCompleted] = useState<Task | null>(null);

  const activeTask = useMemo(() => allTasks.find(t => t._id === selectedTaskId), [allTasks, selectedTaskId]);

  // Filter by project if selected
  const projectFilteredTasks = useMemo(() => {
    if (!selectedProject) return allTasks;
    return allTasks.filter(t => t.project === selectedProject);
  }, [allTasks, selectedProject]);

  // === DATA PREPARATION ===
  // Today View Data
  const todayViewData = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const overdue = projectFilteredTasks.filter(t =>
      !t.completed &&
      t.scheduledDate &&
      isPast(new Date(t.scheduledDate)) 
    );

    const urgentImportant = projectFilteredTasks.filter(t =>
      !t.completed &&
      t.isUrgent &&
      t.isImportant &&
      !overdue.some(o => o._id === t._id)
    );

    const todayTasks = projectFilteredTasks.filter(t =>
      !t.completed &&
      t.scheduledDate &&
      isWithinInterval(new Date(t.scheduledDate), { start: todayStart, end: todayEnd }) &&
      !urgentImportant.some(u => u._id === t._id) &&
      !overdue.some(o => o._id === t._id)
    );

    return { overdue, urgentImportant, todayTasks };
  }, [projectFilteredTasks]);

  // Week View Data
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, idx) => {
      const date = addDays(new Date(), idx);
      return {
        date,
        dateKey: format(date, "yyyy-MM-dd"),
        dayName: isToday(date) ? "Today" : isTomorrow(date) ? "Tomorrow" : format(date, "EEE"),
        fullDate: format(date, "d MMM"),
        isToday: isToday(date),
        tasks: projectFilteredTasks.filter(t =>
          !t.completed &&
          t.scheduledDate &&
          isWithinInterval(new Date(t.scheduledDate), {
            start: startOfDay(date),
            end: endOfDay(date)
          })
        )
      };
    });
  }, [projectFilteredTasks]);

  // Plan View Data (Matrix)
  const planViewData = useMemo(() => {
    const backlog = projectFilteredTasks.filter(t =>
      !t.completed &&
      (!t.status || t.status === "backlog") &&
      !t.scheduledDate // Ensure scheduled tasks don't appear in backlog unless explicitly backlog status
    );

    const doFirst = projectFilteredTasks.filter(t => !t.completed && t.isUrgent && t.isImportant && t.status !== 'backlog');
    const schedule = projectFilteredTasks.filter(t => !t.completed && !t.isUrgent && t.isImportant && t.status !== 'backlog');
    const delegate = projectFilteredTasks.filter(t => !t.completed && t.isUrgent && !t.isImportant && t.status !== 'backlog');
    const eliminate = projectFilteredTasks.filter(t => !t.completed && !t.isUrgent && !t.isImportant && t.status !== 'backlog');

    return { backlog, doFirst, schedule, delegate, eliminate };
  }, [projectFilteredTasks]);

  // Month View Data
  const monthData = useMemo(() => {
    const monthStart = startOfMonth(monthViewDate);
    const monthEnd = endOfMonth(monthViewDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDayOfWeek = getDay(monthStart);

    return {
      days,
      startDayOfWeek,
      tasksMap: days.reduce((acc, day) => {
        const dayKey = format(day, "yyyy-MM-dd");
        acc[dayKey] = projectFilteredTasks.filter(t =>
          !t.completed &&
          t.scheduledDate &&
          isWithinInterval(new Date(t.scheduledDate), {
            start: startOfDay(day),
            end: endOfDay(day)
          })
        );
        return acc;
      }, {} as Record<string, Task[]>)
    };
  }, [monthViewDate, projectFilteredTasks]);

  // === HANDLERS ===
  const handleOpenCreateTask = (defaults: Partial<Task> = {}) => {
    setCreateTaskDefaultValues({
        project: selectedProject || undefined,
        ...defaults
    });
    setIsCreateTaskOpen(true);
  };

  const handleCompleteTask = (id: string) => {
    const task = allTasks.find(t => t._id === id);
    if (task) {
      updateTask(id, { completed: true, status: 'done' });
      setLastCompleted(task);
      setShowUndo(true);
      toast.success("Task completed", {
        action: {
            label: "Undo",
            onClick: () => handleUndo()
        }
      });
      setTimeout(() => setShowUndo(false), 5000);
    }
  };

  const handleUndo = () => {
    if (lastCompleted) {
      updateTask(lastCompleted._id, {
        completed: false,
        status: lastCompleted.status || 'todo'
      });
      setShowUndo(false);
      setLastCompleted(null);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const taskToDelete = allTasks.find(t => t._id === taskId);
    // Optimistic deletion/Undo handling
    if (!taskToDelete) return;

    deleteTask(taskId);
    if (selectedTaskId === taskId) setSelectedTaskId(null);

    toast.success("Task deleted", {
      action: {
        label: "Undo",
        onClick: () => {
             const { _id, ...rest } = taskToDelete; 
             addTask(rest);
        }
      },
      duration: 5000,
    });
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, draggableId } = result;
    if (!destination) return;

    const destId = destination.droppableId;
    
    // Matrix Logic
    if (destId === "do-first") {
      updateTask(draggableId, { isUrgent: true, isImportant: true, status: "todo" });
    } else if (destId === "schedule") {
      updateTask(draggableId, { isUrgent: false, isImportant: true, status: "todo" });
    } else if (destId === "delegate") {
      updateTask(draggableId, { isUrgent: true, isImportant: false, status: "todo" });
    } else if (destId === "eliminate") {
      updateTask(draggableId, { isUrgent: false, isImportant: false, status: "todo" });
    } else if (destId === "backlog") {
      updateTask(draggableId, { isUrgent: false, isImportant: false, scheduledDate: undefined, status: "backlog" });
    } else if (destId.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Calendar/Week View Logic
      updateTask(draggableId, {
        scheduledDate: new Date(destId).toISOString()
      });
    }
  };

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    addProject({
      name: newProjectName.trim(),
      color: "#6366f1",
      icon: newProjectIcon
    });
    setNewProjectName("");
    setNewProjectIcon("folder");
    setIsProjectDialogOpen(false);
  };

  const handleUpdateProject = () => {
    if (!editingProject || !newProjectName.trim()) return;
    updateProject(editingProject._id, {
      name: newProjectName.trim(),
      icon: newProjectIcon
    });
    setNewProjectName("");
    setNewProjectIcon("folder");
    setEditingProject(null);
    setIsProjectDialogOpen(false);
  };

  const handleDeleteProject = (projectId: string) => {
    if (confirm("Delete this project? Tasks will be moved to Inbox.")) {
      deleteProject(projectId);
      if (selectedProject === projects.find(p => p._id === projectId)?.name) {
        setSelectedProject(null);
      }
    }
  };

  interface TaskSectionProps {
    title: string;
    icon: LucideIcon; 
    tasks: Task[];
    color?: string;
    emptyText?: string;
  }

  // Internal Component for Task Sections (Today View)
  const TaskSection = ({ title, icon: Icon, tasks, color = "zinc", emptyText }: TaskSectionProps) => {
    if (tasks.length === 0 && color !== "zinc") return null;

    return (
      <div className="mb-8">
        <div className={cn(
          "flex items-center gap-2 mb-4",
          color === "red" && "text-red-600",
          color === "orange" && "text-orange-600",
          color === "zinc" && "text-zinc-700"
        )}>
          <div className={cn(
            "p-1.5 rounded-lg",
            color === "red" && "bg-red-100",
            color === "orange" && "bg-orange-100",
            color === "zinc" && "bg-zinc-100"
          )}>
            <Icon className="w-4 h-4" />
          </div>
          <h3 className="font-semibold">{title}</h3>
          <span className="text-xs bg-zinc-100 px-2 py-0.5 rounded-full font-medium ml-2 text-zinc-500">
             {tasks.length}
          </span>
        </div>
        <Droppable droppableId={title.toLowerCase().replace(/\s/g, '-')}>
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
              {tasks.length > 0 ? (
                tasks.map((task: Task, idx: number) => (
                    <TaskCard
                        key={task._id}
                        task={task}
                        index={idx}
                        onComplete={handleCompleteTask}
                        onClick={() => setSelectedTaskId(task._id)}
                    />
                ))
              ) : (
                <div className="text-center py-8 bg-zinc-50 rounded-xl border-2 border-dashed border-zinc-200">
                  <p className="text-sm text-zinc-400">{emptyText || "No tasks"}</p>
                </div>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex h-[calc(100vh-2rem)] max-w-[1800px] mx-auto overflow-hidden bg-white shadow-sm border border-zinc-200 rounded-2xl relative">

          {/* === LEFT SIDEBAR (Projects) === */}
          <div className={cn(
            "w-[240px] flex-shrink-0 bg-gradient-to-b from-zinc-50 to-zinc-100/50 border-r border-zinc-200 transition-all z-20 md:static absolute inset-y-0 left-0",
            isMobileProjectOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}>
            {/* Mobile Close Button */}
            <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden absolute right-2 top-2 z-30"
                onClick={() => setIsMobileProjectOpen(false)}
            >
                <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="p-5">
              <h2 className="font-bold text-zinc-800">Projects</h2>
            </div>
            <ScrollArea className="h-[calc(100%-140px)]">
              <div className="px-3 space-y-1">
                <button
                  onClick={() => setSelectedProject(null)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-all",
                    !selectedProject
                      ? "bg-white shadow-sm text-indigo-900 font-semibold ring-1 ring-zinc-200"
                      : "text-zinc-600 hover:bg-white/60"
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    !selectedProject ? "bg-indigo-100 text-indigo-700" : "bg-zinc-100 text-zinc-500"
                  )}>
                    <Inbox className="w-4 h-4" />
                  </div>
                  <span className="flex-1 text-left">All Tasks</span>
                  <span className={cn(
                    "text-[10px] font-medium min-w-[20px] text-center",
                    !selectedProject ? "text-indigo-600" : "text-zinc-400"
                  )}>
                    {allTasks.filter(t => !t.completed).length}
                  </span>
                </button>
                <div className="h-px bg-zinc-200 my-3" />
                {projects.map(p => {
                  const ProjectIcon = getProjectIcon(p.icon);
                  const taskCount = allTasks.filter(t => !t.completed && t.project === p.name).length;
                  const isSelected = selectedProject === p.name;
                  return (
                    <div key={p._id} className="group relative">
                      <button
                        onClick={() => setSelectedProject(p.name)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-all",
                          isSelected
                            ? "bg-white shadow-sm text-indigo-900 font-semibold ring-1 ring-zinc-200"
                            : "text-zinc-600 hover:bg-white/60"
                        )}
                      >
                        <div className={cn(
                          "p-1.5 rounded-lg transition-colors",
                          isSelected ? "bg-indigo-100 text-indigo-700" : "bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200"
                        )}>
                          <ProjectIcon className="w-4 h-4" />
                        </div>
                        <span className="truncate flex-1 text-left">{p.name}</span>
                        <span className={cn(
                            "text-[10px] font-medium min-w-[20px] text-center",
                             isSelected ? "text-indigo-600" : "text-zinc-400"
                        )}>{taskCount}</span>
                      </button>
                      {/* Dropdown menu for project actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-zinc-100 rounded-lg"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5 text-zinc-400" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingProject(p);
                              setNewProjectName(p.name);
                              setNewProjectIcon(p.icon || "folder");
                              setIsProjectDialogOpen(true);
                            }}
                            className="text-xs gap-2"
                          >
                            <Pencil className="w-3 h-3" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteProject(p._id)}
                            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-zinc-200 hidden md:block">
              <Button
                onClick={() => {
                  setEditingProject(null);
                  setNewProjectName("");
                  setNewProjectIcon("folder");
                  setIsProjectDialogOpen(true);
                }}
                variant="outline"
                className="w-full justify-start gap-2 h-10 bg-white hover:bg-zinc-50"
              >
                <Plus className="w-4 h-4" />
                New Project
              </Button>
            </div>
          </div>

          {/* === MAIN CONTENT === */}
          <div className="flex-1 flex flex-col min-w-0 bg-zinc-50/30">
            <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-4 md:px-6 shrink-0">
              <div className="flex items-center gap-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="md:hidden flex gap-2 border-indigo-200 text-indigo-700 bg-indigo-50"
                    onClick={() => setIsMobileProjectOpen(true)}
                  >
                    <PanelLeft className="w-4 h-4" />
                    <span className="max-w-[100px] truncate font-bold">
                        {selectedProject || "All Tasks"}
                    </span>
                  </Button>
                  
                  {/* Desktop Only Project Label */}
                  <div className="hidden md:flex items-center gap-2 px-2">
                       {selectedProject ? (
                          <div className="flex items-center gap-1.5 text-indigo-900">
                             {(() => {
                                const p = projects.find(proj => proj.name === selectedProject);
                                const Icon = p ? getProjectIcon(p.icon) : Folder;
                                return <Icon className="w-4 h-4 text-indigo-600" />
                             })()}
                             <h1 className="text-sm font-semibold">{selectedProject}</h1>
                          </div>
                       ) : (
                          <div className="flex items-center gap-1.5 text-zinc-700">
                             <Inbox className="w-4 h-4 text-zinc-500" />
                             <h1 className="text-sm font-semibold">All Tasks</h1>
                          </div>
                       )}
                  </div>

                  <div className="h-6 w-px bg-zinc-200 hidden md:block" />

                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ViewTab)}>
                    <TabsList className="bg-zinc-100 p-0.5 h-8 w-full md:w-auto overflow-x-auto justify-start border border-zinc-200/50">
                      <TabsTrigger value="today" className="gap-1.5 px-2 md:px-2.5 text-xs h-7">Today</TabsTrigger>
                      <TabsTrigger value="plan" className="gap-1.5 px-2 md:px-2.5 text-xs h-7">Plan</TabsTrigger>
                      <TabsTrigger value="week" className="gap-1.5 px-2 md:px-2.5 text-xs h-7 hidden sm:inline-flex">Week</TabsTrigger>
                      <TabsTrigger value="month" className="gap-1.5 px-2 md:px-2.5 text-xs h-7 hidden sm:inline-flex">Month</TabsTrigger>
                    </TabsList>
                  </Tabs>
              </div>
              <div className="flex items-center gap-2">
                 <Button onClick={() => handleOpenCreateTask()} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-9 md:h-10 text-sm md:text-base">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add Task</span>
                 </Button>
              </div>
            </header>

            {/* === TODAY VIEW === */}
            {activeTab === "today" && (
              <ScrollArea className="flex-1">
                <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-10">
                    <form 
                        onSubmit={handleQuickAddToday}
                        className="relative group h-14 bg-white rounded-2xl border border-zinc-200 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all flex items-center px-4 gap-3"
                    >
                        <Plus className={cn("w-5 h-5 text-zinc-400 group-focus-within:text-indigo-500 transition-colors", quickAddInput && "text-indigo-500")} />
                        <input 
                          type="text"
                          value={quickAddInput}
                          onChange={(e) => setQuickAddInput(e.target.value)}
                          placeholder="Quick add task for Today..."
                          className="flex-1 h-full bg-transparent border-none outline-none text-zinc-800 font-medium placeholder:text-zinc-400"
                          disabled={isQuickAddPending}
                        />
                        {quickAddInput && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase hidden sm:block">Press Enter</span>
                            <Button type="submit" disabled={isQuickAddPending} size="sm" className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
                              Add
                            </Button>
                          </div>
                        )}
                    </form>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                       <div className="space-y-8">
                          <TaskSection title="Priority" icon={Flame} tasks={todayViewData.urgentImportant} color="orange" emptyText="No priority tasks" />
                          <TaskSection title="Today" icon={CalendarIcon} tasks={todayViewData.todayTasks} emptyText="No tasks scheduled for today" />
                       </div>
                       <div className="space-y-8">
                          <TaskSection title="Overdue" icon={AlertTriangle} tasks={todayViewData.overdue} color="red" emptyText="No overdue tasks" />
                          <div className="bg-zinc-50/50 rounded-2xl p-6 border border-zinc-100">
                             <h4 className="font-bold text-zinc-400 text-xs uppercase tracking-widest mb-4">Focus Tip</h4>
                             <p className="text-sm text-zinc-600 italic">"Focus on being productive instead of busy." — Tim Ferriss</p>
                          </div>
                       </div>
                    </div>
                </div>
              </ScrollArea>
            )}

            {/* === PLAN VIEW (Matrix) === */}
            {activeTab === "plan" && (
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Backlog */}
                <div className="w-full md:w-[300px] h-[300px] md:h-auto border-b md:border-b-0 md:border-r border-zinc-200 bg-white flex flex-col shrink-0">
                  <div className="p-4 border-b border-zinc-100 bg-white sticky top-0 z-10">
                     <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-zinc-800 flex items-center gap-2">
                            <Inbox className="w-4 h-4" /> Inbox
                        </h3>
                        <span className="text-xs text-zinc-400 font-medium">{planViewData.backlog.length} tasks</span>
                     </div>
                     {/* Quick Add for Backlog */}
                     <input 
                        type="text"
                        placeholder="+ Quick add to Inbox..."
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-400"
                        onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                                const target = e.currentTarget;
                                const title = target.value.trim();
                                if (!title) return;
                                target.value = "";
                                await createTask.mutateAsync({
                                    title,
                                    status: "backlog"
                                });
                                toast.success("Task added to Inbox");
                            }
                        }}
                     />
                  </div>
                  <Droppable droppableId="backlog">
                    {(provided, snapshot) => (
                       <ScrollArea className="flex-1 bg-zinc-50/30">
                          <div ref={provided.innerRef} {...provided.droppableProps} className={cn("p-3 space-y-2 min-h-[200px]", snapshot.isDraggingOver && "bg-indigo-50/50")}>
                             {planViewData.backlog.map((task, idx) => (
                                <TaskCard key={task._id} task={task} index={idx} onComplete={handleCompleteTask} onClick={() => setSelectedTaskId(task._id)} />
                             ))}
                             {provided.placeholder}
                             {planViewData.backlog.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-10 text-zinc-400 gap-2 opacity-60">
                                    <Inbox className="w-8 h-8 stroke-1" />
                                    <p className="text-xs">Your inbox is empty</p>
                                </div>
                             )}
                          </div>
                       </ScrollArea>
                    )}
                  </Droppable>
                </div>

                {/* Matrix Grid */}
                <div className="flex-1 p-2 md:p-4 overflow-y-auto bg-slate-50/30">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 h-full w-full max-w-[1400px] mx-auto min-h-[600px] md:min-h-0">
                      <MatrixQuadrant title="Do First" subtitle="Urgent & Important" icon={AlertCircle} droppableId="do-first" colorTheme="rose" tasks={planViewData.doFirst} onComplete={handleCompleteTask} onTaskClick={(t) => setSelectedTaskId(t._id)} />
                      <MatrixQuadrant title="Schedule" subtitle="Not Urgent & Important" icon={CalendarIcon} droppableId="schedule" colorTheme="blue" tasks={planViewData.schedule} onComplete={handleCompleteTask} onTaskClick={(t) => setSelectedTaskId(t._id)} />
                      <MatrixQuadrant title="Delegate" subtitle="Urgent & Not Important" icon={Users} droppableId="delegate" colorTheme="amber" tasks={planViewData.delegate} onComplete={handleCompleteTask} onTaskClick={(t) => setSelectedTaskId(t._id)} />
                      <MatrixQuadrant title="Eliminate" subtitle="Not Urgent & Not Important" icon={Trash2} droppableId="eliminate" colorTheme="zinc" tasks={planViewData.eliminate} onComplete={handleCompleteTask} onTaskClick={(t) => setSelectedTaskId(t._id)} />
                   </div>
                </div>
              </div>
            )}

            {/* === WEEK VIEW === */}
            {activeTab === "week" && (
              <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <div className="h-full flex p-6 gap-4 min-w-max">
                  {weekDays.map(({ date, dateKey, dayName, fullDate, isToday: isTodayDate, tasks }) => (
                    <div key={dateKey} className={cn("w-[280px] flex flex-col h-full rounded-2xl border bg-white overflow-hidden", "border-zinc-200")}>
                      <div className={cn("px-4 py-3 border-b flex justify-between items-center shrink-0", isTodayDate ? "bg-emerald-50 border-emerald-100" : "bg-zinc-50 border-zinc-100")}>
                         <div>
                            <h3 className={cn("font-bold", isTodayDate ? "text-emerald-700" : "text-zinc-700")}>{dayName}</h3>
                            <p className="text-xs text-zinc-500">{fullDate}</p>
                         </div>
                         <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleOpenCreateTask({ scheduledDate: date.toISOString() })}>
                            <Plus className="w-3 h-3" />
                         </Button>
                      </div>
                      
                      <Droppable droppableId={dateKey}>
                        {(provided, snapshot) => (
                          <div 
                            ref={provided.innerRef} 
                            {...provided.droppableProps} 
                            className={cn("flex-1 p-3 overflow-y-auto space-y-2 transition-colors", snapshot.isDraggingOver && "bg-indigo-50/50")}
                          >
                             {tasks.map((task, idx) => (
                                <TaskCard key={task._id} task={task} index={idx} onComplete={handleCompleteTask} onClick={() => setSelectedTaskId(task._id)} />
                             ))}
                             {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* === MONTH VIEW === */}
            {activeTab === "month" && (
               <div className="flex-1 p-6 overflow-auto">
                 {/* Navigation */}
                 <div className="flex items-center justify-center gap-4 mb-6">
                    <Button variant="outline" size="icon" onClick={() => setMonthViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}><ChevronLeft className="w-4 h-4" /></Button>
                    <h2 className="text-xl font-bold text-zinc-800 w-48 text-center">{format(monthViewDate, "MMMM yyyy")}</h2>
                    <Button variant="outline" size="icon" onClick={() => setMonthViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}><ChevronRight className="w-4 h-4" /></Button>
                 </div>
                 {/* Calendar */}
                 <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden max-w-6xl mx-auto">
                    <div className="grid grid-cols-7 bg-zinc-50 border-b">
                       {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div key={d} className="py-2 text-center text-xs font-bold text-zinc-400 uppercase">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7">
                       {Array.from({ length: monthData.startDayOfWeek }).map((_, i) => <div key={`empty-${i}`} className="min-h-[120px] bg-zinc-50/30 border-b border-r border-zinc-100" />)}
                       {monthData.days.map(day => {
                          const dateKey = format(day, "yyyy-MM-dd");
                          const tasks = monthData.tasksMap[dateKey] || [];
                          return (
                             <Droppable droppableId={dateKey} key={dateKey}>
                                {(provided, snapshot) => (
                                   <div ref={provided.innerRef} {...provided.droppableProps} className={cn("min-h-[120px] border-b border-r border-zinc-100 p-2 transition-colors", snapshot.isDraggingOver && "bg-indigo-50", isToday(day) && "bg-emerald-50/30")}>
                                      <div className="flex justify-between items-start mb-1">
                                         <span className={cn("text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center", isToday(day) ? "bg-emerald-500 text-white" : "text-zinc-500")}>{format(day, "d")}</span>
                                         <button onClick={() => handleOpenCreateTask({ scheduledDate: day.toISOString() })} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-100 rounded"><Plus className="w-3 h-3 text-zinc-400" /></button>
                                      </div>
                                      <div className="space-y-1">
                                         {tasks.slice(0, 3).map((task, idx) => (
                                            <TaskCard key={task._id} task={task} index={idx} compact onClick={() => setSelectedTaskId(task._id)} />
                                         ))}
                                         {tasks.length > 3 && <div className="text-[10px] text-zinc-400 pl-1">+{tasks.length - 3} more</div>}
                                         {provided.placeholder}
                                      </div>
                                   </div>
                                )}
                             </Droppable>
                          )
                       })}
                    </div>
                 </div>
               </div>
            )}

          </div>

          {/* === DETAILS PANEL === */}
          <AnimatePresence>
            {selectedTaskId && activeTask && (
              <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 400, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="border-l border-zinc-200 bg-white shadow-xl z-20">
                <TaskDetailPanel task={activeTask} onClose={() => setSelectedTaskId(null)} onUpdate={updateTask} onDelete={handleDeleteTask} projects={projects} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DragDropContext>

      {/* Dialogs */}
      <CreateTaskDialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen} onCreate={addTask} projects={projects} defaultValues={createTaskDefaultValues} />

      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>{editingProject ? "Edit Project" : "New Project"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="space-y-2">
                <Label>Name</Label>
                <Input value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="Project Name" />
             </div>
             <div className="space-y-2">
                <Label>Icon</Label>
                <div className="flex gap-2 flex-wrap">
                   {PROJECT_ICONS.map(i => (
                      <button key={i.id} onClick={() => setNewProjectIcon(i.id)} className={cn("p-2 rounded-lg border", newProjectIcon === i.id ? "bg-indigo-100 border-indigo-400 text-indigo-700" : "border-zinc-200 text-zinc-400 hover:bg-zinc-50")}>
                         <i.icon className="w-4 h-4" />
                      </button>
                   ))}
                </div>
             </div>
          </div>
          <DialogFooter>
             <Button variant="ghost" onClick={() => setIsProjectDialogOpen(false)}>Cancel</Button>
             <Button onClick={editingProject ? handleUpdateProject : handleCreateProject}>{editingProject ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default TasksPage;
