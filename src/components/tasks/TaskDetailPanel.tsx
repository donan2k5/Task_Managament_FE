import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  AlignLeft,
  Trash2,
  X,
  Flag,
  AlertCircle,
  CheckCircle2,
  Circle,
  ChevronDown,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Project, Task } from "@/types";
import { format } from "date-fns";

// Helper functions for time picker
const formatTimeDisplay = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const period = hours >= 12 ? "pm" : "am";
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHour}:${minutes.toString().padStart(2, "0")}${period}`;
};

const generateTimeOptions = () => {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    options.push(`${h.toString().padStart(2, "0")}:00`);
    options.push(`${h.toString().padStart(2, "0")}:30`);
  }
  return options;
};

const calculateDefaultEndTime = (startTime: string) => {
  const [hours] = startTime.split(":").map(Number);
  const endHour = (hours + 1) % 24;
  return `${endHour.toString().padStart(2, "0")}:00`;
};

const generateEndTimeOptions = (startTime: string) => {
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const startTotalMinutes = startHours * 60 + startMinutes;

  const durations = [
    { minutes: 15, label: "15 mins" },
    { minutes: 30, label: "30 mins" },
    { minutes: 45, label: "45 mins" },
    { minutes: 60, label: "1 hr" },
    { minutes: 90, label: "1.5 hrs" },
    { minutes: 120, label: "2 hrs" },
    { minutes: 180, label: "3 hrs" },
    { minutes: 240, label: "4 hrs" },
  ];

  return durations.map(({ minutes, label }) => {
    const endTotalMinutes = (startTotalMinutes + minutes) % (24 * 60);
    const endHours = Math.floor(endTotalMinutes / 60);
    const endMins = endTotalMinutes % 60;
    const time = `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`;
    return {
      time,
      label: `${formatTimeDisplay(time)} (${label})`,
    };
  });
};

const formatTimeWithDuration = (startTime: string, endTime: string) => {
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  const startTotal = startH * 60 + startM;
  let endTotal = endH * 60 + endM;

  if (endTotal <= startTotal) {
    endTotal += 24 * 60; // Handle overnight
  }

  const durationMins = endTotal - startTotal;
  let durationLabel = "";

  if (durationMins < 60) {
    durationLabel = `${durationMins} mins`;
  } else if (durationMins === 60) {
    durationLabel = "1 hr";
  } else if (durationMins % 60 === 0) {
    durationLabel = `${durationMins / 60} hrs`;
  } else {
    const hours = Math.floor(durationMins / 60);
    const mins = durationMins % 60;
    durationLabel = `${hours}.${Math.round(mins / 6)} hrs`;
  }

  return `${formatTimeDisplay(endTime)} (${durationLabel})`;
};

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

interface TaskDetailPanelProps {
  task: Task;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete?: (id: string) => void;
  projects: Project[];
}

const checkHasChanges = (original: Task, current: Partial<Task>) => {
  const basicFields: (keyof Task)[] = [
    "title",
    "description",
    "status",
    "project",
    "isUrgent",
    "isImportant",
  ];

  for (const field of basicFields) {
    const originalVal = original[field] ?? "";
    const currentVal = current[field] ?? "";
    if (String(originalVal) !== String(currentVal)) return true;
  }

  const getTime = (val: string | Date | undefined | null) =>
    val ? new Date(val).getTime() : 0;

  if (getTime(original.scheduledDate) !== getTime(current.scheduledDate))
    return true;
  if (getTime(original.scheduledEndDate) !== getTime(current.scheduledEndDate))
    return true;
  if (getTime(original.deadline) !== getTime(current.deadline)) return true;

  return false;
};

export const TaskDetailPanel = ({
  task,
  onClose,
  onUpdate,
  onDelete,
  projects,
}: TaskDetailPanelProps) => {
  const [formData, setFormData] = useState<Partial<Task>>({});
  const [isDirty, setIsDirty] = useState(false);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(undefined);
  const [deadlineTime, setDeadlineTime] = useState<string>("");

  // Sync data
  useEffect(() => {
    const { _id, createdAt, updatedAt, __v, ...allowedFields } = task as any;
    setFormData(allowedFields);

    if (task.scheduledDate) {
      const d = new Date(task.scheduledDate);
      if (!isNaN(d.getTime())) {
        setStartDate(d);
        setStartTime(format(d, "HH:mm"));
        // Extract end time from scheduledEndDate
        if (task.scheduledEndDate) {
          const endD = new Date(task.scheduledEndDate);
          setEndTime(format(endD, "HH:mm"));
        } else {
          setEndTime("");
        }
      }
    } else {
      setStartDate(undefined);
      setStartTime("");
      setEndTime("");
    }

    if (task.deadline) {
      const d = new Date(task.deadline);
      if (!isNaN(d.getTime())) {
        setDeadlineDate(d);
        setDeadlineTime(format(d, "HH:mm"));
      }
    } else {
      setDeadlineDate(undefined);
      setDeadlineTime("");
    }

    setIsDirty(false);
  }, [task]);

  useEffect(() => {
    if (task && formData) {
      const hasChanges = checkHasChanges(task, formData);
      setIsDirty(hasChanges);
    }
  }, [formData, task]);

  const handleChange = (
    field: keyof Task,
    value: string | number | boolean | null | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateStartDate = (date: Date | undefined, time: string, newEndTime?: string) => {
    setStartDate(date);
    setStartTime(time);

    if (!date) {
      handleChange("scheduledDate", null);
      handleChange("scheduledEndDate", null);
      setEndTime("");
      return;
    }

    const mergedStartDate = new Date(date);
    let finalTime = time;

    if (time) {
      const [hours, minutes] = time.split(":").map(Number);
      mergedStartDate.setHours(hours, minutes, 0, 0);
    } else {
      mergedStartDate.setHours(9, 0, 0, 0);
      finalTime = "09:00";
      setStartTime("09:00");
    }

    handleChange("scheduledDate", mergedStartDate.toISOString());

    // Calculate end date
    let endTimeToUse = newEndTime !== undefined ? newEndTime : endTime;

    // If no end time and first time setting, auto-set end time to +1 hour
    if (!endTimeToUse && finalTime) {
      const [hours] = finalTime.split(":").map(Number);
      endTimeToUse = `${((hours + 1) % 24).toString().padStart(2, "0")}:00`;
    }

    if (endTimeToUse) {
      setEndTime(endTimeToUse);
      const [endHours, endMinutes] = endTimeToUse.split(":").map(Number);
      const mergedEndDate = new Date(date);
      mergedEndDate.setHours(endHours, endMinutes, 0, 0);
      // Handle overnight case
      if (mergedEndDate <= mergedStartDate) {
        mergedEndDate.setDate(mergedEndDate.getDate() + 1);
      }
      handleChange("scheduledEndDate", mergedEndDate.toISOString());
    }
  };

  const updateEndTime = (newEndTime: string) => {
    setEndTime(newEndTime);

    if (!startDate || !newEndTime) {
      handleChange("scheduledEndDate", null);
      return;
    }

    const [endHours, endMinutes] = newEndTime.split(":").map(Number);
    const mergedEndDate = new Date(startDate);
    mergedEndDate.setHours(endHours, endMinutes, 0, 0);

    // Handle overnight case
    const startDateTime = new Date(startDate);
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    startDateTime.setHours(startHours, startMinutes, 0, 0);

    if (mergedEndDate <= startDateTime) {
      mergedEndDate.setDate(mergedEndDate.getDate() + 1);
    }

    handleChange("scheduledEndDate", mergedEndDate.toISOString());
  };

  const updateDeadline = (date: Date | undefined, time: string) => {
    setDeadlineDate(date);
    setDeadlineTime(time);

    if (!date) {
      handleChange("deadline", null);
      return;
    }

    const mergedDate = new Date(date);
    if (time) {
      const [hours, minutes] = time.split(":").map(Number);
      mergedDate.setHours(hours, minutes);
    } else {
      mergedDate.setHours(23, 59);
    }
    handleChange("deadline", mergedDate.toISOString());
  };

  const handleSave = () => {
    if (!formData) return;
    onUpdate(task._id, formData);
    setIsDirty(false);
    onClose();
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(task._id);
      onClose();
    }
  };

  const handleCloseAttempt = () => {
    if (isDirty) setShowUnsavedDialog(true);
    else onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") handleCloseAttempt();
  };

  const getProjectColor = (projectName?: string) => {
    if (!projectName) return "bg-slate-100 text-slate-600 border-slate-200";
    const project = projects.find((p) => p.name === projectName);
    if (project?.color) return project.color;
    return "bg-slate-100 text-slate-600 border-slate-200";
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleCloseAttempt}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[50]"
      />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 350 }}
        className="fixed top-0 right-0 h-full w-full md:w-[500px] bg-white shadow-2xl z-[70] flex flex-col border-l border-slate-200"
        onKeyDown={handleKeyDown}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10 min-h-[60px]">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Edit Task
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCloseAttempt}
            className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="px-6 py-6 space-y-8">
            <div className="group relative">
              <Textarea
                autoFocus
                value={formData.title || ""}
                onChange={(e) => handleChange("title", e.target.value)}
                className="w-full text-2xl font-bold text-slate-900 placeholder:text-slate-300 border-none shadow-none focus-visible:ring-0 resize-none p-0 bg-transparent leading-tight min-h-[40px] overflow-hidden"
                placeholder="Task title"
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />
            </div>

            <div className="grid grid-cols-[120px_1fr] gap-y-6 items-center">
              {/* STATUS */}
              <div className="text-sm font-medium text-slate-500">Status</div>
              <div>
                <Select
                  value={formData.status || "backlog"}
                  onValueChange={(val) => handleChange("status", val)}
                >
                  <SelectTrigger className="w-fit h-8 border-none shadow-none focus:ring-0 px-3 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors gap-2">
                    {formData.status === "done" ? (
                      <div className="flex items-center gap-2 text-emerald-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">
                          Done
                        </span>
                      </div>
                    ) : formData.status === "todo" ? (
                      <div className="flex items-center gap-2 text-blue-700">
                        <Circle className="w-4 h-4 stroke-[3px]" />
                        <span className="text-xs font-bold uppercase">
                          In Progress
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Circle className="w-4 h-4 border-dashed" />
                        <span className="text-xs font-bold uppercase">
                          Backlog
                        </span>
                      </div>
                    )}
                  </SelectTrigger>
                  <SelectContent align="start" className="z-[80]">
                    <SelectItem value="backlog">Backlog</SelectItem>
                    <SelectItem value="todo">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* SCHEDULED TIME (Calendar Event) */}
              <div className="text-sm font-medium text-slate-500">
                Schedule
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-8 px-3 text-xs font-medium justify-start border-slate-200 hover:bg-slate-50 rounded-md",
                        !startDate
                          ? "text-slate-400"
                          : "text-slate-700 bg-white"
                      )}
                    >
                      <CalendarIcon className="w-3.5 h-3.5 mr-2 opacity-70" />
                      {startDate
                        ? format(startDate, "EEEE, MMM d")
                        : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[80]" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(d) => updateStartDate(d, startTime)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {startDate && (
                  <>
                    {/* Start Time Picker */}
                    <Select
                      value={startTime || "09:00"}
                      onValueChange={(val) => updateStartDate(startDate, val)}
                    >
                      <SelectTrigger className="h-8 w-[85px] text-xs font-medium border-slate-200 bg-white">
                        {formatTimeDisplay(startTime || "09:00")}
                      </SelectTrigger>
                      <SelectContent className="z-[90] max-h-[200px]">
                        {generateTimeOptions().map((time) => (
                          <SelectItem key={time} value={time} className="text-xs">
                            {formatTimeDisplay(time)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-slate-300 text-xs">-</span>
                    {/* End Time Picker with Duration */}
                    <Select
                      value={endTime || calculateDefaultEndTime(startTime || "09:00")}
                      onValueChange={(val) => updateEndTime(val)}
                    >
                      <SelectTrigger className="h-8 w-auto min-w-[140px] text-xs font-medium border-slate-200 bg-white">
                        {formatTimeWithDuration(startTime || "09:00", endTime || calculateDefaultEndTime(startTime || "09:00"))}
                      </SelectTrigger>
                      <SelectContent className="z-[90] max-h-[240px]">
                        {generateEndTimeOptions(startTime || "09:00").map((option) => (
                          <SelectItem key={option.time} value={option.time} className="text-xs">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>

              {/* DEADLINE */}
              <div className="text-sm font-medium text-slate-500">Deadline</div>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-8 px-3 text-xs font-medium justify-start border-slate-200 hover:bg-slate-50 rounded-md",
                        !deadlineDate
                          ? "text-slate-400"
                          : "text-slate-700 bg-white"
                      )}
                    >
                      <Flag className="w-3.5 h-3.5 mr-2 opacity-70" />
                      {deadlineDate
                        ? format(deadlineDate, "MMM d, yyyy")
                        : "No deadline"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[80]" align="start">
                    <Calendar
                      mode="single"
                      selected={deadlineDate}
                      onSelect={(d) => updateDeadline(d, deadlineTime || "23:59")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {deadlineDate && (
                  <Select
                    value={deadlineTime || "23:59"}
                    onValueChange={(val) => updateDeadline(deadlineDate, val)}
                  >
                    <SelectTrigger className="h-8 w-[85px] text-xs font-medium border-slate-200 bg-white">
                      {formatTimeDisplay(deadlineTime || "23:59")}
                    </SelectTrigger>
                    <SelectContent className="z-[90] max-h-[200px]">
                      {generateTimeOptions().map((time) => (
                        <SelectItem key={time} value={time} className="text-xs">
                          {formatTimeDisplay(time)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* PROJECT */}
              <div className="text-sm font-medium text-slate-500">Project</div>
              <div className="flex">
                <Select
                  value={formData.project || "no_project"}
                  onValueChange={(val) =>
                    handleChange("project", val === "no_project" ? null : val)
                  }
                >
                  <SelectTrigger className="w-fit h-8 border-none shadow-none focus:ring-0 p-0 hover:opacity-80 gap-1">
                    {formData.project ? (
                      <Badge
                        variant="secondary"
                        className={cn(
                          "rounded-md px-2.5 py-1 font-semibold border text-[11px]",
                          getProjectColor(formData.project)
                        )}
                      >
                        {formData.project}
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer flex items-center gap-1 border border-dashed border-slate-300 px-2 py-1 rounded hover:bg-slate-50 transition-all">
                        + Add to project
                      </span>
                    )}
                  </SelectTrigger>
                  <SelectContent className="z-[90]">
                    <SelectItem value="no_project">No Project</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p._id || p.name} value={p.name}>
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full",
                              p.color
                                ? p.color
                                    .replace("text-", "bg-")
                                    .split(" ")[0]
                                    .replace("100", "400")
                                : "bg-slate-400"
                            )}
                          ></div>
                          {p.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* PRIORITY */}
              <div className="text-sm font-medium text-slate-500">Priority</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleChange("isUrgent", !formData.isUrgent)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[11px] font-bold transition-all",
                    formData.isUrgent
                      ? "bg-rose-50 text-rose-600 border-rose-200 shadow-sm"
                      : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <AlertCircle className="w-3.5 h-3.5" /> Urgent
                </button>
                <button
                  onClick={() =>
                    handleChange("isImportant", !formData.isImportant)
                  }
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[11px] font-bold transition-all",
                    formData.isImportant
                      ? "bg-amber-50 text-amber-600 border-amber-200 shadow-sm"
                      : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <Flag className="w-3.5 h-3.5" /> Important
                </button>
              </div>
            </div>

            <div className="h-px w-full bg-slate-100" />

            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <AlignLeft className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-bold text-slate-700">
                  Description
                </h3>
              </div>
              <Textarea
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                className="min-h-[120px] w-full text-sm text-slate-700 leading-relaxed border border-slate-100 focus-visible:ring-1 focus:ring-slate-200 focus:border-slate-300 bg-slate-50/50 p-4 rounded-xl resize-y placeholder:text-slate-400"
                placeholder="Add more details about this task..."
              />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-between items-center z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 h-9 text-xs font-semibold"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Delete Task
          </Button>

          <div className="flex items-center gap-4">
            <span
              className={cn(
                "text-[11px] font-semibold transition-colors uppercase tracking-wide",
                isDirty ? "text-amber-500" : "text-emerald-500 opacity-0"
              )}
            >
              {isDirty ? "Unsaved changes" : "Saved"}
            </span>
            <Button
              onClick={handleSave}
              disabled={!isDirty}
              className={cn(
                "h-9 text-xs font-bold px-6 transition-all duration-200 shadow-sm",
                isDirty
                  ? "bg-slate-900 hover:bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </motion.div>

      {/* DIALOGS */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent className="z-[100]">
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Discard them?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowUnsavedDialog(false);
                onClose();
              }}
              className="bg-slate-900 text-white"
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="z-[100]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently remove this task?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
