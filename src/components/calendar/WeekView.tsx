import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  setHours,
  setMinutes,
} from "date-fns";
import { useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { Task } from "@/types";

const HOURS = Array.from({ length: 24 }).map(
  (_, i) => `${String(i).padStart(2, "0")}:00`
);

interface WeekViewProps {
  currentDate: Date;
  tasks: Task[];
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onTaskClick: (task: Task) => void;
  onSlotClick: (date: Date, time: string) => void; // <--- NEW
}

export const WeekView = ({
  currentDate,
  tasks,
  onUpdateTask,
  onTaskClick,
  onSlotClick,
}: WeekViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const days = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [currentDate]);

  // --- LOGIC AUTO-SCROLL ---
  const handleDragOverContainer = (e: React.DragEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const { top, bottom } = container.getBoundingClientRect();
    const mouseY = e.clientY;
    const threshold = 50;
    const scrollSpeed = 10;

    if (mouseY < top + threshold) container.scrollTop -= scrollSpeed;
    else if (mouseY > bottom - threshold) container.scrollTop += scrollSpeed;
  };

  // --- LOGIC DROP ---
  const handleDropOnColumn = (e: React.DragEvent, dayDate: Date) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    // Tính y tương đối với cột hiện tại (đã bao gồm việc cuộn vì cột nằm trong container)
    const y = e.nativeEvent.offsetY;
    // Tuy nhiên, nếu drop vào task con thì offsetY sẽ sai.
    // An toàn nhất: (ClientY - RectTop)
    const relativeY = e.clientY - rect.top;

    const hourIndex = Math.floor(relativeY / 80);
    const validHour = Math.max(0, Math.min(23, hourIndex));

    const newDate = setMinutes(setHours(dayDate, validHour), 0);
    const hourString = `${validHour.toString().padStart(2, "0")}:00`;

    onUpdateTask(taskId, {
      scheduledDate: newDate.toISOString(),
      scheduledTime: hourString,
      status: "todo",
    });
  };

  // --- LOGIC CLICK SLOT ---
  const handleSlotClick = (e: React.MouseEvent, dayDate: Date) => {
    // Ngăn chặn nếu đang kéo thả hoặc click vào task
    if (e.defaultPrevented) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const hourIndex = Math.floor(relativeY / 80);
    const validHour = Math.max(0, Math.min(23, hourIndex));

    const clickedDate = setMinutes(setHours(dayDate, validHour), 0);
    const hourString = `${validHour.toString().padStart(2, "0")}:00`;

    onSlotClick(clickedDate, hourString);
  };

  return (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Header Ngày */}
      <div className="flex border-b bg-white sticky top-0 z-30 shadow-sm ml-16">
        {days.map((day) => (
          <div
            key={day.toString()}
            className="flex-1 py-3 text-center border-r last:border-r-0"
          >
            <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-1">
              {format(day, "EEE")}
            </div>
            <div
              className={cn(
                "text-xl font-medium w-8 h-8 flex items-center justify-center mx-auto rounded-full transition-all",
                isSameDay(day, new Date())
                  ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                  : "text-slate-700 hover:bg-slate-100"
              )}
            >
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>

      {/* Grid Body */}
      <div
        ref={containerRef}
        onDragOver={handleDragOverContainer}
        className="flex-1 overflow-y-auto custom-scrollbar relative flex"
      >
        <div className="w-16 flex-shrink-0 bg-white sticky left-0 z-20 border-r min-h-full">
          {HOURS.map((h) => (
            <div
              key={h}
              className="h-[80px] text-[10px] text-slate-400 font-medium text-right pr-2 pt-2 relative"
            >
              <span className="-translate-y-1/2 block bg-white pl-1">{h}</span>
            </div>
          ))}
        </div>

        <div className="flex-1 relative min-w-[600px]">
          {/* Lớp Nền (Grid Lines) */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            {HOURS.map((_, i) => (
              <div
                key={i}
                className="h-[80px] border-b border-slate-100 w-full"
              />
            ))}
          </div>

          {/* Lớp Cột Ngày */}
          <div className="absolute inset-0 z-10 flex">
            {days.map((day) => (
              <div
                key={day.toString()}
                className="flex-1 border-r border-slate-100/50 relative group h-full cursor-cell"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDropOnColumn(e, day)}
                onClick={(e) => handleSlotClick(e, day)} // <--- CLICK EVENT
              >
                {/* Hover Effect */}
                <div
                  className="absolute w-full h-[80px] bg-indigo-50/0 group-hover:bg-indigo-50/20 pointer-events-none transition-colors"
                  style={{ display: "none" }}
                />

                {/* Render Tasks */}
                {tasks
                  .filter(
                    (t) =>
                      t.scheduledDate &&
                      isSameDay(new Date(t.scheduledDate), day)
                  )
                  .map((task) => (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("taskId", task._id);
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.stopPropagation(); // Quan trọng: Click task ko trigger click slot
                        onTaskClick(task);
                      }}
                      className={cn(
                        "absolute left-1 right-1 rounded-lg p-2.5 text-white shadow-sm z-20 text-xs font-bold border border-white/20 cursor-grab active:cursor-grabbing hover:brightness-105 hover:shadow-md hover:z-30 transition-all flex flex-col overflow-hidden",
                        task.isUrgent && task.isImportant
                          ? "bg-rose-500 shadow-rose-200"
                          : task.isImportant
                          ? "bg-indigo-500 shadow-indigo-200"
                          : "bg-slate-500 shadow-slate-200"
                      )}
                      style={{
                        top: `${
                          parseInt(task.scheduledTime || "0") * 80 + 2
                        }px`,
                        height: "76px",
                      }}
                    >
                      <p className="truncate leading-tight">{task.title}</p>
                      <div className="mt-auto flex items-center justify-between opacity-90">
                        <span className="text-[9px] font-medium bg-black/10 px-1 rounded">
                          {task.scheduledTime}
                        </span>
                        {task.project && (
                          <span className="text-[9px] uppercase tracking-wider truncate max-w-[50px]">
                            {task.project}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                {isSameDay(day, new Date()) && (
                  <div
                    className="absolute left-0 right-0 border-t-2 border-red-500 z-40 pointer-events-none opacity-60"
                    style={{
                      top: `${
                        (new Date().getHours() + new Date().getMinutes() / 60) *
                        80
                      }px`,
                    }}
                  >
                    <div className="w-2 h-2 bg-red-500 rounded-full -mt-[5px] -ml-[5px]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
