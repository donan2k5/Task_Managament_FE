"use client";

import { useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHabits, useCreateHabit, useLogHabit, useDeleteHabit } from "@/hooks/useHabits";
import { format, startOfWeek, addDays, isToday, isSameDay, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { Plus, Flame, Check, Trash2, ChevronLeft, ChevronRight, Zap, MoreHorizontal, X, CheckCircle2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { HabitWithStats, HabitLog } from "@/types/habit";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const HABIT_ICONS = ["📝", "🏃", "📚", "🧘", "💪", "🎯", "💧", "🌙", "🍎", "✍️", "🎵", "🧹", "💊", "🚶"];
const HABIT_COLORS = [
  "#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899",
  "#ef4444", "#14b8a6", "#6366f1", "#f97316", "#64748b"
];

// Circular Progress Ring Component
const CircularProgress = ({ percentage, size = 40, strokeWidth = 3 }: { percentage: number; size?: number; strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500"
      />
    </svg>
  );
};

export default function HabitsPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("📝");
  const [selectedColor, setSelectedColor] = useState("#3b82f6");
  const [selectedHabitForDetail, setSelectedHabitForDetail] = useState<HabitWithStats | null>(null);

  const queryClient = useQueryClient();
  const { data: habitsWithStats = [], isLoading } = useHabits();
  const createHabit = useCreateHabit();
  const logHabit = useLogHabit();
  const deleteHabit = useDeleteHabit();

  const currentWeekStart = startOfWeek(selectedDate, { weekStartsOn: 0 }); // Sunday start like TickTick
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  // Fetch logs for the visible week range
  const { data: rangeLogs = [] } = useQuery({
    queryKey: ['habit-logs-range', currentWeekStart.toISOString()],
    queryFn: async () => {
      const end = addDays(currentWeekStart, 7).toISOString();
      const res = await api.get<HabitLog[]>(`/habits/logs/range?start=${currentWeekStart.toISOString()}&end=${end}`);
      return res.data;
    }
  });

  const handleCreateHabit = async () => {
    if (!newHabitName.trim()) return;
    await createHabit.mutateAsync({
      name: newHabitName.trim(),
      icon: selectedIcon,
      color: selectedColor,
    });
    setNewHabitName("");
    setShowAddForm(false);
  };

  const handleToggleLog = async (habitId: string, date: Date, currentlyCompleted: boolean) => {
    await logHabit.mutateAsync({
      id: habitId,
      date: date.toISOString(),
      completed: !currentlyCompleted,
    });
  };

  const isDateLogged = (habitId: string, date: Date): boolean => {
    const inRange = rangeLogs.some(l => 
        (typeof l.habitId === 'string' ? l.habitId === habitId : (l.habitId as any)?._id === habitId) && // eslint-disable-line @typescript-eslint/no-explicit-any 
        isSameDay(new Date(l.date), date) && 
        l.completed
    );
    if (inRange) return true;

    const habit = habitsWithStats.find((h) => h.habit._id === habitId);
    if (!habit) return false;
    
    return habit.thisWeekLogs?.some(
      (log) => isSameDay(new Date(log.date), date) && log.completed
    ) || false;
  };

  // Calculate completion percentage for a specific day (how many habits completed / total habits)
  const getDayCompletionPercentage = (date: Date): number => {
    if (habitsWithStats.length === 0) return 0;
    const completed = habitsWithStats.filter(h => isDateLogged(h.habit._id, date)).length;
    return Math.round((completed / habitsWithStats.length) * 100);
  };

  const canMarkDate = (date: Date) => date <= new Date();

  const goToToday = () => setSelectedDate(new Date());

  return (
    <DashboardLayout>
      <TooltipProvider>
        <div className="flex h-[calc(100vh-2rem)] max-w-[1400px] mx-auto overflow-hidden bg-[#fafafa]">
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-100">
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-bold text-slate-800">Habit</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-slate-400">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
                <Button 
                  onClick={() => setShowAddForm(true)} 
                  size="icon" 
                  variant="ghost"
                  className="text-slate-600"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Week Header with Circular Progress - Like TickTick */}
            <div className="bg-white px-6 py-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                {weekDays.map((day) => {
                  const isSelected = isSameDay(day, selectedDate);
                  const isCurrentDay = isToday(day);
                  const isFuture = day > new Date();
                  const completionPercent = getDayCompletionPercentage(day);
                  const isFullyCompleted = completionPercent === 100 && habitsWithStats.length > 0;
                  
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => !isFuture && setSelectedDate(day)}
                      disabled={isFuture}
                      className={cn(
                        "flex flex-col items-center py-2 px-4 rounded-xl transition-all min-w-[70px]",
                        isSelected && "bg-blue-50",
                        isFuture && "opacity-40"
                      )}
                    >
                      <span className={cn(
                        "text-xs font-medium mb-2",
                        isCurrentDay ? "text-blue-500" : "text-slate-400"
                      )}>
                        {format(day, "EEE")}
                      </span>
                      <span className={cn(
                        "text-sm font-bold mb-2",
                        isCurrentDay ? "text-blue-500" : "text-slate-700"
                      )}>
                        {format(day, "d")}
                      </span>
                      
                      {/* Circular progress or checkmark */}
                      <div className="relative w-10 h-10 flex items-center justify-center">
                        {isFuture ? (
                          // Future: empty gray circle
                          <div className="w-8 h-8 rounded-full border-2 border-slate-200" />
                        ) : isFullyCompleted ? (
                          // All completed: blue checkmark
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" strokeWidth={3} />
                          </div>
                        ) : completionPercent > 0 ? (
                          // Partial: circular progress ring
                          <div className="relative">
                            <CircularProgress percentage={completionPercent} size={32} strokeWidth={3} />
                            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-blue-500">
                              {completionPercent}%
                            </span>
                          </div>
                        ) : (
                          // None completed: empty circle
                          <div className="w-8 h-8 rounded-full border-2 border-slate-200" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter Tag */}
            <div className="px-6 py-2 flex items-center gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                ▽ {format(selectedDate, "MMM d")} ×
              </span>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
              {/* Add Habit Form */}
              <AnimatePresence>
                {showAddForm && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white mx-6 mt-2 p-5 rounded-xl shadow-lg border border-slate-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-800">New Habit</h3>
                      <Button variant="ghost" size="icon" onClick={() => setShowAddForm(false)} className="h-8 w-8">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <Input
                        value={newHabitName}
                        onChange={(e) => setNewHabitName(e.target.value)}
                        placeholder="What habit do you want to build?"
                        className="text-base"
                        autoFocus
                        onKeyDown={(e) => e.key === "Enter" && handleCreateHabit()}
                      />
                      
                      <div>
                        <label className="text-xs font-medium text-slate-500 mb-2 block">Icon</label>
                        <div className="flex gap-1 flex-wrap">
                          {HABIT_ICONS.map((icon) => (
                            <button
                              key={icon}
                              onClick={() => setSelectedIcon(icon)}
                              className={cn(
                                "w-10 h-10 text-xl rounded-lg border-2 transition-all hover:scale-105",
                                selectedIcon === icon ? "border-blue-500 bg-blue-50" : "border-transparent hover:bg-slate-100"
                              )}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-slate-500 mb-2 block">Color</label>
                        <div className="flex gap-2 flex-wrap">
                          {HABIT_COLORS.map((color) => (
                            <button
                              key={color}
                              onClick={() => setSelectedColor(color)}
                              className={cn(
                                "w-8 h-8 rounded-full border-4 transition-all hover:scale-110",
                                selectedColor === color ? "border-slate-800 scale-110" : "border-transparent"
                              )}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
                        <Button onClick={handleCreateHabit} disabled={!newHabitName.trim()} className="bg-blue-500 hover:bg-blue-600">
                          Create Habit
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Habits List - TickTick Style */}
              <div className="px-6 py-2 space-y-1">
                {isLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                  </div>
                ) : habitsWithStats.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="font-bold text-slate-700 text-lg mb-2">Start Building Habits</h3>
                    <p className="text-slate-500 text-sm max-w-xs mx-auto mb-4">
                      Track your daily habits and build consistency over time.
                    </p>
                    <Button onClick={() => setShowAddForm(true)} className="bg-blue-500 hover:bg-blue-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Habit
                    </Button>
                  </div>
                ) : (
                  habitsWithStats.map(({ habit, currentStreak, longestStreak, completionRate, totalCompletions, thisWeekLogs }) => {
                    const isLoggedForSelectedDate = isDateLogged(habit._id, selectedDate);
                    const canMark = canMarkDate(selectedDate);
                    
                    return (
                      <div
                        key={habit._id}
                        className={cn(
                          "bg-white rounded-lg px-4 py-4 flex items-center gap-4 hover:bg-slate-50 transition-all cursor-pointer border-b border-slate-100",
                          selectedHabitForDetail?.habit._id === habit._id && "ring-2 ring-blue-500"
                        )}
                        onClick={() => setSelectedHabitForDetail({ habit, currentStreak, longestStreak, totalCompletions, completionRate, thisWeekLogs: thisWeekLogs || [] })}
                      >
                        {/* Habit Icon */}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                          style={{ backgroundColor: `${habit.color}20` }}
                        >
                          {habit.icon}
                        </div>

                        {/* Habit Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className={cn(
                            "font-semibold text-sm truncate",
                            isLoggedForSelectedDate ? "text-slate-400" : "text-slate-800"
                          )}>
                            {habit.name}
                          </h3>
                          <div className="flex items-center gap-3 mt-0.5">
                            <div className="flex items-center gap-1">
                              <Zap className="w-3 h-3 text-blue-500" />
                              <span className="text-[11px] text-slate-500">{currentStreak} Days</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3 text-orange-400" />
                              <span className="text-[11px] text-slate-500">{longestStreak} Day</span>
                            </div>
                          </div>
                        </div>

                        {/* Circular Checkbox on RIGHT - Like TickTick */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            canMark && handleToggleLog(habit._id, selectedDate, isLoggedForSelectedDate);
                          }}
                          disabled={!canMark}
                          className={cn(
                            "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                            isLoggedForSelectedDate 
                              ? "bg-blue-500 border-blue-500 text-white" 
                              : "border-slate-300 hover:border-blue-400",
                            !canMark && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {isLoggedForSelectedDate && <Check className="w-4 h-4" strokeWidth={3} />}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
          
          {/* Detail Sidebar */}
          <AnimatePresence>
            {selectedHabitForDetail && (
              <HabitCalendarSidebar 
                habitData={selectedHabitForDetail} 
                onClose={() => setSelectedHabitForDetail(null)}
              />
            )}
          </AnimatePresence>
        </div>
      </TooltipProvider>
    </DashboardLayout>
  );
}

// Sidebar with Month Calendar - Blue checkmarks for completed days
interface HabitCalendarSidebarProps {
  habitData: HabitWithStats;
  onClose: () => void;
}

function HabitCalendarSidebar({ habitData, onClose }: HabitCalendarSidebarProps) {
  const { habit, currentStreak, longestStreak, totalCompletions } = habitData;
  const queryClient = useQueryClient();
  const [viewMonth, setViewMonth] = useState(new Date());

  const viewMonthStart = startOfMonth(viewMonth);
  const viewMonthEnd = endOfMonth(viewMonth);

  const { data: monthLogs = [] } = useQuery({
    queryKey: ['habit-logs', habit._id, format(viewMonthStart, 'yyyy-MM')],
    queryFn: async () => {
      const start = viewMonthStart.toISOString();
      const end = viewMonthEnd.toISOString();
      const res = await api.get<HabitLog[]>(`/habits/${habit._id}/logs?from=${start}&to=${end}`);
      return res.data;
    }
  });

  const logMutation = useMutation({
    mutationFn: async ({ date, completed }: { date: Date; completed: boolean }) => {
      const res = await api.post(`/habits/${habit._id}/log`, {
        date: date.toISOString(),
        completed
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit-logs', habit._id] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['habit-logs-range'] });
      toast.success('Habit updated!');
    }
  });

  const monthDays = eachDayOfInterval({ start: viewMonthStart, end: viewMonthEnd });
  const monthlyCheckIns = monthLogs.filter(l => l.completed).length;
  const monthlyPercentage = Math.round((monthlyCheckIns / monthDays.length) * 100) || 0;

  const handleToggleDay = (day: Date) => {
    if (day > new Date()) return;
    const isLogged = monthLogs.some(l => isSameDay(new Date(l.date), day) && l.completed);
    logMutation.mutate({ date: day, completed: !isLogged });
  };

  return (
    <motion.div
      initial={{ x: 380, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 380, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="w-[380px] bg-white border-l border-slate-200 h-full flex flex-col shadow-xl overflow-hidden"
    >
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-5 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{habit.icon}</span>
          <h2 className="font-bold text-slate-800 truncate max-w-[220px]">{habit.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="w-4 h-4 text-slate-400" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="w-4 h-4 text-slate-400" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        
        {/* Stats Grid - 2x2 like TickTick */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Monthly check...</span>
            </div>
            <div className="text-2xl font-bold text-slate-800">{monthlyCheckIns} <span className="text-sm font-normal text-slate-400">Day</span></div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Total Check-Ins</span>
            </div>
            <div className="text-2xl font-bold text-slate-800">{totalCompletions} <span className="text-sm font-normal text-slate-400">Days</span></div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-3.5 h-3.5 rounded-full bg-amber-400 flex items-center justify-center">
                <span className="text-[8px] text-white font-bold">%</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Monthly chec...</span>
            </div>
            <div className="text-2xl font-bold text-slate-800">{monthlyPercentage} <span className="text-sm font-normal text-slate-400">%</span></div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 mb-1">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Current Str...</span>
            </div>
            <div className="text-2xl font-bold text-slate-800">{currentStreak} <span className="text-sm font-normal text-slate-400">Day</span></div>
          </div>
        </div>

        {/* Month Calendar - BLUE checkmarks for completed */}
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>
            <h3 className="font-bold text-slate-800">{format(viewMonth, 'MMMM yyyy')}</h3>
            <button
              onClick={() => setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-slate-400 py-2">{d}</div>
            ))}

            {/* Empty cells for start of month */}
            {Array.from({ length: viewMonthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {monthDays.map(day => {
              const isLogged = monthLogs.some(l => isSameDay(new Date(l.date), day) && l.completed);
              const isFuture = day > new Date();
              const isTodayDate = isToday(day);

              return (
                <Tooltip key={day.toISOString()}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleToggleDay(day)}
                      disabled={isFuture || logMutation.isPending}
                      className={cn(
                        "aspect-square rounded-full flex items-center justify-center text-xs font-medium transition-all relative",
                        isTodayDate && !isLogged && "ring-2 ring-blue-400 ring-offset-1",
                        !isFuture && !isLogged && "hover:bg-slate-100 cursor-pointer",
                        isFuture && "opacity-30 cursor-not-allowed",
                        isLogged ? "text-white" : "text-slate-600"
                      )}
                    >
                      {/* BLUE background for completed days */}
                      {isLogged ? (
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shadow-sm">
                          <Check className="w-4 h-4 text-white" strokeWidth={3} />
                        </div>
                      ) : (
                        <span>{format(day, 'd')}</span>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {format(day, "EEEE, MMM d")}
                    {isLogged ? " ✓" : !isFuture ? " - Click to mark" : ""}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-4">Click on dates to mark/unmark</p>
        </div>

        {/* Habit Log Section */}
        <div>
          <h3 className="font-bold text-slate-800 mb-2">Habit Log on {format(viewMonth, 'MMMM')}</h3>
          <p className="text-sm text-slate-400 italic">No check-in thoughts to share this month yet</p>
        </div>
      </div>
    </motion.div>
  );
}
