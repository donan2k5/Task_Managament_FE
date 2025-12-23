import { useState, useRef, useEffect, forwardRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Calendar as CalendarIcon,
  Briefcase,
  Check,
  CheckCircle2,
  Undo2,
  GripVertical,
  AlertCircle,
  Users,
  Trash2,
  History,
  X,
  RefreshCcw,
  Loader2,
  Flag,
  Clock,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Task } from "@/types/index";
import { useTaskContext } from "@/context/TaskContext";
import { useProjects } from "@/hooks/useProjects";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { format, isToday, isTomorrow, isPast } from "date-fns";

// UI Components
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

// Time formatting helpers
const formatTimeForDisplay = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const period = hours >= 12 ? "pm" : "am";
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHour}:${minutes.toString().padStart(2, "0")}${period}`;
};

const QUICK_TIME_OPTIONS = [
  "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00",
  "17:00", "18:00", "19:00", "20:00",
  "21:00", "22:00", "23:00", "23:59",
];

// --- COMPONENT: DEADLINE BADGE ---
const DeadlineBadge = ({ deadline }: { deadline?: string }) => {
  if (!deadline) return null;
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return null;

  const isOverdue = isPast(d) && !isToday(d);
  const isDueToday = isToday(d);

  let containerClass = "bg-slate-50 text-slate-500 border-slate-200";
  let Icon = Flag;
  let timeClass = "text-slate-500 font-medium";

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

// --- COMPONENT: CREATE TASK DIALOG (POPUP ADD FULL) ---
const CreateTaskDialog = ({ open, onOpenChange, onCreate, projects }: any) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project: "",
    isUrgent: false,
    isImportant: false,
    scheduledDate: undefined as Date | undefined,
    deadline: undefined as Date | undefined,
  });

  const handleSubmit = () => {
    if (!formData.title.trim()) return;

    // FIX: Xử lý no_project
    const finalProject =
      formData.project === "no_project" || formData.project === ""
        ? undefined
        : formData.project;

    onCreate({
      ...formData,
      status: "backlog",
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
                  {projects.map((p: any) => (
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
                      : "text-slate-500"
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
                      : "text-slate-500"
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};
const getProjectColor = (projectName?: string) => {
  if (!projectName) return "bg-slate-300";
  const char = projectName.charAt(0).toLowerCase();
  if (["a", "b", "c", "v"].includes(char)) return "bg-violet-500";
  if (["d", "e", "f", "i"].includes(char)) return "bg-blue-500";
  return "bg-orange-400";
};

const TaskCard = forwardRef<HTMLDivElement, any>(
  (
    {
      task,
      onComplete,
      onRestore,
      onClick,
      isReadOnly = false,
      colorVariant = "white",
      onDragStart,
      onDragEnter,
      onDragEnd,
    },
    ref
  ) => {
    const colorStyles: any = {
      white: "bg-white border-slate-200 hover:border-violet-300",
      rose: "bg-white border-rose-100 hover:border-rose-300 hover:bg-rose-50",
      blue: "bg-white border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50",
      amber:
        "bg-white border-amber-100 hover:border-amber-300 hover:bg-amber-50",
      slate:
        "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50",
    };

    return (
      <motion.div
        ref={ref}
        layout={!isReadOnly}
        layoutId={isReadOnly ? undefined : task._id}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        draggable={!isReadOnly}
        onDragStart={(e: any) =>
          !isReadOnly && onDragStart && onDragStart(e, task)
        }
        onDragEnter={(e: any) =>
          !isReadOnly && onDragEnter && onDragEnter(e, task)
        }
        onDragEnd={onDragEnd}
        onClick={() => !isReadOnly && onClick && onClick(task)}
        initial="hidden"
        animate="visible"
        variants={itemVariants}
        className={cn(
          "group p-3 rounded-xl border shadow-sm relative flex gap-3 items-start select-none bg-white",
          !isReadOnly && "cursor-pointer hover:shadow-md transition-all",
          !isReadOnly
            ? colorStyles[colorVariant]
            : "border-slate-100 opacity-75"
        )}
      >
        <div
          className={cn(
            "w-1 h-8 rounded-full shrink-0 mt-1",
            getProjectColor(task.project)
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <p
              className={cn(
                "text-sm font-semibold text-slate-800 leading-snug line-clamp-2 mt-0.5",
                isReadOnly && "line-through text-slate-500"
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
                  className="group/btn relative w-6 h-6 rounded-full border-2 border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 flex items-center justify-center transition-all duration-200"
                  title="Mark as done"
                >
                  <Check
                    className="w-3.5 h-3.5 text-emerald-600 opacity-0 scale-50 group-hover/btn:opacity-100 group-hover/btn:scale-100 transition-all duration-200"
                    strokeWidth={3}
                  />
                </button>
              )}
              {isReadOnly && onRestore && (
                <button
                  onClick={() => onRestore(task._id)}
                  className="text-slate-400 hover:text-blue-500 transition-colors p-1 bg-slate-100 rounded hover:bg-blue-50"
                >
                  <RefreshCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {task.project && (
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                <Briefcase className="w-3 h-3 text-slate-400" /> {task.project}
              </span>
            )}

            {task.scheduledDate && (
              <div
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded flex items-center bg-slate-50 text-slate-500 border border-slate-100 gap-1.5"
                )}
              >
                <span className="flex items-center gap-1 font-semibold">
                  <CalendarIcon className="w-3 h-3" />
                  {getTaskDateLabel(task.scheduledDate)}
                </span>
                {task.scheduledDate && (
                  <>
                    <span className="opacity-40 text-slate-400">|</span>
                    <span className="flex items-center gap-1 font-bold text-slate-600">
                      {format(new Date(task.scheduledDate), "HH:mm")}
                    </span>
                  </>
                )}
              </div>
            )}
            <DeadlineBadge deadline={task.deadline} />
          </div>
        </div>
        {!isReadOnly && (
          <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-slate-300 transition-opacity">
            <GripVertical className="w-3 h-3" />
          </div>
        )}
      </motion.div>
    );
  }
);
TaskCard.displayName = "TaskCard";

const MatrixQuadrant = ({
  title,
  subtitle,
  icon: Icon,
  tasks,
  colorTheme,
  onDragOverQuadrant,
  onDropInQuadrant,
  onTaskDragStart,
  onTaskDragEnter,
  onTaskDragEnd,
  onComplete,
  onTaskClick,
}: any) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const themes: any = {
    rose: {
      border: "border-rose-200",
      header: "bg-rose-100 text-rose-800",
    },
    blue: {
      border: "border-indigo-200",
      header: "bg-indigo-100 text-indigo-800",
    },
    amber: {
      border: "border-amber-200",
      header: "bg-amber-100 text-amber-800",
    },
    slate: {
      border: "border-slate-200",
      header: "bg-slate-200 text-slate-800",
    },
  };
  const theme = themes[colorTheme];
  return (
    <div
      className={cn(
        "rounded-2xl border flex flex-col relative transition-all duration-200 h-full bg-white/50 backdrop-blur-sm",
        theme.border,
        isDragOver ? "ring-2 ring-violet-400 ring-offset-2 bg-violet-50/50" : ""
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
        onDragOverQuadrant(e);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        setIsDragOver(false);
        onDropInQuadrant(e);
      }}
    >
      <div
        className={cn(
          "flex justify-between items-center px-4 py-3 border-b",
          theme.header,
          theme.border
        )}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <span className="text-sm font-bold">{title}</span>
        </div>
        <span className="text-[10px] font-bold opacity-60 uppercase">
          {subtitle}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar bg-slate-50/30">
        <AnimatePresence mode="popLayout" initial={false}>
          {tasks.map((task: Task) => (
            <TaskCard
              key={task._id}
              task={task}
              colorVariant={colorTheme}
              onComplete={onComplete}
              onDragStart={onTaskDragStart}
              onDragEnter={onTaskDragEnter}
              onDragEnd={onTaskDragEnd}
              onClick={onTaskClick}
            />
          ))}
        </AnimatePresence>
        {tasks.length === 0 && !isDragOver && (
          <div className="h-full flex flex-col items-center justify-center opacity-30">
            <span className="text-xs font-medium">Empty</span>
          </div>
        )}
      </div>
    </div>
  );
};

const CompletedModal = ({ isOpen, onClose, tasks, onRestore }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 flex flex-col max-h-[80vh]"
      >
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Completed Tasks
              </h3>
              <p className="text-xs text-slate-500">
                {tasks.length} tasks finished
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {tasks.length > 0 ? (
            tasks.map((task: Task) => (
              <TaskCard
                key={task._id}
                task={task}
                isReadOnly
                onRestore={onRestore}
              />
            ))
          ) : (
            <div className="text-center py-12 text-slate-400">
              No history yet.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const Tasks = () => {
  const {
    tasks: taskList,
    addTask,
    updateTask,
    deleteTask,
    loading,
  } = useTaskContext();
  const { projects: projectList } = useProjects();
  const [completedList, setCompletedList] = useState<Task[]>([]);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [showUndo, setShowUndo] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [lastCompleted, setLastCompleted] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const dragItem = useRef<Task | null>(null);

  // Quick Add State
  const [quickTitle, setQuickTitle] = useState("");
  const [quickProject, setQuickProject] = useState("");
  const [quickDeadline, setQuickDeadline] = useState<Date | undefined>(
    undefined
  );
  const [quickDeadlineTime, setQuickDeadlineTime] = useState<string>("23:59");

  useEffect(() => {
    if (selectedTask) {
      const updated = taskList.find((t) => t._id === selectedTask._id);
      if (updated) setSelectedTask(updated);
    }
  }, [taskList, selectedTask]);

  useEffect(() => {
    setCompletedList(taskList.filter((t) => t.status === "done"));
  }, [taskList]);

  // Handle Quick Add
  const handleQuickAdd = () => {
    if (!quickTitle.trim()) return;

    let deadlineISO: string | undefined;
    if (quickDeadline) {
      const deadlineDate = new Date(quickDeadline);
      const [hours, minutes] = quickDeadlineTime.split(":").map(Number);
      deadlineDate.setHours(hours, minutes);
      deadlineISO = deadlineDate.toISOString();
    }

    addTask({
      title: quickTitle,
      project: quickProject || undefined,
      deadline: deadlineISO,
      scheduledDate: undefined,
      isUrgent: false,
      isImportant: false,
      completed: false,
      status: "backlog",
    });

    setQuickTitle("");
    setQuickDeadline(undefined);
    setQuickDeadlineTime("23:59");
  };

  const handleComplete = (id: string) => {
    const task = taskList.find((t) => t._id === id);
    if (task) {
      updateTask(id, { status: "done", completed: true });
      setLastCompleted(task);
      setShowUndo(true);
      setTimeout(() => setShowUndo(false), 4000);
    }
  };

  const handleUndo = () => {
    if (lastCompleted) {
      updateTask(lastCompleted._id, {
        status: lastCompleted.status,
        completed: false,
      });
      setShowUndo(false);
      setLastCompleted(null);
    }
  };

  const handleRestore = (id: string) => {
    updateTask(id, { status: "backlog", completed: false });
  };

  const onDragStart = (e: React.DragEvent, task: Task) => {
    dragItem.current = task;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("taskId", task._id);
  };
  const onDragEnter = (e: React.DragEvent, targetTask: Task) => {
    if (!dragItem.current || dragItem.current._id === targetTask._id) return;
  };
  const onDragEnd = () => {
    dragItem.current = null;
  };

  const handleDropInQuadrant = (
    e: React.DragEvent,
    targetUrgent: boolean,
    targetImportant: boolean,
    targetStatus: "backlog" | "todo"
  ) => {
    e.preventDefault();
    if (!dragItem.current) return;
    updateTask(dragItem.current._id, {
      status: targetStatus,
      isUrgent: targetUrgent,
      isImportant: targetImportant,
    });
  };

  const backlogTasks = taskList.filter((t) => t.status === "backlog");
  const q1Tasks = taskList.filter(
    (t) => t.status === "todo" && t.isUrgent && t.isImportant
  );
  const q2Tasks = taskList.filter(
    (t) => t.status === "todo" && !t.isUrgent && t.isImportant
  );
  const q3Tasks = taskList.filter(
    (t) => t.status === "todo" && t.isUrgent && !t.isImportant
  );
  const q4Tasks = taskList.filter(
    (t) => t.status === "todo" && !t.isUrgent && !t.isImportant
  );

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
          <span className="text-slate-400 text-sm font-medium">
            Loading workspace...
          </span>
        </div>
      </div>
    );

  return (
    <DashboardLayout>
      <motion.div
        className="p-6 max-w-[1600px] mx-auto h-[calc(100vh-2rem)] flex flex-col overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-between mb-5 shrink-0"
        >
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Task Matrix</h1>
            <p className="text-sm text-slate-500">Eisenhower Method</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-violet-600 hover:bg-violet-700 text-white gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Task
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCompletedModal(true)}
              className="gap-2 text-slate-600"
            >
              <History className="w-4 h-4 text-slate-400" /> Archive (
              {completedList.length})
            </Button>
          </div>
        </motion.div>

        <div className="flex flex-1 gap-6 min-h-0">
          {/* Backlog Column */}
          <motion.div
            variants={itemVariants}
            className="w-80 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-shrink-0"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDropInQuadrant(e, false, false, "backlog")}
          >
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                  Backlog
                </h3>
                <span className="text-xs bg-slate-200 px-2 rounded-full font-bold">
                  {backlogTasks.length}
                </span>
              </div>

              {/* Quick Add */}
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Quick add task..."
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 focus:border-violet-500 outline-none bg-white shadow-sm"
                />
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select
                      value={quickProject}
                      onChange={(e) => setQuickProject(e.target.value)}
                      className="w-full text-[11px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none cursor-pointer hover:bg-slate-50 appearance-none pl-6"
                    >
                      <option value="">No Project</option>
                      {projectList.map((p) => (
                        <option key={p._id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <Hash className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                  </div>

                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1 text-[11px] font-bold border rounded-lg px-2 py-1.5 transition-colors",
                          quickDeadline
                            ? "bg-violet-50 text-violet-600 border-violet-200"
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        <Flag className="w-3 h-3" />
                        {quickDeadline
                          ? `${format(quickDeadline, "MMM d")} ${formatTimeForDisplay(quickDeadlineTime)}`
                          : "Deadline"}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[100]" align="end">
                      <div className="p-3 border-b border-slate-100">
                        <div className="text-xs font-semibold text-slate-500 mb-2">Time</div>
                        <Select value={quickDeadlineTime} onValueChange={setQuickDeadlineTime}>
                          <SelectTrigger className="h-8 w-full text-xs">
                            <SelectValue>{formatTimeForDisplay(quickDeadlineTime)}</SelectValue>
                          </SelectTrigger>
                          <SelectContent className="z-[110] max-h-[200px]">
                            {QUICK_TIME_OPTIONS.map((time) => (
                              <SelectItem key={time} value={time} className="text-xs">
                                {formatTimeForDisplay(time)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Calendar
                        mode="single"
                        selected={quickDeadline}
                        onSelect={setQuickDeadline}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <button
                    onClick={handleQuickAdd}
                    disabled={!quickTitle.trim()}
                    className="bg-violet-600 text-white p-1.5 rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2 bg-slate-50/30">
              <AnimatePresence mode="popLayout" initial={false}>
                {backlogTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    colorVariant="white"
                    onComplete={handleComplete}
                    onDragStart={onDragStart}
                    onDragEnter={onDragEnter}
                    onDragEnd={onDragEnd}
                    onClick={setSelectedTask}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Matrix Columns */}
          <motion.div
            variants={itemVariants}
            className="flex-1 grid grid-cols-2 grid-rows-2 gap-5 min-h-0"
          >
            <MatrixQuadrant
              title="Do First"
              subtitle="Urgent & Important"
              icon={AlertCircle}
              colorTheme="rose"
              tasks={q1Tasks}
              onDropInQuadrant={(e: any) =>
                handleDropInQuadrant(e, true, true, "todo")
              }
              onDragOverQuadrant={(e: any) => e.preventDefault()}
              onComplete={handleComplete}
              onTaskDragStart={onDragStart}
              onTaskDragEnter={onDragEnter}
              onTaskDragEnd={onDragEnd}
              onTaskClick={setSelectedTask}
            />
            <MatrixQuadrant
              title="Schedule"
              subtitle="Not Urgent & Important"
              icon={CalendarIcon}
              colorTheme="blue"
              tasks={q2Tasks}
              onDropInQuadrant={(e: any) =>
                handleDropInQuadrant(e, false, true, "todo")
              }
              onDragOverQuadrant={(e: any) => e.preventDefault()}
              onComplete={handleComplete}
              onTaskDragStart={onDragStart}
              onTaskDragEnter={onDragEnter}
              onTaskDragEnd={onDragEnd}
              onTaskClick={setSelectedTask}
            />
            <MatrixQuadrant
              title="Delegate"
              subtitle="Urgent & Not Imp."
              icon={Users}
              colorTheme="amber"
              tasks={q3Tasks}
              onDropInQuadrant={(e: any) =>
                handleDropInQuadrant(e, true, false, "todo")
              }
              onDragOverQuadrant={(e: any) => e.preventDefault()}
              onComplete={handleComplete}
              onTaskDragStart={onDragStart}
              onTaskDragEnter={onDragEnter}
              onTaskDragEnd={onDragEnd}
              onTaskClick={setSelectedTask}
            />
            <MatrixQuadrant
              title="Eliminate"
              subtitle="Neither"
              icon={Trash2}
              colorTheme="slate"
              tasks={q4Tasks}
              onDropInQuadrant={(e: any) =>
                handleDropInQuadrant(e, false, false, "todo")
              }
              onDragOverQuadrant={(e: any) => e.preventDefault()}
              onComplete={handleComplete}
              onTaskDragStart={onDragStart}
              onTaskDragEnter={onDragEnter}
              onTaskDragEnd={onDragEnd}
              onTaskClick={setSelectedTask}
            />
          </motion.div>
        </div>

        <CreateTaskDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onCreate={addTask}
          projects={projectList}
        />

        <AnimatePresence>
          {showCompletedModal && (
            <CompletedModal
              isOpen={showCompletedModal}
              onClose={() => setShowCompletedModal(false)}
              tasks={completedList}
              onRestore={handleRestore}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showUndo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 right-6 z-[110] bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-medium">Task completed</span>
              <button
                onClick={handleUndo}
                className="ml-2 text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
              >
                <Undo2 className="w-3 h-3" /> Undo
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {selectedTask && (
            <TaskDetailPanel
              task={selectedTask}
              onClose={() => setSelectedTask(null)}
              onUpdate={updateTask}
              onDelete={(id) => {
                deleteTask(id);
                setSelectedTask(null);
              }}
              projects={projectList}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </DashboardLayout>
  );
};

export default Tasks;
