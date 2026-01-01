import { useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  CheckCircle2,
  Flame,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Award,
  Zap,
  Brain,
  Coffee,
  Moon,
  Sun,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

// Mock Data
const weeklyData = [
  { day: "Mon", tasks: 8, hours: 6.5, focus: 85 },
  { day: "Tue", tasks: 12, hours: 7.2, focus: 92 },
  { day: "Wed", tasks: 6, hours: 5.0, focus: 78 },
  { day: "Thu", tasks: 15, hours: 8.5, focus: 95 },
  { day: "Fri", tasks: 10, hours: 6.8, focus: 88 },
  { day: "Sat", tasks: 4, hours: 3.2, focus: 72 },
  { day: "Sun", tasks: 2, hours: 1.5, focus: 65 },
];

const monthlyTrend = [
  { week: "Week 1", completed: 32, created: 38 },
  { week: "Week 2", completed: 45, created: 42 },
  { week: "Week 3", completed: 38, created: 35 },
  { week: "Week 4", completed: 52, created: 48 },
];

const projectStats = [
  { name: "Axis App", tasks: 24, completed: 18, color: "bg-violet-500", progress: 75 },
  { name: "Marketing", tasks: 15, completed: 12, color: "bg-blue-500", progress: 80 },
  { name: "Research", tasks: 8, completed: 8, color: "bg-emerald-500", progress: 100 },
  { name: "Personal", tasks: 12, completed: 6, color: "bg-amber-500", progress: 50 },
  { name: "Learning", tasks: 6, completed: 4, color: "bg-rose-500", progress: 67 },
];

const categoryBreakdown = [
  { name: "Development", percentage: 35, color: "bg-violet-500", hours: 14.2 },
  { name: "Meetings", percentage: 20, color: "bg-blue-500", hours: 8.1 },
  { name: "Planning", percentage: 18, color: "bg-emerald-500", hours: 7.3 },
  { name: "Research", percentage: 15, color: "bg-amber-500", hours: 6.1 },
  { name: "Admin", percentage: 12, color: "bg-slate-400", hours: 4.9 },
];

const productivityByHour = [
  { hour: "6AM", value: 20 },
  { hour: "7AM", value: 35 },
  { hour: "8AM", value: 65 },
  { hour: "9AM", value: 90 },
  { hour: "10AM", value: 95 },
  { hour: "11AM", value: 85 },
  { hour: "12PM", value: 50 },
  { hour: "1PM", value: 45 },
  { hour: "2PM", value: 75 },
  { hour: "3PM", value: 88 },
  { hour: "4PM", value: 82 },
  { hour: "5PM", value: 70 },
  { hour: "6PM", value: 55 },
  { hour: "7PM", value: 40 },
  { hour: "8PM", value: 30 },
];

const achievements = [
  { title: "Early Bird", desc: "Complete 5 tasks before 9 AM", icon: Sun, unlocked: true, color: "text-amber-500" },
  { title: "Focus Master", desc: "3 hours deep work streak", icon: Brain, unlocked: true, color: "text-violet-500" },
  { title: "Streak King", desc: "7-day completion streak", icon: Flame, unlocked: true, color: "text-orange-500" },
  { title: "Night Owl", desc: "Work past midnight productively", icon: Moon, unlocked: false, color: "text-slate-400" },
  { title: "Overachiever", desc: "150% of weekly goal", icon: Award, unlocked: false, color: "text-slate-400" },
];

// Components
const StatCard = ({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  subtitle,
  gradient
}: {
  title: string;
  value: string | number;
  change: string;
  changeType: "up" | "down" | "neutral";
  icon: any;
  subtitle?: string;
  gradient: string;
}) => (
  <motion.div
    variants={itemVariants}
    className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-lg transition-shadow"
  >
    <div className={cn("absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-10", gradient)} />
    <div className="relative">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className={cn("p-3 rounded-xl", gradient)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-4">
        {changeType === "up" && <TrendingUp className="w-4 h-4 text-emerald-500" />}
        {changeType === "down" && <TrendingDown className="w-4 h-4 text-rose-500" />}
        <span className={cn(
          "text-sm font-semibold",
          changeType === "up" && "text-emerald-600",
          changeType === "down" && "text-rose-600",
          changeType === "neutral" && "text-slate-500"
        )}>
          {change}
        </span>
        <span className="text-xs text-slate-400">vs last week</span>
      </div>
    </div>
  </motion.div>
);

const WeeklyChart = () => {
  const maxTasks = Math.max(...weeklyData.map(d => d.tasks));

  return (
    <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Weekly Overview</h3>
          <p className="text-xs text-slate-500 mt-0.5">Tasks completed per day</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" />
            <span className="text-slate-600">Tasks</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" />
            <span className="text-slate-600">Focus %</span>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between gap-2 h-48">
        {weeklyData.map((day, i) => (
          <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
            <div className="relative w-full flex flex-col items-center gap-1">
              {/* Focus indicator */}
              <div
                className="w-2 rounded-full bg-gradient-to-t from-emerald-400 to-teal-500 transition-all duration-500"
                style={{ height: `${day.focus * 1.2}px` }}
              />
              {/* Task bar */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(day.tasks / maxTasks) * 120}px` }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="w-full max-w-[40px] rounded-xl bg-gradient-to-t from-violet-500 to-indigo-400 relative group cursor-pointer"
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {day.tasks} tasks
                </div>
              </motion.div>
            </div>
            <span className="text-xs font-medium text-slate-500">{day.day}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const ProductivityHeatmap = () => {
  const maxValue = Math.max(...productivityByHour.map(h => h.value));

  return (
    <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Peak Performance Hours</h3>
          <p className="text-xs text-slate-500 mt-0.5">Your productivity throughout the day</p>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-lg">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-semibold text-amber-700">Peak: 10 AM</span>
        </div>
      </div>

      <div className="flex items-end gap-1 h-32">
        {productivityByHour.map((hour, i) => (
          <motion.div
            key={hour.hour}
            initial={{ height: 0 }}
            animate={{ height: `${(hour.value / maxValue) * 100}%` }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className={cn(
              "flex-1 rounded-t-lg cursor-pointer transition-all hover:opacity-80",
              hour.value >= 90 ? "bg-gradient-to-t from-emerald-500 to-emerald-400" :
              hour.value >= 70 ? "bg-gradient-to-t from-blue-500 to-blue-400" :
              hour.value >= 50 ? "bg-gradient-to-t from-amber-500 to-amber-400" :
              "bg-gradient-to-t from-slate-300 to-slate-200"
            )}
            title={`${hour.hour}: ${hour.value}% productivity`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-slate-400">
        <span>6 AM</span>
        <span>12 PM</span>
        <span>8 PM</span>
      </div>
    </motion.div>
  );
};

const ProjectBreakdown = () => (
  <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Project Progress</h3>
        <p className="text-xs text-slate-500 mt-0.5">Completion rate by project</p>
      </div>
      <PieChart className="w-5 h-5 text-slate-400" />
    </div>

    <div className="space-y-4">
      {projectStats.map((project, i) => (
        <motion.div
          key={project.name}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", project.color)} />
              <span className="text-sm font-medium text-slate-700">{project.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{project.completed}/{project.tasks}</span>
              <span className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-full",
                project.progress === 100 ? "bg-emerald-50 text-emerald-600" :
                project.progress >= 70 ? "bg-blue-50 text-blue-600" :
                "bg-amber-50 text-amber-600"
              )}>
                {project.progress}%
              </span>
            </div>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${project.progress}%` }}
              transition={{ delay: i * 0.1 + 0.3, duration: 0.6 }}
              className={cn("h-full rounded-full", project.color)}
            />
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

const CategoryDonut = () => (
  <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Time by Category</h3>
        <p className="text-xs text-slate-500 mt-0.5">This week's breakdown</p>
      </div>
      <Clock className="w-5 h-5 text-slate-400" />
    </div>

    {/* Donut Chart Visual */}
    <div className="relative w-40 h-40 mx-auto mb-6">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        {categoryBreakdown.reduce((acc, cat, i) => {
          const prevPercentage = categoryBreakdown.slice(0, i).reduce((sum, c) => sum + c.percentage, 0);
          const strokeDasharray = `${cat.percentage} ${100 - cat.percentage}`;
          const strokeDashoffset = -prevPercentage;

          acc.push(
            <circle
              key={cat.name}
              cx="50"
              cy="50"
              r="40"
              fill="none"
              strokeWidth="12"
              className={cat.color.replace("bg-", "stroke-")}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dasharray 0.5s ease" }}
            />
          );
          return acc;
        }, [] as JSX.Element[])}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-900">40.6h</span>
        <span className="text-xs text-slate-500">Total</span>
      </div>
    </div>

    <div className="space-y-2">
      {categoryBreakdown.map((cat) => (
        <div key={cat.name} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full", cat.color)} />
            <span className="text-slate-600">{cat.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400">{cat.hours}h</span>
            <span className="font-semibold text-slate-700 w-10 text-right">{cat.percentage}%</span>
          </div>
        </div>
      ))}
    </div>
  </motion.div>
);

const MonthlyTrend = () => {
  const maxVal = Math.max(...monthlyTrend.flatMap(w => [w.completed, w.created]));

  return (
    <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Monthly Trend</h3>
          <p className="text-xs text-slate-500 mt-0.5">Tasks created vs completed</p>
        </div>
        <Activity className="w-5 h-5 text-slate-400" />
      </div>

      <div className="space-y-4">
        {monthlyTrend.map((week, i) => (
          <div key={week.week} className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">{week.week}</span>
              <div className="flex items-center gap-4">
                <span className="text-emerald-600">{week.completed} done</span>
                <span className="text-blue-600">{week.created} new</span>
              </div>
            </div>
            <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(week.created / maxVal) * 100}%` }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="absolute inset-y-0 left-0 bg-blue-200 rounded-full"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(week.completed / maxVal) * 100}%` }}
                transition={{ delay: i * 0.15 + 0.2, duration: 0.5 }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const Achievements = () => (
  <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Achievements</h3>
        <p className="text-xs text-slate-500 mt-0.5">3 of 5 unlocked</p>
      </div>
      <Award className="w-5 h-5 text-amber-500" />
    </div>

    <div className="grid grid-cols-5 gap-3">
      {achievements.map((achievement, i) => (
        <motion.div
          key={achievement.title}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.1, type: "spring" }}
          className={cn(
            "flex flex-col items-center p-3 rounded-xl transition-all cursor-pointer group",
            achievement.unlocked
              ? "bg-gradient-to-br from-amber-50 to-orange-50 hover:shadow-md"
              : "bg-slate-50 opacity-50"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center mb-2",
            achievement.unlocked ? "bg-white shadow-sm" : "bg-slate-100"
          )}>
            <achievement.icon className={cn("w-5 h-5", achievement.color)} />
          </div>
          <span className="text-[10px] font-bold text-center text-slate-700 leading-tight">
            {achievement.title}
          </span>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

const StreakCard = () => (
  <motion.div
    variants={itemVariants}
    className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-rose-500 to-pink-600 rounded-2xl p-6 text-white"
  >
    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16" />

    <div className="relative">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-8 h-8" />
        <span className="text-sm font-semibold opacity-90">Current Streak</span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-5xl font-black">12</span>
        <span className="text-xl font-medium opacity-80">days</span>
      </div>

      <p className="text-sm opacity-75 mt-2">
        Your best streak: <span className="font-bold">18 days</span>
      </p>

      <div className="flex gap-1 mt-4">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
              i < 5 ? "bg-white/30" : "bg-white/10"
            )}
          >
            {i < 5 ? <CheckCircle2 className="w-4 h-4" /> : ["S", "S"][i - 5]}
          </div>
        ))}
      </div>
    </div>
  </motion.div>
);

// Main Component
const Reports = () => {
  const [timeRange, setTimeRange] = useState("This Week");

  return (
    <DashboardLayout>
      <motion.div
        className="p-6 max-w-[1600px] mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Analytics & Reports</h1>
            <p className="text-sm text-slate-500 mt-1">Track your productivity and achievements</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <Calendar className="w-4 h-4" />
            {timeRange}
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Tasks Completed"
            value="57"
            change="+23%"
            changeType="up"
            icon={CheckCircle2}
            subtitle="8 tasks today"
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          />
          <StatCard
            title="Focus Time"
            value="32.5h"
            change="+12%"
            changeType="up"
            icon={Brain}
            subtitle="4.6h avg/day"
            gradient="bg-gradient-to-br from-violet-500 to-purple-600"
          />
          <StatCard
            title="Productivity"
            value="87%"
            change="+5%"
            changeType="up"
            icon={Zap}
            subtitle="Above average"
            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          />
          <StatCard
            title="Goals Met"
            value="4/5"
            change="-1"
            changeType="down"
            icon={Target}
            subtitle="1 in progress"
            gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            <WeeklyChart />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProductivityHeatmap />
              <MonthlyTrend />
            </div>
            <Achievements />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <StreakCard />
            <ProjectBreakdown />
            <CategoryDonut />
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Reports;
