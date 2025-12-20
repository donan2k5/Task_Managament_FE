import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { cn } from "@/lib/utils";
import { Task } from "@/types";

interface MonthViewProps {
  currentDate: Date;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export const MonthView = ({
  currentDate,
  tasks,
  onTaskClick,
}: MonthViewProps) => {
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header Thứ */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid Ngày */}
      <div className="flex-1 grid grid-cols-7 grid-rows-5 lg:grid-rows-6">
        {days.map((day, idx) => {
          const dayTasks = tasks.filter(
            (t) => t.scheduledDate && isSameDay(new Date(t.scheduledDate), day)
          );
          // Sort tasks: Urgent -> Important -> Time
          dayTasks.sort((a, b) => {
            if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1;
            return (a.scheduledTime || "").localeCompare(b.scheduledTime || "");
          });

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "border-b border-r p-2 flex flex-col gap-1 min-h-[100px] transition-colors hover:bg-slate-50/30",
                !isSameMonth(day, currentDate) &&
                  "bg-slate-50/30 text-slate-400"
              )}
            >
              <div className="flex justify-between items-start">
                <span
                  className={cn(
                    "text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full",
                    isToday(day) ? "bg-violet-600 text-white" : "text-slate-700"
                  )}
                >
                  {format(day, "d")}
                </span>
                {dayTasks.length > 0 && (
                  <span className="text-[10px] text-slate-400 font-medium">
                    {dayTasks.length} tasks
                  </span>
                )}
              </div>

              {/* Task List (Compact) */}
              <div className="flex-1 flex flex-col gap-1 mt-1 overflow-y-auto custom-scrollbar max-h-[100px]">
                {dayTasks.map((task) => (
                  <button
                    key={task._id}
                    onClick={() => onTaskClick(task)}
                    className={cn(
                      "text-left text-[10px] px-1.5 py-1 rounded truncate font-medium border-l-2 transition-all hover:brightness-95",
                      task.isUrgent
                        ? "bg-rose-50 text-rose-700 border-rose-500"
                        : task.isImportant
                        ? "bg-indigo-50 text-indigo-700 border-indigo-500"
                        : "bg-slate-100 text-slate-600 border-slate-400"
                    )}
                  >
                    <span className="opacity-70 mr-1">
                      {task.scheduledTime}
                    </span>
                    {task.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
