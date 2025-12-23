import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Briefcase,
  X,
  GripHorizontal,
  ChevronDown,
  Calendar as CalendarIcon,
} from "lucide-react";
import { format, setHours, setMinutes, addDays, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Project } from "@/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface QuickAddTaskProps {
  date: Date;
  time: string;
  position: { top: number; left: number };
  onSave: (title: string, project?: string, date?: Date, time?: string, endTime?: string) => void;
  onCancel: () => void;
  onPreviewChange?: (date: Date, time: string) => void;
  projects: Project[];
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const QuickAddTask = ({
  date: initialDate,
  time: initialTime,
  position,
  onSave,
  onCancel,
  onPreviewChange,
  projects,
}: QuickAddTaskProps) => {
  const [title, setTitle] = useState("");
  const [project, setProject] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [selectedTime, setSelectedTime] = useState<string>(initialTime);
  const [showProjects, setShowProjects] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onCancel();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onCancel]);

  // Notify parent when date/time changes for preview update
  const handleDateChange = useCallback(
    (newDate: Date) => {
      setSelectedDate(newDate);
      onPreviewChange?.(newDate, selectedTime);
    },
    [selectedTime, onPreviewChange]
  );

  const handleTimeChange = useCallback(
    (newTime: string) => {
      setSelectedTime(newTime);
      setShowTimePicker(false);
      onPreviewChange?.(selectedDate, newTime);
    },
    [selectedDate, onPreviewChange]
  );

  const handleSubmit = () => {
    if (!title.trim()) return;
    // Calculate end time (+1 hour from start)
    const startHour = parseInt(selectedTime.split(":")[0]);
    const calculatedEndTime = `${((startHour + 1) % 24).toString().padStart(2, "0")}:00`;
    onSave(title.trim(), project || undefined, selectedDate, selectedTime, calculatedEndTime);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const selectedProject = projects.find((p) => p.name === project);

  // Calculate end time (1 hour after start)
  const startHour = parseInt(selectedTime.split(":")[0]);
  const endHour = (startHour + 1) % 24;
  const endTime = `${endHour.toString().padStart(2, "0")}:00`;

  // Format time for display (e.g., "12:00pm")
  const formatTimeDisplay = (timeStr: string) => {
    const hour = parseInt(timeStr.split(":")[0]);
    const period = hour >= 12 ? "pm" : "am";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00${period}`;
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="bg-white rounded-lg shadow-[0_24px_38px_3px_rgba(0,0,0,0.14),0_9px_46px_8px_rgba(0,0,0,0.12),0_11px_15px_-7px_rgba(0,0,0,0.2)] overflow-visible"
      style={{ width: "448px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-100/80">
        <GripHorizontal className="w-5 h-5 text-slate-400" />
        <button
          onClick={onCancel}
          className="p-1 text-slate-500 hover:bg-slate-200 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="px-4 pt-2 pb-4">
        {/* Title Input */}
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add title"
          className="w-full text-[22px] text-slate-700 placeholder:text-slate-400 bg-transparent border-b-2 border-slate-200 focus:border-indigo-500 pb-2 outline-none transition-colors"
        />

        {/* Date & Time Row */}
        <div className="flex items-center gap-4 mt-6 text-sm text-slate-600">
          <Clock className="w-5 h-5 text-slate-400 shrink-0" />
          <div className="flex items-center gap-1 flex-wrap">
            {/* Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 hover:bg-slate-100 px-2 py-1 rounded-md transition-colors">
                  <span>{format(selectedDate, "EEEE, MMMM d")}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[100]" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && handleDateChange(d)}
                />
              </PopoverContent>
            </Popover>

            <span className="text-slate-300">|</span>

            {/* Time Picker */}
            <div className="relative">
              <button
                onClick={() => setShowTimePicker(!showTimePicker)}
                className="flex items-center gap-1 font-medium hover:bg-slate-100 px-2 py-1 rounded-md transition-colors"
              >
                <span>
                  {formatTimeDisplay(selectedTime)} -{" "}
                  {formatTimeDisplay(endTime)}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {showTimePicker && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-[100] max-h-[240px] overflow-y-auto w-[140px]"
                >
                  {HOURS.map((hour) => {
                    const timeStr = `${hour.toString().padStart(2, "0")}:00`;
                    return (
                      <button
                        key={hour}
                        onClick={() => handleTimeChange(timeStr)}
                        className={cn(
                          "w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors",
                          selectedTime === timeStr && "bg-indigo-50 text-indigo-600 font-medium"
                        )}
                      >
                        {formatTimeDisplay(timeStr)}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Project Selector */}
        <div className="relative mt-4">
          <button
            onClick={() => setShowProjects(!showProjects)}
            className="flex items-center gap-4 w-full text-sm text-slate-600 hover:bg-slate-50 rounded-md p-1 -ml-1 transition-colors"
          >
            <Briefcase className="w-5 h-5 text-slate-400" />
            <div className="flex items-center gap-2 flex-1">
              {project ? (
                <>
                  <span className="font-medium text-slate-700">{project}</span>
                  {selectedProject && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: selectedProject.color || "#6366f1",
                      }}
                    />
                  )}
                </>
              ) : (
                <span className="text-slate-400">Add to project</span>
              )}
            </div>
            {project && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setProject("");
                }}
                className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </button>

          {/* Project Dropdown */}
          {showProjects && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-10 max-h-[200px] overflow-y-auto"
            >
              {projects.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-400 text-center">
                  No projects available
                </div>
              ) : (
                projects.map((p) => (
                  <button
                    key={p._id}
                    onClick={() => {
                      setProject(p.name);
                      setShowProjects(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors",
                      project === p.name && "bg-indigo-50"
                    )}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: p.color || "#6366f1",
                      }}
                    />
                    <span className="font-medium text-slate-700">{p.name}</span>
                  </button>
                ))
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 flex justify-end items-center gap-2 border-t border-slate-100">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
        >
          More options
        </button>
        <button
          onClick={handleSubmit}
          disabled={!title.trim()}
          className={cn(
            "px-6 py-2 text-sm font-medium rounded-md transition-all",
            title.trim()
              ? "bg-indigo-600 text-white hover:bg-indigo-700"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          )}
        >
          Save
        </button>
      </div>
    </motion.div>
  );
};
