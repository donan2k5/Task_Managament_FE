"use client";

import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { CalendarSidebar } from "@/components/calendar/CalendarSidebar";
import { WeekView } from "@/components/calendar/WeekView";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { format, startOfWeek, addDays, subDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Task } from "@/types";

export default function CalendarPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  // State selectedTask giờ có thể là Partial<Task> (khi tạo mới)
  const [selectedTask, setSelectedTask] = useState<Task | Partial<Task> | null>(
    null
  );

  const {
    calendarTasks,
    fetchCalendarTasks,
    updateTask,
    addTask,
    deleteTask,
    loading,
  } = useTasks();
  const { projects } = useProjects();

  const range = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = addDays(start, 6);
    return { start, end };
  }, [currentDate]);

  useEffect(() => {
    fetchCalendarTasks(range.start, range.end);
  }, [range.start, fetchCalendarTasks]);

  // Handler khi click vào khoảng trống -> Mở Panel Tạo Mới
  const handleSlotClick = (date: Date, time: string) => {
    setSelectedTask({
      title: "",
      scheduledDate: date.toISOString(),
      scheduledTime: time,
      status: "todo",
      isUrgent: false,
      isImportant: false,
      project: undefined,
    });
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-white">
        <AnimatePresence mode="wait">
          {isSidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="h-full shrink-0 overflow-hidden"
            >
              <CalendarSidebar />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
          <div className="flex items-center justify-between p-3 border-b bg-white">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                {isSidebarOpen ? (
                  <PanelLeftClose className="w-4 h-4" />
                ) : (
                  <PanelLeftOpen className="w-4 h-4" />
                )}
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-lg font-bold flex items-center gap-2 px-2 hover:bg-slate-50"
                  >
                    {format(currentDate, "MMMM yyyy")}
                    <CalendarIcon className="w-4 h-4 text-slate-400" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={currentDate}
                    onSelect={(d) => d && setCurrentDate(d)}
                  />
                </PopoverContent>
              </Popover>

              <div className="flex items-center bg-slate-100 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setCurrentDate(subDays(currentDate, 7))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  className="text-[10px] font-bold h-7 px-3"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setCurrentDate(addDays(currentDate, 7))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <WeekView
              currentDate={currentDate}
              tasks={calendarTasks}
              onUpdateTask={updateTask}
              onTaskClick={(t) => setSelectedTask(t)} // Click Task -> Edit
              onSlotClick={handleSlotClick} // Click Slot -> Create
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedTask && (
          <TaskDetailPanel
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onUpdate={updateTask}
            onCreate={(newTask) => {
              // Logic Tạo Mới
              addTask(newTask);
              setSelectedTask(null);
            }}
            onDelete={(id) => {
              deleteTask(id);
              setSelectedTask(null);
            }}
            projects={projects}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
