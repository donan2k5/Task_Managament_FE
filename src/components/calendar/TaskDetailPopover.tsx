import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  X,
  Pencil,
  Trash2,
  Calendar as CalendarIcon,
  Clock,
  Flag,
  AlertCircle,
  Folder,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Task, Project } from "@/types";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface TaskDetailPopoverProps {
  task: Task;
  position: { x: number; y: number };
  onClose: () => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  projects: Project[];
}

export const TaskDetailPopover = ({
  task,
  position,
  onClose,
  onEdit,
  onDelete,
  onUpdate,
  projects,
}: TaskDetailPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // Calculate position to keep popover in viewport
  useEffect(() => {
    if (!popoverRef.current) return;

    const popover = popoverRef.current;
    const rect = popover.getBoundingClientRect();
    const padding = 16;

    let newX = position.x;
    let newY = position.y;

    // Adjust horizontal position
    if (position.x + rect.width + padding > window.innerWidth) {
      // Open to the left of click point
      newX = position.x - rect.width - 20;
    }
    if (newX < padding) {
      newX = padding;
    }

    // Adjust vertical position
    if (position.y + rect.height + padding > window.innerHeight) {
      // Open above click point
      newY = Math.max(padding, window.innerHeight - rect.height - padding);
    }
    if (newY < padding) {
      newY = padding;
    }

    setAdjustedPosition({ x: newX, y: newY });
  }, [position]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const getTaskColor = useCallback(() => {
    if (task.isUrgent && task.isImportant) return "bg-red-500";
    if (task.isImportant) return "bg-blue-500";
    if (task.isUrgent) return "bg-amber-500";
    return "bg-slate-500";
  }, [task]);

  const handleToggleComplete = () => {
    onUpdate(task._id, {
      status: task.status === "done" ? "todo" : "done",
      completed: task.status !== "done",
    });
  };

  return (
    <>
      {/* Backdrop - subtle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60]"
        onClick={onClose}
      />

      {/* Popover Card */}
      <motion.div
        ref={popoverRef}
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ type: "spring", damping: 25, stiffness: 400 }}
        className="fixed z-[70] w-[320px] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
        style={{
          left: adjustedPosition.x,
          top: adjustedPosition.y,
        }}
      >
        {/* Header with action buttons */}
        <div className="flex items-center justify-end gap-1 px-3 py-2 border-b border-slate-100 bg-slate-50/50">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
            onClick={onEdit}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => onDelete(task._id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <div className="w-px h-5 bg-slate-200 mx-1" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title with color indicator */}
          <div className="flex items-start gap-3">
            <div className={cn("w-3 h-3 rounded-sm mt-1 shrink-0", getTaskColor())} />
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-slate-800 leading-snug">
                {task.title}
              </h3>
            </div>
          </div>

          {/* Date & Time */}
          {task.scheduledDate && (
            <div className="flex items-center gap-2 mt-4 text-sm text-slate-600">
              <CalendarIcon className="w-4 h-4 text-slate-400" />
              <span>
                {format(new Date(task.scheduledDate), "EEEE, MMMM d")}
                {task.scheduledTime && (
                  <span className="mx-1.5">·</span>
                )}
                {task.scheduledTime && (
                  <span>{task.scheduledTime}</span>
                )}
              </span>
            </div>
          )}

          {/* Deadline */}
          {task.deadline && (
            <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Due: {format(new Date(task.deadline), "MMM d, yyyy")}</span>
            </div>
          )}

          {/* Project */}
          {task.project && (
            <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
              <Folder className="w-4 h-4 text-slate-400" />
              <span>{task.project}</span>
            </div>
          )}

          {/* Priority badges */}
          <div className="flex items-center gap-2 mt-4">
            {task.isUrgent && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-md">
                <AlertCircle className="w-3 h-3" />
                Urgent
              </span>
            )}
            {task.isImportant && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                <Flag className="w-3 h-3" />
                Important
              </span>
            )}
          </div>

          {/* Description preview */}
          {task.description && (
            <p className="mt-4 text-sm text-slate-500 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
          <Button
            variant={task.status === "done" ? "outline" : "default"}
            size="sm"
            className={cn(
              "w-full h-9 text-sm font-medium",
              task.status === "done"
                ? "border-slate-200 text-slate-600 hover:bg-slate-100"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            )}
            onClick={handleToggleComplete}
          >
            {task.status === "done" ? "Mark as incomplete" : "Mark as complete"}
          </Button>
        </div>
      </motion.div>
    </>
  );
};
