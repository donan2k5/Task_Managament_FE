import { useState, useMemo, forwardRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreHorizontal, Clock, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Task } from "@/types/index";
import { taskService } from "@/services/task.service";
import { toast } from "sonner";

interface TasksCardProps {
  tasks: Task[];
  onTaskUpdated?: (task: Task) => void;
}

export const TasksCard = ({ tasks: initialTasks, onTaskUpdated }: TasksCardProps) => {
  const [localTasks, setLocalTasks] = useState<Task[]>(initialTasks);
  const [loadingTaskIds, setLoadingTaskIds] = useState<Set<string>>(new Set());

  // Logic lọc và phân loại task
  const { todoTasks, todayAccomplished } = useMemo(() => {
    const todayStr = new Date().toDateString();

    const todo = localTasks.filter((t) => {
      if (t.completed) return false;
      const isToday = t.scheduledDate
        ? new Date(t.scheduledDate).toDateString() === todayStr
        : false;
      const isCritical = t.isUrgent && t.isImportant;
      return isCritical || isToday;
    });

    // Today's accomplishments: completed tasks that were either:
    // 1. Scheduled for today, or
    // 2. Updated today (likely completed today)
    const accomplished = localTasks.filter((t) => {
      if (!t.completed) return false;
      const scheduledToday = t.scheduledDate
        ? new Date(t.scheduledDate).toDateString() === todayStr
        : false;
      const updatedToday = t.updatedAt
        ? new Date(t.updatedAt).toDateString() === todayStr
        : false;
      return scheduledToday || updatedToday;
    });

    return { todoTasks: todo, todayAccomplished: accomplished };
  }, [localTasks]);

  const toggleTask = useCallback(async (taskId: string) => {
    const task = localTasks.find((t) => t._id === taskId);
    if (!task) return;

    // Add to loading state
    setLoadingTaskIds((prev) => new Set(prev).add(taskId));

    // Optimistic update
    const newCompleted = !task.completed;
    const newStatus = newCompleted ? "done" : "todo";

    setLocalTasks((prev) =>
      prev.map((t) =>
        t._id === taskId ? { ...t, completed: newCompleted, status: newStatus } : t
      )
    );

    try {
      const updatedTask = await taskService.update(taskId, {
        completed: newCompleted,
        status: newStatus,
      });

      // Update local state with API response
      setLocalTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, ...updatedTask } : t))
      );

      // Notify parent if callback provided
      onTaskUpdated?.(updatedTask);

      toast.success(newCompleted ? "Task completed!" : "Task restored");
    } catch (error) {
      // Rollback on error
      setLocalTasks((prev) =>
        prev.map((t) =>
          t._id === taskId ? { ...t, completed: task.completed, status: task.status } : t
        )
      );
      toast.error("Failed to update task");
      console.error("Error updating task:", error);
    } finally {
      setLoadingTaskIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  }, [localTasks, onTaskUpdated]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4 max-h-[600px]" // Thêm max-h để kiểm soát chiều cao
    >
      {/* HEADER */}
      <div className="flex items-center justify-between sticky top-0 bg-white pb-2 z-10">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Today's Focus
          </h3>
          <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-2 py-0.5 rounded-full">
            {todoTasks.length}
          </span>
        </div>
        <button className="text-slate-300 hover:text-slate-600">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* TODO LIST: Thêm overflow-y-auto để cuộn nếu quá nhiều task */}
      <div className="flex flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar">
        <AnimatePresence mode="popLayout" initial={false}>
          {todoTasks.length > 0 ? (
            todoTasks.map((task) => (
              <TaskItem
                key={task._id}
                task={task}
                onToggle={() => toggleTask(task._id)}
                isLoading={loadingTaskIds.has(task._id)}
              />
            ))
          ) : (
            <EmptyState />
          )}
        </AnimatePresence>
      </div>

      {/* TODAY'S ACCOMPLISHMENTS */}
      {todayAccomplished.length > 0 && (
        <div className="border-t border-slate-100 pt-4 mt-2">
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Accomplished Today
            </h4>
            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {todayAccomplished.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {todayAccomplished.map((task) => (
              <div
                key={task._id}
                className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-emerald-50/50"
              >
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span className="text-sm text-slate-600 truncate">
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

// --- Sub-components ---

const TaskItem = forwardRef<HTMLDivElement, { task: Task; onToggle: () => void; isLoading?: boolean }>(
  ({ task, onToggle, isLoading }, ref) => {
    const isCritical = task.isUrgent && task.isImportant;

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="group flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 border border-slate-50 hover:border-slate-200 transition-all cursor-pointer bg-white shadow-sm"
      >
        <button
          onClick={onToggle}
          disabled={isLoading}
          className="mt-1 text-slate-300 hover:text-indigo-600 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 size={20} className="animate-spin text-indigo-500" />
          ) : (
            <Circle size={20} strokeWidth={2} />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h4 className="text-[15px] font-semibold text-slate-800 leading-tight truncate group-hover:text-indigo-700">
              {task.title}
            </h4>
            {task.scheduledDate && (
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 whitespace-nowrap bg-slate-50 px-1.5 py-0.5 rounded">
                <Clock size={10} /> {format(new Date(task.scheduledDate), "HH:mm")}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1.5">
            <span
              className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                isCritical
                  ? "bg-rose-50 text-rose-600"
                  : "bg-indigo-50 text-indigo-600"
              }`}
            >
              {isCritical ? "Priority" : "Today"}
            </span>
            <span className="text-slate-300 text-xs px-1">/</span>
            <span className="text-[11px] text-slate-400 font-medium truncate">
              {task.project}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }
);

TaskItem.displayName = "TaskItem";

const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="text-center py-10"
  >
    <div className="text-3xl mb-2">☕</div>
    <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">
      All caught up!
    </p>
  </motion.div>
);
