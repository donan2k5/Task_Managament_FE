import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, TrendingUp, CalendarDays, Zap } from "lucide-react";

interface DashboardHeaderProps {
  userName: string;
  date: string;
  stats: {
    totalHours: number;
    dailyAverage: number;
    trend: number;
    weeklyData: number[];
  };
}

export const DashboardHeader = ({
  userName,
  date,
  stats,
}: DashboardHeaderProps) => {
  // State lưu index cột đang hover
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const maxHours = Math.max(...stats.weeklyData, 1);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6"
    >
      {/* LEFT: Greeting */}
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2 font-medium">
          <CalendarDays className="w-4 h-4" />
          {date}
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-1">
          Hello, {userName} 👋
        </h1>
        <p className="text-slate-500">Ready for another productive day?</p>
      </div>

      {/* RIGHT: Stats Cards */}
      <div className="flex items-center gap-4">
        {/* CARD 1: WEEKLY FOCUS */}
        <div className="dashboard-card bg-white p-3 pr-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 min-w-[240px] h-[80px] overflow-visible relative z-10">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 shrink-0">
            <Zap className="w-5 h-5 fill-current" />
          </div>

          <div className="flex flex-col flex-1 h-full justify-center">
            <div className="flex justify-between items-end w-full h-full pb-1 gap-3">
              {/* Info Text */}
              <div className="mb-0.5 shrink-0">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">
                  Weekly
                </p>
                <p className="text-xl font-bold text-slate-900 leading-none">
                  {stats.totalHours}
                  <span className="text-xs text-slate-400 font-medium ml-0.5">
                    h
                  </span>
                </p>
              </div>

              {/* --- MINI CHART (All Purple) --- */}
              <div className="flex items-end justify-end gap-1.5 h-[40px] flex-1 relative">
                {stats.weeklyData.map((hours, index) => {
                  const heightPercent = (hours / maxHours) * 100;
                  const displayHeight = Math.max(heightPercent, 15);
                  const isHovered = hoveredIndex === index;

                  return (
                    <div
                      key={index}
                      className="relative flex items-end h-full group flex-1 justify-center"
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      {/* TOOLTIP */}
                      <AnimatePresence>
                        {isHovered && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none flex flex-col items-center">
                            <motion.div
                              initial={{ opacity: 0, y: 5, scale: 0.9 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.15 }}
                              className="bg-white px-2.5 py-1.5 rounded-lg shadow-xl border border-slate-100 flex flex-col items-center min-w-[48px] whitespace-nowrap"
                            >
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide leading-none mb-0.5">
                                {days[index]}
                              </span>
                              <span className="text-sm font-bold text-violet-600 leading-none">
                                {hours}h
                              </span>
                            </motion.div>
                            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-white -mt-[1px] drop-shadow-sm"></div>
                          </div>
                        )}
                      </AnimatePresence>

                      {/* BAR: Tím toàn tập */}
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${displayHeight}%` }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        className={`w-2 rounded-full cursor-pointer transition-all duration-200 ${
                          isHovered
                            ? "bg-violet-600 ring-2 ring-violet-100 scale-110" // Hover: Tím đậm nhất
                            : hours >= maxHours * 0.7
                            ? "bg-violet-400" // High: Tím vừa
                            : "bg-violet-200" // Low: Tím nhạt (thay vì xám)
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: DAILY AVG */}
        <div className="dashboard-card bg-white p-3 pr-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 min-w-[180px] h-[80px]">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">
              Daily Avg
            </p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-slate-900">
                {stats.dailyAverage}
                <span className="text-xs text-slate-400 font-medium ml-0.5">
                  h
                </span>
              </p>
              {stats.trend > 0 && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> {stats.trend}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
