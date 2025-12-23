import { useRef, useState, useEffect } from "react";
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
  onReorder?: (tasks: Task[]) => void;
}

export const UnscheduledSidebar = ({
  tasks,
  onDragStart,
  onDragEnd,
  onTaskClick,
  draggingTaskId,
  isExpanded,
  onToggleExpanded,
  onReorder,
}: UnscheduledSidebarProps) => {
  const isDragging = !!draggingTaskId;
  const dragImageRef = useRef<HTMLDivElement>(null);

  // State for internal reordering
  const [orderedTasks, setOrderedTasks] = useState<Task[]>(tasks);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDraggingOutside, setIsDraggingOutside] = useState(false);

  // Sync with parent tasks
  useEffect(() => {
    setOrderedTasks(tasks);
  }, [tasks]);

  // Handle drag start with custom drag image
  const handleDragStart = (e: React.DragEvent, task: Task, index: number) => {
    // Set drag data for cross-component communication
    e.dataTransfer.setData("application/json", JSON.stringify(task));
    e.dataTransfer.setData("text/plain", index.toString());
    e.dataTransfer.effectAllowed = "move";

    // Create custom drag image for better UX
    if (dragImageRef.current) {
      dragImageRef.current.textContent = task.title;
      e.dataTransfer.setDragImage(dragImageRef.current, 0, 0);
    }

    // Notify parent
    onDragStart(task);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverIndex(null);
    setIsDraggingOutside(false);
    onDragEnd();
  };

  // Internal reorder handlers
  const handleDragOverTask = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(index);
  };

  const handleDropOnTask = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    const draggedIndexStr = e.dataTransfer.getData("text/plain");
    if (!draggedIndexStr) return;

    const draggedIndex = parseInt(draggedIndexStr);
    if (draggedIndex === dropIndex) {
      setDragOverIndex(null);
      return;
    }

    // Reorder tasks
    const newTasks = [...orderedTasks];
    const [movedTask] = newTasks.splice(draggedIndex, 1);
    newTasks.splice(dropIndex, 0, movedTask);

    setOrderedTasks(newTasks);
    setDragOverIndex(null);

    // Notify parent to persist
    onReorder?.(newTasks);
  };

  const handleDragLeaveTask = () => {
    setDragOverIndex(null);
  };

  // Track when dragging outside sidebar
  const handleDragLeaveDrawer = (e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      setIsDraggingOutside(true);
    }
  };

  const handleDragEnterDrawer = () => {
    setIsDraggingOutside(false);
  };

  return (
    <>
      {/* Hidden drag image element */}
      <div
        ref={dragImageRef}
        className="fixed -left-[9999px] bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg max-w-[200px] truncate"
      />

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
            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{
                x: 0,
                opacity: isDragging && isDraggingOutside ? 0.3 : 1,
              }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onDragLeave={handleDragLeaveDrawer}
              onDragEnter={handleDragEnterDrawer}
              className={cn(
                "absolute left-0 top-0 bottom-0 w-72 bg-white border-r border-slate-200 shadow-xl z-30 flex flex-col",
                isDragging && isDraggingOutside && "pointer-events-none"
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
                  Drag to reorder or schedule
                </p>
              </div>

              {/* Task List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {orderedTasks.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <Inbox className="w-6 h-6 opacity-50" />
                    </div>
                    <p className="text-sm font-medium">All caught up!</p>
                    <p className="text-xs mt-1">No unscheduled tasks</p>
                  </div>
                ) : (
                  orderedTasks.map((task, index) => (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task, index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOverTask(e, index)}
                      onDrop={(e) => handleDropOnTask(e, index)}
                      onDragLeave={handleDragLeaveTask}
                      onClick={() => !isDragging && onTaskClick(task)}
                      className={cn(
                        "group p-3 bg-white rounded-xl border cursor-grab active:cursor-grabbing transition-all",
                        "border-slate-200 hover:border-blue-200 hover:shadow-md hover:bg-blue-50/30",
                        draggingTaskId === task._id &&
                          "opacity-50 scale-95 shadow-lg",
                        dragOverIndex === index &&
                          draggingTaskId &&
                          "border-blue-400 border-2 bg-blue-50/70 scale-105"
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
                    </div>
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
