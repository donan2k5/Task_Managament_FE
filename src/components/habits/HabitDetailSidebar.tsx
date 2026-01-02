"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { HabitWithStats, HabitLog } from '@/types/habit';
import { Button } from '@/components/ui/button';
import { X, Flame, CheckCircle2, Zap, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface HabitDetailSidebarProps {
  habitData: HabitWithStats;
  onClose: () => void;
}

export default function HabitDetailSidebar({ habitData, onClose }: HabitDetailSidebarProps) {
  const { habit, currentStreak, longestStreak } = habitData;
  const queryClient = useQueryClient();
  const [viewMonth, setViewMonth] = useState(new Date());
  const [direction, setDirection] = useState(0);

  const viewMonthStart = startOfMonth(viewMonth);
  const viewMonthEnd = endOfMonth(viewMonth);

  // Fetch full month logs for calendar view
  const { data: monthLogs = [] } = useQuery({
    queryKey: ['habit-logs', habit._id, format(viewMonthStart, 'yyyy-MM')],
    queryFn: async () => {
      const start = viewMonthStart.toISOString();
      const end = viewMonthEnd.toISOString();
      const res = await api.get<HabitLog[]>(`/habits/${habit._id}/logs?from=${start}&to=${end}`);
      return res.data;
    }
  });

  // Mutation for logging habit
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
      toast.success('Habit updated!');
    }
  });

  const monthDays = eachDayOfInterval({
    start: viewMonthStart,
    end: viewMonthEnd
  });

  const totalCheckIns = monthLogs.filter(l => l.completed).length;
  const completionRate = Math.round((totalCheckIns / monthDays.length) * 100) || 0;

  const navigateMonth = (dir: 'prev' | 'next') => {
    setDirection(dir === 'next' ? 1 : -1);
    setViewMonth(prev => dir === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
  };

  const handleToggleDay = (day: Date) => {
    const isFuture = day > new Date();
    if (isFuture) return;

    const isLogged = monthLogs.some(l => isSameDay(new Date(l.date), day) && l.completed);
    logMutation.mutate({ date: day, completed: !isLogged });
  };

  return (
    <div className="w-[350px] bg-white border-l border-slate-200 h-full flex flex-col shadow-xl z-20">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <span 
            className="text-2xl"
          >
            {habit.icon}
          </span>
          <h2 className="font-bold text-slate-800 truncate max-w-[200px]" title={habit.name}>{habit.name}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-slate-100 rounded-full">
          <X className="w-5 h-5 text-slate-400" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Streak Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-500 p-6 rounded-2xl text-white">
          <div className="absolute top-2 right-2 opacity-20">
            <Flame className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <Flame className="w-6 h-6" />
              </motion.div>
              <span className="text-sm font-semibold uppercase opacity-90">Current Streak</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-bold">{currentStreak}</span>
              <span className="text-lg opacity-80">days</span>
            </div>
            {longestStreak > 0 && (
              <div className="mt-2 text-sm opacity-80">
                Best: {longestStreak} days
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
             <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Monthly</span>
             </div>
             <div className="text-2xl font-bold text-slate-700">{completionRate}%</div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
             <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-blue-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">This Month</span>
             </div>
             <div className="text-2xl font-bold text-slate-700">{totalCheckIns}</div>
          </div>
        </div>

        {/* Calendar View */}
        <div>
           <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-500" />
              </button>
              <h3 className="font-bold text-slate-800">{format(viewMonth, 'MMMM yyyy')}</h3>
              <button
                onClick={() => navigateMonth('next')}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
           </div>

           <div className="grid grid-cols-7 gap-y-2 gap-x-1">
              {['S','M','T','W','T','F','S'].map((d, i) => (
                  <div key={i} className="text-center text-[10px] font-semibold text-slate-400 pb-2">{d}</div>
              ))}

              {/* Padding for start of month */}
              {Array.from({ length: viewMonthStart.getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} />
              ))}

              {monthDays.map(day => {
                  const isLogged = monthLogs.some(l => isSameDay(new Date(l.date), day) && l.completed);
                  const isFuture = day > new Date();
                  const isTodayDate = isToday(day);
                  const canMark = !isFuture;

                  return (
                      <button
                        key={day.toISOString()}
                        onClick={() => handleToggleDay(day)}
                        disabled={isFuture || logMutation.isPending}
                        className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium transition-all mx-auto",
                          isLogged ? "text-white shadow-md" : "bg-slate-50 text-slate-600",
                          isTodayDate && !isLogged && "ring-2 ring-indigo-400 ring-offset-1",
                          canMark && !isLogged && "hover:bg-slate-200 hover:scale-110 cursor-pointer",
                          isFuture && "opacity-30 cursor-not-allowed"
                        )}
                        style={{
                          backgroundColor: isLogged ? habit.color : undefined
                        }}
                        title={canMark ? (isLogged ? "Mark as incomplete" : "Mark as complete") : "Cannot mark future dates"}
                      >
                        {isLogged ? <Check className="w-4 h-4" /> : format(day, 'd')}
                      </button>
                  );
              })}
           </div>
           <p className="text-[10px] text-slate-400 text-center mt-3">Click on past dates to mark/unmark</p>
        </div>

        {/* Log / Notes (Placeholder) */}
        <div>
            <h3 className="font-bold text-slate-800 mb-2">Habit Log</h3>
            <p className="text-sm text-slate-400 italic">No notes added this month.</p>
        </div>

      </div>
    </div>
  );
}
