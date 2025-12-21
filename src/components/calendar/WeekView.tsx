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
const DRAG_THRESHOLD = 5; // pixels before drag starts
const EDGE_SCROLL_THRESHOLD = 60; // pixels from edge to trigger scroll
const EDGE_SCROLL_SPEED = 8; // pixels per frame

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
  const autoScrollRef = useRef<number | null>(null);
  const mouseYRef = useRef<number>(0);

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
  // Ghost preview for new task (tracks date/time changes in modal)
  const [ghostPreview, setGhostPreview] = useState<{
    dayIndex: number;
    hour: number;
  } | null>(null);
  // Modal position state
  const [modalPosition, setModalPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });

  const days = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  // Auto-scroll to current hour on mount
  useEffect(() => {
    if (scrollRef.current) {
      const currentHour = new Date().getHours();
      const scrollTo = Math.max(0, (currentHour - 2) * HOUR_HEIGHT);
      scrollRef.current.scrollTop = scrollTo;
    }
  }, []);

  // Auto-scroll during drag using requestAnimationFrame for smooth scrolling
  const startAutoScroll = useCallback(() => {
    const scroll = () => {
      if (!scrollRef.current) return;

      const container = scrollRef.current;
      const { top, bottom } = container.getBoundingClientRect();
      const mouseY = mouseYRef.current;

      // Calculate scroll direction and speed based on distance from edge
      if (mouseY < top + EDGE_SCROLL_THRESHOLD && mouseY > top - 100) {
        // Scroll up - speed increases closer to edge
        const distance = top + EDGE_SCROLL_THRESHOLD - mouseY;
        const speed = Math.min(
          EDGE_SCROLL_SPEED,
          (distance / EDGE_SCROLL_THRESHOLD) * EDGE_SCROLL_SPEED
        );
        container.scrollTop -= speed;
      } else if (
        mouseY > bottom - EDGE_SCROLL_THRESHOLD &&
        mouseY < bottom + 100
      ) {
        // Scroll down - speed increases closer to edge
        const distance = mouseY - (bottom - EDGE_SCROLL_THRESHOLD);
        const speed = Math.min(
          EDGE_SCROLL_SPEED,
          (distance / EDGE_SCROLL_THRESHOLD) * EDGE_SCROLL_SPEED
        );
        container.scrollTop += speed;
      }

      autoScrollRef.current = requestAnimationFrame(scroll);
    };

    autoScrollRef.current = requestAnimationFrame(scroll);
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRef.current) {
      cancelAnimationFrame(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  }, []);

  // Start/stop auto-scroll based on drag state
  useEffect(() => {
    const isDragging = !!dragTask || !!externalDragTask;
    if (isDragging) {
      startAutoScroll();
    } else {
      stopAutoScroll();
    }
    return () => stopAutoScroll();
  }, [dragTask, externalDragTask, startAutoScroll, stopAutoScroll]);

  // Get position info from mouse event
  // FIX: getBoundingClientRect already accounts for scroll position
  // The grid element moves up in viewport when scrolled, so rect.top decreases
  // No need to add scrollTop - that was causing the drift bug
  const getSlotFromEvent = useCallback(
    (e: React.MouseEvent | React.DragEvent, target?: HTMLElement) => {
      const el = target || (e.currentTarget as HTMLElement);
      const rect = el.getBoundingClientRect();

      // Calculate position relative to grid element
      // clientX/Y are viewport coords, rect.left/top are viewport coords of element
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Calculate day and hour from grid coordinates
      const dayWidth = rect.width / 7;
      const dayIndex = Math.min(6, Math.max(0, Math.floor(x / dayWidth)));
      const hour = Math.min(23, Math.max(0, Math.floor(y / HOUR_HEIGHT)));

      return { dayIndex, hour };
    },
    []
  );

  // Internal drag handlers - use pending state to differentiate click vs drag
  const handleTaskMouseDown = useCallback(
    (e: React.MouseEvent, task: Task) => {
      e.preventDefault();
      // Don't stop propagation yet - let click bubble if it's just a click

      // Store the task and start position for potential drag
      setPendingDragTask(task);
      setDragStartPos({ x: e.clientX, y: e.clientY });

      const hour = parseInt(task.scheduledTime || "0");
      const dayIndex = days.findIndex((d) =>
        isSameDay(d, new Date(task.scheduledDate!))
      );
      setDragPreview({ dayIndex: Math.max(0, dayIndex), hour });
    },
    [days]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      // Track mouse Y for auto-scroll
      mouseYRef.current = e.clientY;

      // Check if we should upgrade pending drag to actual drag
      if (pendingDragTask && dragStartPos && !dragTask) {
        const dx = Math.abs(e.clientX - dragStartPos.x);
        const dy = Math.abs(e.clientY - dragStartPos.y);

        // Only start drag if mouse moved beyond threshold
        if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
          setDragTask(pendingDragTask);
        }
      }

      if (!dragTask || !scrollRef.current) return;

      const gridEl = scrollRef.current.querySelector(
        "[data-calendar-grid]"
      ) as HTMLElement;
      if (!gridEl) return;

      const { dayIndex, hour } = getSlotFromEvent(e, gridEl);
      setDragPreview({ dayIndex, hour });
      // Auto-scroll is now handled by requestAnimationFrame loop
    },
    [dragTask, pendingDragTask, dragStartPos, getSlotFromEvent]
  );

  const handleMouseUp = useCallback(() => {
    if (dragTask && dragPreview) {
      const targetDay = days[dragPreview.dayIndex];
      const newDate = setMinutes(setHours(targetDay, dragPreview.hour), 0);

      onUpdateTask(dragTask._id, {
        scheduledDate: newDate.toISOString(),
        scheduledTime: `${dragPreview.hour.toString().padStart(2, "0")}:00`,
      });
    }
    // Clear all drag states
    setDragTask(null);
    setPendingDragTask(null);
    setDragStartPos(null);
    setDragPreview(null);
  }, [dragTask, dragPreview, days, onUpdateTask]);

  // External drag handlers (from sidebar)
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!externalDragTask) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      // Track mouse Y for auto-scroll
      mouseYRef.current = e.clientY;

      const gridEl = scrollRef.current?.querySelector(
        "[data-calendar-grid]"
      ) as HTMLElement;
      if (!gridEl) return;

      const { dayIndex, hour } = getSlotFromEvent(e, gridEl);
      setDragPreview({ dayIndex, hour });
    },
    [externalDragTask, getSlotFromEvent]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      if (!externalDragTask || !dragPreview) return;
      e.preventDefault();

      const targetDay = days[dragPreview.dayIndex];
      onExternalDrop?.(targetDay, dragPreview.hour);
      setDragPreview(null);
    },
    [externalDragTask, dragPreview, days, onExternalDrop]
  );

  // Calculate smart modal position (to the side of clicked slot)
  const TIME_COLUMN_WIDTH = 56; // w-14 = 56px
  const calculateModalPosition = useCallback(
    (dayIndex: number, hour: number) => {
      if (!gridRef.current || !scrollRef.current) return { top: 0, left: 0 };

      const gridRect = gridRef.current.getBoundingClientRect();
      const scrollRect = scrollRef.current.getBoundingClientRect();
      const dayWidth = gridRect.width / 7;

      // Calculate slot position - use absolute position within scroll container
      // Add TIME_COLUMN_WIDTH since modal is positioned relative to scrollRef which includes time column
      const slotLeft = TIME_COLUMN_WIDTH + dayIndex * dayWidth;
      const slotTop = hour * HOUR_HEIGHT;

      // Determine if modal should go left or right of the slot
      const slotCenterX = slotLeft + dayWidth / 2;
      const containerCenterX = scrollRect.width / 2;

      let modalLeft: number;
      if (slotCenterX > containerCenterX) {
        // Slot is on right half, show modal on left
        modalLeft = Math.max(8, slotLeft - MODAL_WIDTH - 16);
      } else {
        // Slot is on left half, show modal on right
        modalLeft = Math.min(
          scrollRect.width - MODAL_WIDTH - 8,
          slotLeft + dayWidth + 16
        );
      }

      // Position modal next to the slot (clamped within reasonable bounds)
      const modalTop = Math.max(8, slotTop);

      return { top: modalTop, left: modalLeft };
    },
    []
  );

  // Slot click for quick add
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

  // Handle preview change from QuickAddTask (when user changes date/time)
  const handlePreviewChange = useCallback(
    (newDate: Date, newTime: string) => {
      const newDayIndex = days.findIndex((d) => isSameDay(d, newDate));
      const newHour = parseInt(newTime.split(":")[0]);

      // Only update ghost if date is in current week
      if (newDayIndex >= 0) {
        setGhostPreview({ dayIndex: newDayIndex, hour: newHour });
      } else {
        setGhostPreview(null);
      }
    },
    [days]
  );

  const handleQuickAddSave = useCallback(
    (title: string, project?: string, date?: Date, time?: string) => {
      if (!quickAddSlot) return;

      const finalDate = date || quickAddSlot.date;
      const finalTime = time || quickAddSlot.time;

      onCreateTask({
        title,
        project,
        scheduledDate: setMinutes(
          setHours(finalDate, parseInt(finalTime.split(":")[0])),
          0
        ).toISOString(),
        scheduledTime: finalTime,
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
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Day Headers */}
      <div className="flex border-b border-slate-200 bg-white sticky top-0 z-20 shrink-0">
        <div className="w-14 shrink-0" />
        {days.map((day, idx) => (
          <div
            key={day.toString()}
            className={cn(
              "flex-1 py-3 text-center border-l border-slate-100 transition-colors",
              // Soft blue highlight for active drop target
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
                // Today indicator - professional blue instead of harsh purple/teal
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

      {/* Scrollable Grid */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden relative"
      >
        <div className="flex relative" style={{ height: 24 * HOUR_HEIGHT }}>
          {/* Time Column */}
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

          {/* Grid Area */}
          <div ref={gridRef} data-calendar-grid className="flex-1 relative">
            {/* Hour Lines */}
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute left-0 right-0 border-t border-slate-100"
                style={{ top: hour * HOUR_HEIGHT }}
              />
            ))}

            {/* Day Columns with Slots */}
            <div className="absolute inset-0 flex">
              {days.map((day, dayIdx) => (
                <div
                  key={day.toString()}
                  className={cn(
                    "flex-1 border-l border-slate-100 relative",
                    // Soft blue highlight for active drop column
                    dragPreview?.dayIndex === dayIdx &&
                      isDragging &&
                      "bg-blue-50/40"
                  )}
                >
                  {/* Hour Slots */}
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
                      {/* Quick add button on hover */}
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

                  {/* Tasks */}
                  {tasks
                    .filter(
                      (t) =>
                        t.scheduledDate &&
                        isSameDay(new Date(t.scheduledDate), day)
                    )
                    .map((task) => {
                      const hour = parseInt(task.scheduledTime || "0");
                      const isBeingDragged = dragTask?._id === task._id;

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
                            // Google Calendar style: solid backgrounds, small rounded corners
                            "absolute left-1 right-1 rounded px-2 py-1.5 cursor-grab active:cursor-grabbing",
                            // Subtle border for definition against grid
                            "border border-white/20 transition-all duration-100 overflow-hidden",
                            // Softer color backgrounds - easier on the eyes
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
                            top: hour * HOUR_HEIGHT + 1,
                            height: HOUR_HEIGHT - 2,
                          }}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          {/* White text on solid backgrounds */}
                          <p className="text-xs font-medium text-white truncate leading-tight">
                            {task.title}
                          </p>
                          <p className="text-[10px] text-white/80 mt-0.5 truncate">
                            {task.scheduledTime}
                            {task.project && ` · ${task.project}`}
                          </p>
                        </motion.div>
                      );
                    })}

                  {/* Current Time Indicator */}
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

            {/* Drag Preview - Semi-transparent solid like Google Calendar */}
            <AnimatePresence>
              {isDragging && dragPreview && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "absolute rounded pointer-events-none z-20",
                    // Semi-transparent softer backgrounds
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

            {/* Ghost Preview for New Task - Semi-transparent blue */}
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

        {/* Quick Add Popup - Positioned to side of slot */}
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
