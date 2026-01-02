import { useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";
import { format, parseISO } from "date-fns";
import { CheckCircle2, Loader2, AlertCircle, ChevronLeft, ChevronRight, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Task } from "@/types/index";

// Animation variants for smooth week transitions
const weekVariants = {
  enter: {
    opacity: 0,
  },
  center: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
  },
};

interface DailyLog {
  date: string;
  dayName: string;
  tasks: Task[];
  count: number;
}

interface WeeklyReportData {
  startOfWeek: string;
  endOfWeek: string;
  totalCompleted: number;
  dailyLogs: DailyLog[];
}

const Reports = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [direction, setDirection] = useState(0);

  const { data, isLoading, isPlaceholderData, error } = useQuery<WeeklyReportData>({
    queryKey: ["reports", "weekly", currentDate.toISOString()],
    queryFn: () => dashboardService.getWeeklyReport(currentDate.toISOString()),
    retry: 1,
    placeholderData: keepPreviousData,
  });

  const navigateWeek = useCallback((dir: 'prev' | 'next') => {
    setDirection(dir === 'next' ? 1 : -1);
    const newDate = new Date(currentDate);
    if (dir === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  }, [currentDate]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
     // Fallback UI or empty state
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full text-slate-400">
           <AlertCircle className="w-10 h-10 mb-2" />
           <p>Failed to load report data</p>
        </div>
      </DashboardLayout>
    );
  }

  const startDate = format(parseISO(data.startOfWeek), "MMM d");
  const endDate = format(parseISO(data.endOfWeek), "MMM d, yyyy");

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex items-start justify-between">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Weekly Report</h1>
                <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
                        <button
                          onClick={() => navigateWeek('prev')}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600 transition-all active:scale-95"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="min-w-[160px] text-center overflow-hidden">
                          <AnimatePresence mode="wait" custom={direction}>
                            <motion.span
                              key={currentDate.toISOString()}
                              custom={direction}
                              variants={weekVariants}
                              initial="enter"
                              animate="center"
                              exit="exit"
                              transition={{ duration: 0.2 }}
                              className="block text-sm font-medium px-3 text-slate-700"
                            >
                              {startDate} - {endDate}
                            </motion.span>
                          </AnimatePresence>
                        </div>
                        <button
                          onClick={() => navigateWeek('next')}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600 transition-all active:scale-95"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="flex gap-4">
                 {/* Summary Stats Cards like in image */}
                 <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 min-w-[200px]">
                     <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                         <CheckCircle2 className="w-5 h-5" />
                     </div>
                     <div>
                         <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Weekly</p>
                         <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-slate-900">{data.totalCompleted}</span>
                            <span className="text-sm text-slate-500">tasks</span>
                         </div>
                     </div>
                 </div>

                 <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 min-w-[200px]">
                     <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                         <div className="w-5 h-5 flex items-center justify-center font-bold text-xs">%</div>
                     </div>
                     <div>
                         <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Completion</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-slate-900">92%</span>
                            <span className="text-xs text-emerald-500 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-full">+12%</span>
                         </div>
                     </div>
                 </div>
            </div>
        </div>

        {/* Columnar Schedule View */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
             <div className="flex items-center justify-between mb-6">
                 <h2 className="text-lg font-bold text-slate-900">Weekly Activity</h2>
                 <div className="flex gap-2">
                     <span className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-500"></span>
                     <span className="text-xs text-slate-500">Completed Task</span>
                 </div>
             </div>
             
             <AnimatePresence mode="wait" custom={direction}>
               <motion.div
                 key={currentDate.toISOString()}
                 custom={direction}
                 variants={weekVariants}
                 initial="enter"
                 animate="center"
                 exit="exit"
                 transition={{ type: "spring", stiffness: 300, damping: 30 }}
                 className="grid grid-cols-7 gap-4 min-h-[400px]"
               >
                 {data.dailyLogs.map((log, index) => (
                     <motion.div
                       key={log.date}
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: index * 0.05 }}
                       className="flex flex-col h-full group"
                     >
                         {/* Header Date */}
                         <div className={cn(
                             "text-center py-3 rounded-t-xl mb-2 transition-colors",
                             log.count > 0 ? "bg-indigo-50/50" : "bg-transparent"
                         )}>
                             <p className="text-xs font-bold text-slate-400 uppercase">{log.dayName}</p>
                             <p className={cn(
                                 "text-lg font-bold mt-1", 
                                 log.count > 0 ? "text-indigo-600" : "text-slate-900" 
                             )}>{format(parseISO(log.date), "d")}</p>
                         </div>
                         
                         {/* Column Content */}
                         <div className="flex-1 bg-slate-50/50 rounded-xl p-2 space-y-2 border border-slate-100 group-hover:border-indigo-100 transition-colors">
                             {log.tasks.length > 0 ? (
                                 log.tasks.map(task => (
                                     <div key={task._id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer group/task">
                                         <div className="flex justify-between items-start mb-1">
                                             <span className={cn(
                                                 "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide",
                                                 task.project ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-500"
                                             )}>
                                                 {task.project || "No Project"}
                                             </span>
                                             {task.updatedAt && (
                                                <span className="text-[10px] text-slate-300 font-mono">
                                                    {format(parseISO(task.updatedAt), "HH:mm")}
                                                </span>
                                             )}
                                         </div>
                                         <p className="text-xs font-semibold text-slate-700 line-clamp-2 leading-relaxed mb-2 group-hover/task:text-indigo-700 transition-colors">
                                             {task.title}
                                         </p>
                                         <div className="flex items-center gap-1">
                                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                              <span className="text-[10px] text-emerald-600 font-medium">Done</span>
                                         </div>
                                     </div>
                                 ))
                             ) : (
                                 <div className="h-full flex items-center justify-center">
                                     <p className="text-[10px] text-slate-300 font-medium italic">No activity</p>
                                 </div>
                             )}
                         </div>
                     </motion.div>
                 ))}
               </motion.div>
             </AnimatePresence>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default Reports;
