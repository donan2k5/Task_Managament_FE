"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { WeekView } from "@/components/calendar/WeekView";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { UnscheduledSidebar } from "@/components/calendar/UnscheduledSidebar";
import { TaskDetailPopover } from "@/components/calendar/TaskDetailPopover";
import { useTaskContext } from "@/context/TaskContext";
import { useProjects } from "@/hooks/useProjects";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { startOfWeek, addDays, setHours, setMinutes } from "date-fns";
import { AnimatePresence } from "framer-motion";
import { Task } from "@/types";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [popoverTask, setPopoverTask] = useState<{ task: Task; position: { x: number; y: number } } | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [externalDragTask, setExternalDragTask] = useState<Task | null>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  const { scheduledTasks, unscheduledTasks, updateTask, addTask, deleteTask } =
    useTaskContext();
  const { projects } = useProjects();

  // Filter tasks for current week
  const weekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: 1 }),
    [currentDate]
  );
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  const weekTasks = useMemo(() => {
    return scheduledTasks.filter((task) => {
      if (!task.scheduledDate) return false;
      const taskDate = new Date(task.scheduledDate);
      return taskDate >= weekStart && taskDate <= addDays(weekEnd, 1);
    });
  }, [scheduledTasks, weekStart, weekEnd]);

  // Sync selected task with context
  useEffect(() => {
    if (selectedTask) {
      const updated = scheduledTasks.find((t) => t._id === selectedTask._id);
      if (updated) {
        setSelectedTask(updated);
      } else {
        const fromUnscheduled = unscheduledTasks.find(
          (t) => t._id === selectedTask._id
        );
        if (fromUnscheduled) setSelectedTask(fromUnscheduled);
      }
    }
  }, [scheduledTasks, unscheduledTasks, selectedTask?._id]);

  // Sync popover task with context
  useEffect(() => {
    if (popoverTask) {
      const updated = scheduledTasks.find((t) => t._id === popoverTask.task._id);
      if (updated) {
        setPopoverTask({ ...popoverTask, task: updated });
      }
    }
  }, [scheduledTasks]);

  // Handle task click - show popover near the click position
  const handleTaskClick = useCallback((task: Task, event?: React.MouseEvent) => {
    if (event) {
      setPopoverTask({
        task,
        position: { x: event.clientX + 10, y: event.clientY - 20 },
      });
    } else {
      setPopoverTask({
        task,
        position: { x: window.innerWidth / 2 - 160, y: window.innerHeight / 3 },
      });
    }
  }, []);

  // Handle external drag from sidebar
  const handleExternalDragStart = (task: Task) => {
    setExternalDragTask(task);
  };

  const handleExternalDrop = (date: Date, hour: number) => {
    if (!externalDragTask) return;

    const startDate = setMinutes(setHours(date, hour), 0);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    updateTask(externalDragTask._id, {
      scheduledDate: startDate.toISOString(),
      scheduledEndDate: endDate.toISOString(),
      assignedDate: startDate.toISOString().split('T')[0],
      status: "todo",
    });
    setExternalDragTask(null);
  };

  return (
    <DashboardLayout>
      <div className="relative h-[calc(100vh-4rem)] overflow-hidden bg-slate-100">
        <div className={`${isSidebarExpanded ? 'block' : 'hidden lg:block'}`}>
          <UnscheduledSidebar
            tasks={unscheduledTasks}
            onDragStart={handleExternalDragStart}
            onDragEnd={() => setExternalDragTask(null)}
            onTaskClick={(task) => handleTaskClick(task)}
            draggingTaskId={externalDragTask?._id}
            isExpanded={isSidebarExpanded}
            onToggleExpanded={setIsSidebarExpanded}
          />
        </div>

        {isSidebarExpanded && (
          <div
            className="fixed inset-0 bg-black/20 z-30 lg:hidden"
            onClick={() => setIsSidebarExpanded(false)}
          />
        )}

        <div
          className="h-full flex flex-col p-2 md:p-4 transition-all duration-300 ease-in-out"
          style={{ paddingLeft: isSidebarExpanded ? '296px' : undefined }}
        >
          <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <CalendarHeader
              currentDate={currentDate}
              onDateChange={setCurrentDate}
            />

            <div className="flex-1 overflow-hidden">
              <WeekView
                currentDate={currentDate}
                tasks={weekTasks}
                projects={projects}
                onUpdateTask={updateTask}
                onTaskClick={handleTaskClick}
                onCreateTask={addTask}
                externalDragTask={externalDragTask}
                onExternalDrop={handleExternalDrop}
              />
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {popoverTask && (
          <TaskDetailPopover
            task={popoverTask.task}
            position={popoverTask.position}
            onClose={() => setPopoverTask(null)}
            onEdit={() => {
              setEditingTask(popoverTask.task);
              setPopoverTask(null);
            }}
            onDelete={(id) => {
              deleteTask(id);
              setPopoverTask(null);
            }}
            onUpdate={updateTask}
            projects={projects}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingTask && (
          <TaskDetailPanel
            task={editingTask}
            onClose={() => setEditingTask(null)}
            onUpdate={updateTask}
            onDelete={(id) => {
              deleteTask(id);
              setEditingTask(null);
            }}
            projects={projects}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
