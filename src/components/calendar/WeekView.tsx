import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  setHours,
  setMinutes,
} from "date-fns";
import { cn } from "@/lib/utils";
import { Task, Project } from "@/types";
import { QuickAddTask } from "./QuickAddTask";
import { Plus } from "lucide-react";

const HOUR_HEIGHT = 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MODAL_WIDTH = 448;
const DRAG_THRESHOLD = 5;

interface WeekViewProps {
  currentDate: Date;
  tasks: Task[];
  projects: Project[];
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onTaskClick: (task: Task, event?: React.MouseEvent) => void;
  onCreateTask: (taskData: Partial<Task>) => void;
  externalDragTask?: Task | null;
  onExternalDrop?: (date: Date, hour: number) => void;
}

export const WeekView = ({
  currentDate,
  tasks,
  projects,
  onUpdateTask,
  onTaskClick,
  onCreateTask,
  externalDragTask,
  onExternalDrop,
}: WeekViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // Store mouse position in ref for continuous access
  const mouseRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  const [dragTask, setDragTask] = useState<Task | null>(null);
  const [pendingDragTask, setPendingDragTask] = useState<Task | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [dragPreview, setDragPreview] = useState<{
    dayIndex: number;
    hour: number;
  } | null>(null);
  const [hoverSlot, setHoverSlot] = useState<{
    dayIndex: number;
    hour: number;
  } | null>(null);
  const [quickAddSlot, setQuickAddSlot] = useState<{
    date: Date;
    time: string;
    dayIndex: number;
    hour: number;
  } | null>(null);
  const [ghostPreview, setGhostPreview] = useState<{
    dayIndex: number;
    hour: number;
  } | null>(null);
  const [modalPosition, setModalPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });

  const days = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  useEffect(() => {
    if (scrollRef.current) {
      const currentHour = new Date().getHours();
      const scrollTo = Math.max(0, (currentHour - 2) * HOUR_HEIGHT);
      scrollRef.current.scrollTop = scrollTo;
    }
  }, []);

  // ✅ UNIFIED ANIMATION LOOP - handles both scrolling AND position updates
  const updateDragState = useCallback(() => {
    if (!isDraggingRef.current || !scrollRef.current) return;

    const container = scrollRef.current;
    const gridEl = container.querySelector(
      "[data-calendar-grid]"
    ) as HTMLElement;
    if (!gridEl) return;

    const scrollRect = container.getBoundingClientRect();
    const gridRect = gridEl.getBoundingClientRect();
    const mouseY = mouseRef.current.y;
    const mouseX = mouseRef.current.x;

    // ========== AUTO SCROLL ==========
    const EDGE_ZONE = 60; // pixels from edge to start scrolling
    const MAX_SPEED = 25; // max scroll speed

    let scrollSpeed = 0;

    if (mouseY < scrollRect.top) {
      // Mouse ABOVE container - scroll up fast
      const distance = scrollRect.top - mouseY;
      scrollSpeed = -Math.min(MAX_SPEED, 8 + (distance / 30) * MAX_SPEED);
    } else if (mouseY < scrollRect.top + EDGE_ZONE) {
      // Mouse in TOP edge zone - scroll up slower
      const ratio = (scrollRect.top + EDGE_ZONE - mouseY) / EDGE_ZONE;
      scrollSpeed = -ratio * 12;
    } else if (mouseY > scrollRect.bottom) {
      // Mouse BELOW container - scroll down fast
      const distance = mouseY - scrollRect.bottom;
      scrollSpeed = Math.min(MAX_SPEED, 8 + (distance / 30) * MAX_SPEED);
    } else if (mouseY > scrollRect.bottom - EDGE_ZONE) {
      // Mouse in BOTTOM edge zone - scroll down slower
      const ratio = (mouseY - (scrollRect.bottom - EDGE_ZONE)) / EDGE_ZONE;
      scrollSpeed = ratio * 12;
    }

    if (scrollSpeed !== 0) {
      container.scrollTop += scrollSpeed;
    }

    // ========== UPDATE PREVIEW POSITION ==========
    // Clamp mouse Y to visible area
    const clampedY = Math.max(
      scrollRect.top,
      Math.min(scrollRect.bottom, mouseY)
    );

    // Calculate position relative to grid (accounting for current scroll)
    const relativeY = clampedY - gridRect.top;
    const relativeX = mouseX - gridRect.left;

    const dayWidth = gridRect.width / 7;
    const dayIndex = Math.min(6, Math.max(0, Math.floor(relativeX / dayWidth)));
    const hour = Math.min(23, Math.max(0, Math.floor(relativeY / HOUR_HEIGHT)));

    setDragPreview({ dayIndex, hour });
  }, []);

  // ✅ ANIMATION FRAME LOOP
  useEffect(() => {
    const animate = () => {
      updateDragState();
      rafRef.current = requestAnimationFrame(animate);
    };

    if (dragTask || externalDragTask) {
      isDraggingRef.current = true;
      rafRef.current = requestAnimationFrame(animate);
    } else {
      isDraggingRef.current = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [dragTask, externalDragTask, updateDragState]);

  // Track mouse for external drag
  useEffect(() => {
    if (!externalDragTask) return;

    const handleDragOver = (e: DragEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    document.addEventListener("dragover", handleDragOver);
    return () => document.removeEventListener("dragover", handleDragOver);
  }, [externalDragTask]);

  // Handle internal drag (mouse events)
  useEffect(() => {
    if (!dragTask && !pendingDragTask) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };

      // Check if we should start dragging
      if (pendingDragTask && dragStartPos && !dragTask) {
        const dx = Math.abs(e.clientX - dragStartPos.x);
        const dy = Math.abs(e.clientY - dragStartPos.y);

        if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
          setDragTask(pendingDragTask);
        }
      }
    };

    const handleMouseUp = () => {
      if (dragTask && dragPreview) {
        const targetDay = days[dragPreview.dayIndex];
        const newStartDate = setMinutes(setHours(targetDay, dragPreview.hour), 0);

        // Calculate end date - preserve duration if task has scheduledEndDate, otherwise default 1 hour
        let durationMs = 60 * 60 * 1000; // Default 1 hour
        if (dragTask.scheduledDate && dragTask.scheduledEndDate) {
          const originalStart = new Date(dragTask.scheduledDate).getTime();
          const originalEnd = new Date(dragTask.scheduledEndDate).getTime();
          durationMs = originalEnd - originalStart;
          if (durationMs <= 0) durationMs = 60 * 60 * 1000; // Fallback to 1 hour
        }
        const newEndDate = new Date(newStartDate.getTime() + durationMs);

        onUpdateTask(dragTask._id, {
          scheduledDate: newStartDate.toISOString(),
          scheduledEndDate: newEndDate.toISOString(),
        });
      }
      setDragTask(null);
      setPendingDragTask(null);
      setDragStartPos(null);
      setDragPreview(null);
    };

    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("mouseup", handleMouseUp, true);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.removeEventListener("mouseup", handleMouseUp, true);
    };
  }, [
    dragTask,
    pendingDragTask,
    dragStartPos,
    dragPreview,
    days,
    onUpdateTask,
  ]);

  const handleTaskMouseDown = useCallback(
    (e: React.MouseEvent, task: Task) => {
      e.preventDefault();

      mouseRef.current = { x: e.clientX, y: e.clientY };
      setPendingDragTask(task);
      setDragStartPos({ x: e.clientX, y: e.clientY });

      const taskDate = task.scheduledDate ? new Date(task.scheduledDate) : new Date();
      const hour = taskDate.getHours();
      const dayIndex = days.findIndex((d) => isSameDay(d, taskDate));
      setDragPreview({ dayIndex: Math.max(0, dayIndex), hour });
    },
    [days]
  );

  const handleMouseUp = useCallback(() => {
    if (!dragTask && pendingDragTask) {
      setPendingDragTask(null);
      setDragStartPos(null);
    }
  }, [dragTask, pendingDragTask]);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      const hasTaskData = e.dataTransfer.types.includes("application/json");
      if (!hasTaskData && !externalDragTask) {
        e.dataTransfer.dropEffect = "none";
        return;
      }

      e.dataTransfer.dropEffect = "move";
      mouseRef.current = { x: e.clientX, y: e.clientY };
    },
    [externalDragTask]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      let taskToSchedule = externalDragTask;

      if (!taskToSchedule) {
        try {
          const taskData = e.dataTransfer.getData("application/json");
          if (taskData) {
            taskToSchedule = JSON.parse(taskData) as Task;
          }
        } catch {
          // Invalid data
        }
      }

      if (!taskToSchedule || !dragPreview) {
        setDragPreview(null);
        return;
      }

      const targetDay = days[dragPreview.dayIndex];

      if (!externalDragTask && taskToSchedule) {
        const hour = dragPreview.hour;
        const newStartDate = setMinutes(setHours(targetDay, hour), 0);

        // Calculate end date - preserve duration if task has scheduledEndDate, otherwise default 1 hour
        let durationMs = 60 * 60 * 1000; // Default 1 hour
        if (taskToSchedule.scheduledDate && taskToSchedule.scheduledEndDate) {
          const originalStart = new Date(taskToSchedule.scheduledDate).getTime();
          const originalEnd = new Date(taskToSchedule.scheduledEndDate).getTime();
          durationMs = originalEnd - originalStart;
          if (durationMs <= 0) durationMs = 60 * 60 * 1000; // Fallback to 1 hour
        }
        const newEndDate = new Date(newStartDate.getTime() + durationMs);

        onUpdateTask(taskToSchedule._id, {
          scheduledDate: newStartDate.toISOString(),
          scheduledEndDate: newEndDate.toISOString(),
        });
      } else {
        onExternalDrop?.(targetDay, dragPreview.hour);
      }

      setDragPreview(null);
    },
    [externalDragTask, dragPreview, days, onExternalDrop, onUpdateTask]
  );

  const TIME_COLUMN_WIDTH = 56;
  const calculateModalPosition = useCallback(
    (dayIndex: number, hour: number) => {
      if (!gridRef.current || !scrollRef.current) return { top: 0, left: 0 };

      const gridRect = gridRef.current.getBoundingClientRect();
      const scrollRect = scrollRef.current.getBoundingClientRect();
      const dayWidth = gridRect.width / 7;

      const slotLeft = TIME_COLUMN_WIDTH + dayIndex * dayWidth;
      const slotTop = hour * HOUR_HEIGHT;

      const slotCenterX = slotLeft + dayWidth / 2;
      const containerCenterX = scrollRect.width / 2;

      let modalLeft: number;
      if (slotCenterX > containerCenterX) {
        modalLeft = Math.max(8, slotLeft - MODAL_WIDTH - 16);
      } else {
        modalLeft = Math.min(
          scrollRect.width - MODAL_WIDTH - 8,
          slotLeft + dayWidth + 16
        );
      }

      const modalTop = Math.max(8, slotTop);

      return { top: modalTop, left: modalLeft };
    },
    []
  );

  const handleSlotClick = useCallback(
    (e: React.MouseEvent, dayIndex: number, hour: number) => {
      if (dragTask) return;
      e.stopPropagation();

      const clickedDate = setMinutes(setHours(days[dayIndex], hour), 0);
      const position = calculateModalPosition(dayIndex, hour);

      setQuickAddSlot({
        date: clickedDate,
        time: `${hour.toString().padStart(2, "0")}:00`,
        dayIndex,
        hour,
      });
      setGhostPreview({ dayIndex, hour });
      setModalPosition(position);
    },
    [days, dragTask, calculateModalPosition]
  );

  const handlePreviewChange = useCallback(
    (newDate: Date, newTime: string) => {
      const newDayIndex = days.findIndex((d) => isSameDay(d, newDate));
      const newHour = parseInt(newTime.split(":")[0]);

      if (newDayIndex >= 0) {
        setGhostPreview({ dayIndex: newDayIndex, hour: newHour });
      } else {
        setGhostPreview(null);
      }
    },
    [days]
  );

  const handleQuickAddSave = useCallback(
    (title: string, project?: string, date?: Date, time?: string, endTime?: string) => {
      if (!quickAddSlot) return;

      const finalDate = date || quickAddSlot.date;
      const finalTime = time || quickAddSlot.time;

      // Parse start time and create start date
      const startHour = parseInt(finalTime.split(":")[0]);
      const startMinutes = parseInt(finalTime.split(":")[1] || "0");
      const startDate = setMinutes(setHours(finalDate, startHour), startMinutes);

      // Calculate end date - use provided endTime or default to +1 hour
      let endDate: Date;
      if (endTime) {
        const endHour = parseInt(endTime.split(":")[0]);
        const endMinutes = parseInt(endTime.split(":")[1] || "0");
        endDate = setMinutes(setHours(finalDate, endHour), endMinutes);
        // Handle overnight case
        if (endDate <= startDate) {
          endDate = addDays(endDate, 1);
        }
      } else {
        endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 hour
      }

      onCreateTask({
        title,
        project,
        scheduledDate: startDate.toISOString(),
        scheduledEndDate: endDate.toISOString(),
        status: "todo",
        isImportant: true,
        isUrgent: false,
      });
      setQuickAddSlot(null);
      setGhostPreview(null);
    },
    [quickAddSlot, onCreateTask]
  );

  const handleQuickAddCancel = useCallback(() => {
    setQuickAddSlot(null);
    setGhostPreview(null);
  }, []);

  const isDragging = !!dragTask || !!externalDragTask;

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full bg-white select-none"
      onMouseUp={handleMouseUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex border-b border-slate-200 bg-white sticky top-0 z-20 shrink-0">
        <div className="w-14 shrink-0" />
        {days.map((day, idx) => (
          <div
            key={day.toString()}
            className={cn(
              "flex-1 py-3 text-center border-l border-slate-100 transition-colors",
              dragPreview?.dayIndex === idx && isDragging && "bg-blue-50/70",
              ghostPreview?.dayIndex === idx && !isDragging && "bg-blue-50/40"
            )}
          >
            <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">
              {format(day, "EEE")}
            </div>
            <div
              className={cn(
                "text-lg font-bold w-9 h-9 flex items-center justify-center mx-auto rounded-full mt-1 transition-colors",
                isSameDay(day, new Date())
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-100"
              )}
            >
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden relative"
      >
        <div className="flex relative" style={{ height: 24 * HOUR_HEIGHT }}>
          <div className="w-14 shrink-0 relative">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute w-full text-right pr-2"
                style={{ top: hour * HOUR_HEIGHT - 6 }}
              >
                <span className="text-[10px] text-slate-400 font-medium">
                  {hour === 0 ? "" : `${hour.toString().padStart(2, "0")}:00`}
                </span>
              </div>
            ))}
          </div>

          <div ref={gridRef} data-calendar-grid className="flex-1 relative">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute left-0 right-0 border-t border-slate-100"
                style={{ top: hour * HOUR_HEIGHT }}
              />
            ))}

            <div className="absolute inset-0 flex">
              {days.map((day, dayIdx) => (
                <div
                  key={day.toString()}
                  className={cn(
                    "flex-1 border-l border-slate-100 relative",
                    dragPreview?.dayIndex === dayIdx &&
                      isDragging &&
                      "bg-blue-50/40"
                  )}
                >
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      onClick={(e) => handleSlotClick(e, dayIdx, hour)}
                      onMouseEnter={() =>
                        !isDragging && setHoverSlot({ dayIndex: dayIdx, hour })
                      }
                      onMouseLeave={() => setHoverSlot(null)}
                      className={cn(
                        "absolute left-0 right-0 group cursor-pointer transition-colors",
                        hoverSlot?.dayIndex === dayIdx &&
                          hoverSlot?.hour === hour &&
                          !isDragging &&
                          !quickAddSlot &&
                          "bg-slate-50"
                      )}
                      style={{
                        top: hour * HOUR_HEIGHT,
                        height: HOUR_HEIGHT,
                      }}
                    >
                      {hoverSlot?.dayIndex === dayIdx &&
                        hoverSlot?.hour === hour &&
                        !isDragging &&
                        !quickAddSlot && (
                          <div className="absolute inset-1 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="w-4 h-4 text-slate-400" />
                          </div>
                        )}
                    </div>
                  ))}

                  {tasks
                    .filter(
                      (t) =>
                        t.scheduledDate &&
                        isSameDay(new Date(t.scheduledDate), day)
                    )
                    .map((task) => {
                      const taskStartDate = new Date(task.scheduledDate!);
                      const startHour = taskStartDate.getHours();
                      const startMinutes = taskStartDate.getMinutes();
                      const isBeingDragged = dragTask?._id === task._id;

                      // Calculate duration in hours based on scheduledEndDate
                      let durationHours = 1; // Default 1 hour
                      if (task.scheduledEndDate) {
                        const taskEndDate = new Date(task.scheduledEndDate);
                        const durationMs = taskEndDate.getTime() - taskStartDate.getTime();
                        durationHours = durationMs / (60 * 60 * 1000);
                        if (durationHours <= 0) durationHours = 1; // Fallback
                      }

                      const taskHeight = Math.max(HOUR_HEIGHT * durationHours - 2, HOUR_HEIGHT * 0.5);
                      const topPosition = (startHour + startMinutes / 60) * HOUR_HEIGHT + 1;

                      // Format time strings for display
                      const startTimeStr = format(taskStartDate, "HH:mm");
                      const endTimeStr = task.scheduledEndDate ? format(new Date(task.scheduledEndDate), "HH:mm") : null;

                      return (
                        <motion.div
                          key={task._id}
                          layout={!isBeingDragged}
                          onMouseDown={(e) => handleTaskMouseDown(e, task)}
                          onClick={(e) => {
                            if (!dragTask) {
                              e.stopPropagation();
                              onTaskClick(task, e);
                            }
                          }}
                          className={cn(
                            "absolute left-1 right-1 rounded px-2 py-1.5 cursor-grab active:cursor-grabbing",
                            "border border-white/20 transition-all duration-100 overflow-hidden",
                            task.isUrgent && task.isImportant
                              ? "bg-rose-400 hover:bg-rose-500"
                              : task.isImportant
                              ? "bg-sky-400 hover:bg-sky-500"
                              : task.isUrgent
                              ? "bg-amber-400 hover:bg-amber-500"
                              : "bg-slate-400 hover:bg-slate-500",
                            isBeingDragged &&
                              "opacity-40 pointer-events-none scale-[0.98]"
                          )}
                          style={{
                            top: topPosition,
                            height: taskHeight,
                          }}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <p className="text-xs font-medium text-white truncate leading-tight">
                            {task.title}
                          </p>
                          <p className="text-[10px] text-white/80 mt-0.5 truncate">
                            {startTimeStr}{endTimeStr && ` - ${endTimeStr}`}
                            {task.project && ` · ${task.project}`}
                          </p>
                        </motion.div>
                      );
                    })}

                  {isSameDay(day, new Date()) && (
                    <div
                      className="absolute left-0 right-0 z-10 pointer-events-none"
                      style={{
                        top:
                          (new Date().getHours() +
                            new Date().getMinutes() / 60) *
                          HOUR_HEIGHT,
                      }}
                    >
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full -ml-1" />
                        <div className="flex-1 h-0.5 bg-red-500" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <AnimatePresence>
              {isDragging && dragPreview && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className={cn(
                    "absolute rounded pointer-events-none z-20",
                    externalDragTask
                      ? "bg-sky-400"
                      : dragTask?.isUrgent && dragTask?.isImportant
                      ? "bg-rose-400"
                      : dragTask?.isImportant
                      ? "bg-sky-400"
                      : dragTask?.isUrgent
                      ? "bg-amber-400"
                      : "bg-slate-400"
                  )}
                  style={{
                    top: dragPreview.hour * HOUR_HEIGHT + 1,
                    left: `calc(${(dragPreview.dayIndex / 7) * 100}% + 4px)`,
                    width: `calc(${100 / 7}% - 8px)`,
                    height: HOUR_HEIGHT - 2,
                  }}
                >
                  <div className="p-2">
                    <p className="text-xs font-medium text-white truncate">
                      {externalDragTask?.title || dragTask?.title}
                    </p>
                    <p className="text-[10px] text-white/80 mt-0.5">
                      {dragPreview.hour.toString().padStart(2, "0")}:00
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {ghostPreview && !isDragging && quickAddSlot && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                  className="absolute rounded bg-sky-400 pointer-events-none z-20"
                  style={{
                    top: ghostPreview.hour * HOUR_HEIGHT + 1,
                    left: `calc(${(ghostPreview.dayIndex / 7) * 100}% + 4px)`,
                    width: `calc(${100 / 7}% - 8px)`,
                    height: HOUR_HEIGHT - 2,
                  }}
                >
                  <div className="p-2">
                    <p className="text-xs font-medium text-white">New task</p>
                    <p className="text-[10px] text-white/70 mt-0.5">
                      {ghostPreview.hour.toString().padStart(2, "0")}:00
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {quickAddSlot && !isDragging && (
            <div
              className="absolute z-30"
              style={{
                top: modalPosition.top,
                left: modalPosition.left,
              }}
            >
              <QuickAddTask
                date={quickAddSlot.date}
                time={quickAddSlot.time}
                position={modalPosition}
                projects={projects}
                onSave={handleQuickAddSave}
                onCancel={handleQuickAddCancel}
                onPreviewChange={handlePreviewChange}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
