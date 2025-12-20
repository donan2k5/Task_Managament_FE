import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Task } from "@/types";

interface TaskSectionProps {
  title: string;
  status: string;
  tasks: Task[];
  defaultOpen?: boolean;
}

export const TaskSection = ({
  title,
  status,
  tasks: allTasks,
  defaultOpen = true,
}: TaskSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const filteredTasks = allTasks.filter((t) => t.status === status);

  const statusColors = {
    "in-progress": "bg-purple-100 text-purple-700",
    todo: "bg-blue-100 text-blue-700",
    upcoming: "bg-cyan-100 text-cyan-700",
  };

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full text-left py-2"
      >
        <ChevronDown
          className={cn(
            "w-4 h-4 text-slate-500 transition-transform",
            !isOpen && "-rotate-90"
          )}
        />
        <span
          className={cn(
            "px-2 py-1 rounded-md text-xs font-medium",
            statusColors[status]
          )}
        >
          {title}
        </span>
        <span className="text-sm text-slate-500">
          • {filteredTasks.length} tasks
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-b border-slate-200 py-2 px-4 grid grid-cols-[1fr,80px,80px] text-xs text-slate-500">
              <span>Name</span>
              <span>Priority</span>
              <span>Due date</span>
            </div>
            {filteredTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="grid grid-cols-[1fr,80px,80px] items-center py-3 px-4 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                  <div
                    className={cn(
                      "w-2.5 h-2.5 rounded-sm",
                      task.priority === "high"
                        ? "bg-cyan-500"
                        : task.priority === "medium"
                        ? "bg-blue-500"
                        : "bg-slate-300"
                    )}
                  />
                  <span className="text-sm text-slate-900">{task.name}</span>
                </div>
                <span
                  className={cn(
                    "text-xs px-2 py-1 rounded",
                    task.priority === "high"
                      ? "bg-red-100 text-red-700"
                      : task.priority === "medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-slate-100 text-slate-700"
                  )}
                >
                  {task.priority.charAt(0).toUpperCase() +
                    task.priority.slice(1)}
                </span>
                <span
                  className={cn(
                    "text-sm",
                    task.dueDate === "Today"
                      ? "text-purple-600 font-medium"
                      : "text-slate-500"
                  )}
                >
                  {task.dueDate}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
