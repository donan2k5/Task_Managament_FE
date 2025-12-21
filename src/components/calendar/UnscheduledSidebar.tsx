import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Inbox, GripVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Task } from "@/types";

interface UnscheduledSidebarProps {
  tasks: Task[];
  onDragStart: (task: Task) => void;
  onDragEnd: () => void;
  onTaskClick: (task: Task) => void;
  draggingTaskId?: string;
  isExpanded: boolean;
  onToggleExpanded: (expanded: boolean) => void;
}

export const UnscheduledSidebar = ({
  tasks,
  onDragStart,
  onDragEnd,
  onTaskClick,
  draggingTaskId,
  isExpanded,
  onToggleExpanded,
}: UnscheduledSidebarProps) => {
  const isDragging = !!draggingTaskId;

  return (
    <>
      {/* Collapsed State - Minimal Tab */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={() => onToggleExpanded(true)}
            className="absolute left-0 top-20 z-30 flex items-center gap-2 bg-white border border-l-0 border-slate-200 rounded-r-xl px-3 py-3 shadow-md hover:shadow-lg hover:bg-slate-50 transition-all group"
          >
            <Inbox className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
            {tasks.length > 0 && (
              <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full min-w-[20px] text-center">
                {tasks.length}
              </span>
            )}
            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded Drawer */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => onToggleExpanded(false)}
              className="absolute inset-0 bg-black/5 z-20"
            />

            {/* Drawer - Fades when dragging to calendar */}
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{
                x: 0,
                opacity: isDragging ? 0.4 : 1,
                filter: isDragging ? "blur(2px)" : "blur(0px)",
              }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={cn(
                "absolute left-0 top-0 bottom-0 w-72 bg-white border-r border-slate-200 shadow-xl z-30 flex flex-col",
                isDragging && "pointer-events-none"
              )}
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Inbox className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-slate-800">
                        Inbox
                      </h3>
                      <p className="text-[10px] text-slate-500">
                        {tasks.length} unscheduled
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onToggleExpanded(false)}
                    className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1.5">
                  <GripVertical className="w-3 h-3" />
                  Drag tasks to calendar to schedule
                </p>
              </div>

              {/* Task List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {tasks.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <Inbox className="w-6 h-6 opacity-50" />
                    </div>
                    <p className="text-sm font-medium">All caught up!</p>
                    <p className="text-xs mt-1">No unscheduled tasks</p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <motion.div
                      key={task._id}
                      layoutId={`sidebar-${task._id}`}
                      draggable
                      onDragStart={() => onDragStart(task)}
                      onDragEnd={onDragEnd}
                      onClick={() => onTaskClick(task)}
                      className={cn(
                        "group p-3 bg-white rounded-xl border cursor-grab active:cursor-grabbing transition-all",
                        // Professional color scheme for task cards
                        "border-slate-200 hover:border-blue-200 hover:shadow-md hover:bg-blue-50/30",
                        draggingTaskId === task._id && "opacity-50 scale-[0.98]"
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <GripVertical className="w-4 h-4 text-slate-300 mt-0.5 shrink-0 group-hover:text-blue-400 transition-colors" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate leading-snug">
                            {task.title}
                          </p>
                          {task.project && (
                            <p className="text-[11px] text-slate-400 mt-1 truncate">
                              {task.project}
                            </p>
                          )}
                        </div>
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full mt-1.5 shrink-0",
                            // Softer priority colors
                            task.isUrgent && task.isImportant
                              ? "bg-rose-400"
                              : task.isImportant
                              ? "bg-sky-400"
                              : task.isUrgent
                              ? "bg-amber-400"
                              : "bg-slate-300"
                          )}
                        />
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
