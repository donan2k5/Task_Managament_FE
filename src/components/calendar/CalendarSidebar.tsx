import { useTasks } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";
import { Briefcase, Clock } from "lucide-react";

export const CalendarSidebar = () => {
  const { tasks } = useTasks();

  // Lọc task chưa lên lịch và chưa xong
  const unscheduledTasks = tasks.filter(
    (t) => !t.scheduledDate && t.status !== "done"
  );

  const onDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="p-4 flex flex-col h-full bg-slate-50/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">
          Unscheduled ({unscheduledTasks.length})
        </h3>
      </div>

      <div className="space-y-2 overflow-y-auto pr-1 custom-scrollbar">
        {unscheduledTasks.length > 0 ? (
          unscheduledTasks.map((task) => (
            <div
              key={task._id}
              draggable
              onDragStart={(e) => onDragStart(e, task._id)}
              className={cn(
                "p-2.5 rounded-lg border bg-white shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-300 transition-all group",
                task.isUrgent && task.isImportant
                  ? "border-l-rose-500 border-l-4"
                  : task.isImportant
                  ? "border-l-indigo-500 border-l-4"
                  : "border-l-slate-300 border-l-4"
              )}
            >
              <p className="text-xs font-semibold text-slate-700 line-clamp-1 group-hover:text-indigo-600">
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-slate-300" />
                  <span className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-[80px]">
                    {task.project || "Inbox"}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl">
            <Clock className="w-5 h-5 text-slate-200 mx-auto mb-2" />
            <p className="text-[10px] text-slate-400">All tasks scheduled</p>
          </div>
        )}
      </div>
    </div>
  );
};
