import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Video,
  MapPin,
  MoreHorizontal,
  Calendar as CalendarIcon,
  X,
  ChevronDown,
  Clock,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/useTasks";
import { Task } from "@/types";

// --- DATE HELPERS ---
const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const isSameDate = (d1: Date, d2: Date) =>
  d1.toDateString() === d2.toDateString();

const formatTime = (dateInput: Date | string | undefined) => {
  if (!dateInput) return "Anytime";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "Anytime";

  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

// Animation Variants
const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 20 : -20, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 20 : -20, opacity: 0 }),
};

export const CalendarCard = () => {
  // --- STATE ---
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(
    getStartOfWeek(new Date())
  );
  const [direction, setDirection] = useState(0);

  // --- API DATA ---
  const { calendarTasks, fetchCalendarTasks, loading } = useTasks();

  const range = useMemo(() => {
    const start = new Date(currentWeekStart);
    start.setHours(0, 0, 0, 0);
    const end = addDays(currentWeekStart, 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }, [currentWeekStart]);

  useEffect(() => {
    fetchCalendarTasks(range.start, range.end);
  }, [range.start.toISOString(), fetchCalendarTasks]);

  // --- DERIVED STATE ---
  const weekDays = useMemo(
    () => Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart]
  );

  const dailyEvents = useMemo(() => {
    if (!calendarTasks) return [];
    return calendarTasks
      .filter(
        (t) =>
          t.scheduledDate && isSameDate(new Date(t.scheduledDate), selectedDate)
      )
      .sort((a, b) => {
        // Sắp xếp theo thời gian (giờ:phút)
        const timeA = new Date(a.scheduledDate!).getTime();
        const timeB = new Date(b.scheduledDate!).getTime();
        return timeA - timeB;
      });
  }, [calendarTasks, selectedDate]);

  const headerDate = useMemo(
    () => addDays(currentWeekStart, 3),
    [currentWeekStart]
  );

  // --- HANDLERS ---
  const navigateWeek = (dir: number) => {
    setDirection(dir);
    setCurrentWeekStart(addDays(currentWeekStart, dir * 7));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col relative z-20 min-h-[500px]"
    >
      {/* HEADER */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 select-none">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <CalendarIcon className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {headerDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              {loading ? "Syncing..." : "Weekly Schedule"}
            </p>
          </div>
        </div>

        <div className="flex gap-1 bg-slate-50 p-0.5 rounded-lg">
          <button
            onClick={() => navigateWeek(-1)}
            className="p-1.5 hover:bg-white rounded text-slate-500 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigateWeek(1)}
            className="p-1.5 hover:bg-white rounded text-slate-500 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* WEEK STRIP */}
      <div className="overflow-hidden mb-5">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentWeekStart.toISOString()}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex justify-between gap-1"
          >
            {weekDays.map((date) => {
              const isSelected = isSameDate(date, selectedDate);
              const isToday = isSameDate(date, new Date());
              const hasEvent = calendarTasks?.some(
                (t) =>
                  t.scheduledDate && isSameDate(new Date(t.scheduledDate), date)
              );

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    "flex flex-col items-center justify-center w-10 h-16 rounded-xl transition-all duration-200",
                    isSelected
                      ? "bg-indigo-600 text-white shadow-md scale-105"
                      : isToday
                      ? "bg-indigo-50 text-indigo-700 font-bold border border-indigo-100"
                      : "text-slate-400 hover:bg-slate-50"
                  )}
                >
                  <span className="text-[9px] uppercase font-semibold mb-0.5">
                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                  <span className="text-lg font-bold">{date.getDate()}</span>
                  {hasEvent && (
                    <span
                      className={cn(
                        "w-1 h-1 rounded-full mt-1",
                        isSelected ? "bg-white" : "bg-indigo-400"
                      )}
                    />
                  )}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* EVENT LIST */}
      <div className="flex flex-col gap-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 opacity-50">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
              <span className="text-xs text-slate-400">Loading events...</span>
            </div>
          ) : dailyEvents.length > 0 ? (
            dailyEvents.map((task) => <EventItem key={task._id} task={task} />)
          ) : (
            <EmptyState />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// --- SUB COMPONENTS ---

const EventItem = ({ task }: { task: Task }) => {
  // Bóc tách giờ từ scheduledDate nếu không có field scheduledTime riêng
  const displayTime = useMemo(() => {
    if (task.scheduledTime) return task.scheduledTime;
    return formatTime(task.scheduledDate);
  }, [task.scheduledTime, task.scheduledDate]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="group relative flex gap-3 p-3.5 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer"
    >
      <div className="flex flex-col items-center min-w-[42px] pt-0.5">
        <span className="text-xs font-bold text-slate-800">{displayTime}</span>
        <div className="w-[2px] h-full bg-slate-100 my-1.5 group-hover:bg-indigo-200 transition-colors rounded-full" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              task.isUrgent ? "bg-rose-500" : "bg-indigo-500"
            )}
          />
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            {task.project || "General"}
          </span>
        </div>
        <h4 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-indigo-700 transition-colors truncate">
          {task.title}
        </h4>
        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
          <span className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
            <Clock className="w-3 h-3 text-indigo-500" />{" "}
            {task.status || "Todo"}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex-1 flex flex-col items-center justify-center text-center py-10 border-2 border-dashed border-slate-50 rounded-2xl bg-slate-50/30"
  >
    <Clock className="w-8 h-8 text-slate-200 mb-2" />
    <p className="text-xs text-slate-400 font-medium tracking-wide">
      NO TASKS SCHEDULED
    </p>
  </motion.div>
);
