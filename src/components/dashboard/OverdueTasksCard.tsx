import { motion } from "framer-motion";
import { AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Task } from "@/types/index";
import { taskService } from "@/services/task.service";
import { toast } from "sonner";
import { useState } from "react";

interface OverdueTasksCardProps {
  tasks: Task[];
  onTaskUpdated?: (task: Task) => void;
}

export const OverdueTasksCard = ({ tasks: initialTasks, onTaskUpdated }: OverdueTasksCardProps) => {
  const [tasks, setTasks] = useState(initialTasks);

  const handleComplete = async (task: Task) => {
    try {
      // Optimistic update
      setTasks(prev => prev.filter(t => t._id !== task._id));
      
      await taskService.update(task._id, {
        completed: true,
        status: "done"
      });
      
      toast.success("Task completed");
      onTaskUpdated?.({ ...task, completed: true, status: "done" });
    } catch (error) {
      // Rollback
      setTasks(prev => [...prev, task]);
      toast.error("Failed to complete task");
    }
  };

  // if (tasks.length === 0) return null; // Always show for now to debug or showing empty state

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 border border-rose-100 shadow-sm flex flex-col gap-4"
    >
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-rose-500 uppercase tracking-widest">
            Overdue Tasks
          </h3>
          <span className="bg-rose-50 text-rose-600 text-xs font-bold px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <AlertCircle size={16} className="text-rose-400" />
      </div>

      {/* LIST */}
      <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
        {tasks.map((task) => (
          <div
            key={task._id}
            className="group flex items-start gap-3 p-3 rounded-xl hover:bg-rose-50/50 border border-slate-50 hover:border-rose-100 transition-all bg-white"
          >
             <button
              onClick={() => handleComplete(task)}
              className="mt-1 text-slate-300 hover:text-emerald-500 transition-colors"
              title="Complete Task"
            >
              <CheckCircle2 size={18} />
            </button>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-800 leading-tight truncate">
                {task.title}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                {task.deadline && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded whitespace-nowrap">
                    <Clock size={10} />
                    {formatDistanceToNow(new Date(task.deadline), { addSuffix: true })}
                    </div>
                )}
                {task.project && (
                    <span className="text-[10px] text-slate-400 font-medium truncate">
                    {task.project}
                    </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
