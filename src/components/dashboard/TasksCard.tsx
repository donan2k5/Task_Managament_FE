import { useState, useMemo, forwardRef, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreHorizontal, Clock, CheckCircle2, Circle, Loader2, Sparkles } from "lucide-react";
import { format, isSameDay, startOfDay } from "date-fns";
import { Task } from "@/types/index";
import { taskService } from "@/services/task.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TasksCardProps {
  tasks: Task[];
  onTaskUpdated?: (task: Task) => void;
}

export const TasksCard = ({ tasks: initialTasks, onTaskUpdated }: TasksCardProps) => {
  const [localTasks, setLocalTasks] = useState<Task[]>(initialTasks);
  const [loadingTaskIds, setLoadingTaskIds] = useState<Set<string>>(new Set());
  const modifiedTaskIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    setLocalTasks((prevLocal) => {
      if (modifiedTaskIds.current.size === 0) {
        return initialTasks;
      }
      const newTaskMap = new Map(initialTasks.map(t => [t._id, t]));
      const localModifiedMap = new Map(
        prevLocal.filter(t => modifiedTaskIds.current.has(t._id)).map(t => [t._id, t])
      );
      const merged = initialTasks.map(t =>
        localModifiedMap.has(t._id) ? localModifiedMap.get(t._id)! : t
      );
      prevLocal.forEach(t => {
        if (modifiedTaskIds.current.has(t._id) && !newTaskMap.has(t._id)) {
          merged.push(t);
        }
      });
      return merged;
    });
  }, [initialTasks]);

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
    modifiedTaskIds.current.add(taskId);
    setLoadingTaskIds((prev) => new Set(prev).add(taskId));
    const newCompleted = !task.completed;
    const newStatus = newCompleted ? "done" : "todo";
    const now = new Date().toISOString();
    setLocalTasks((prev) =>
      prev.map((t) =>
        t._id === taskId
          ? { ...t, completed: newCompleted, status: newStatus, updatedAt: now }
          : t
      )
    );
    try {
      const updatedTask = await taskService.update(taskId, {
        completed: newCompleted,
        status: newStatus,
      });
      setLocalTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, ...updatedTask } : t))
      );
      onTaskUpdated?.(updatedTask);
      toast.success(newCompleted ? "Task completed!" : "Task restored");
      setTimeout(() => {
        modifiedTaskIds.current.delete(taskId);
      }, 2000);
    } catch (error) {
      setLocalTasks((prev) =>
        prev.map((t) =>
          t._id === taskId ? { ...t, completed: task.completed, status: task.status } : t
        )
      );
      modifiedTaskIds.current.delete(taskId);
      toast.error("Failed to update task");
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
      className="bg-white rounded-[24px] p-6 border border-slate-100/60 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.05)] flex flex-col gap-5 h-full max-h-[600px]"
    >
      <div className="flex items-center justify-between sticky top-0 bg-white z-10">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Sparkles size={16} />
            </div>
            <div>
                 <h3 className="text-sm font-bold text-slate-800">Today's Focus</h3>
                 <p className="text-[11px] text-slate-400 font-medium">
                    {todoTasks.length} tasks remaining
                 </p>
            </div>
        </div>
        <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-300 hover:text-slate-600 transition-colors">
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar flex-1 -mx-2 px-2">
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

      {todayAccomplished.length > 0 && (
        <div className="border-t border-slate-100 pt-4">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
            Completed Today
          </h4>
          <div className="flex flex-col gap-1">
            {todayAccomplished.map((task) => (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={task._id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-emerald-50/30 group transition-colors"
              >
                <div className="p-0.5 rounded-full bg-emerald-100/50">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                </div>
                <span className="text-sm text-slate-500 line-through decoration-slate-300 truncate group-hover:text-slate-600 transition-colors">
                  {task.title}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

const TaskItem = forwardRef<HTMLDivElement, { task: Task; onToggle: () => void; isLoading?: boolean }>(
  ({ task, onToggle, isLoading }, ref) => {
    const isCritical = task.isUrgent && task.isImportant;
    const hasTime = task.scheduledDate && !isSameDay(new Date(task.scheduledDate), startOfDay(new Date(task.scheduledDate))); 
    // Logic: if scheduledDate is basically 00:00:00, we consider it "all day" so no time showed. 
    // Wait, ISO string from startOfDay might be local 00:00 converted to UTC. 
    // We should check if the formatted time satisfies a specific condition or just rely on the new add logic.
    // For safety, let's format it. If it's "00:00", don't show.
    const timeStr = task.scheduledDate ? format(new Date(task.scheduledDate), "HH:mm") : "";
    const showTime = timeStr && timeStr !== "00:00";

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="group flex items-center gap-3 p-3.5 rounded-[16px] hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer bg-white/50 hover:shadow-sm"
      >
        <button
          onClick={onToggle}
          disabled={isLoading}
          className="shrink-0 text-slate-300 hover:text-indigo-600 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 size={22} className="animate-spin text-indigo-500" />
          ) : (
            <Circle size={22} strokeWidth={1.5} />
          )}
        </button>

        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <h4 className={cn(
                "text-[15px] font-medium leading-tight truncate transition-colors",
                isCritical ? "text-slate-900" : "text-slate-700 group-hover:text-slate-900"
            )}>
              {task.title}
            </h4>
            <div className="flex items-center gap-2">
                {isCritical && (
                     <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-md">Priority</span>
                )}
                {task.project && (
                    <span className="text-[11px] text-slate-400 font-medium truncate">
                        #{task.project}
                    </span>
                )}
            </div>
        </div>

        {showTime && (
            <div className="shrink-0 text-[11px] font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-slate-100">
                {timeStr}
            </div>
        )}
      </motion.div>
    );
  }
);

TaskItem.displayName = "TaskItem";

const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex flex-col items-center justify-center py-12 px-4"
  >
    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
        <Sparkles className="w-8 h-8 text-slate-300" />
    </div>
    <p className="text-sm font-semibold text-slate-600">
      All caught up!
    </p>
    <p className="text-xs text-slate-400 text-center max-w-[150px] mt-1">
        Enjoy your free time or plan for tomorrow.
    </p>
  </motion.div>
);
