import DashboardLayout from "@/components/layout/DashboardLayout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { TasksCard } from "@/components/dashboard/TasksCard";
import { GoalsCard } from "@/components/dashboard/GoalsCard";
import { ProjectsCard } from "@/components/dashboard/ProjectsCard";
import { CalendarCard } from "@/components/dashboard/CalendarCard";
import { useDashboard } from "@/hooks/useDashboard";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15, // Mỗi phần tử hiện cách nhau 0.15s
      when: "beforeChildren",
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
};

const Index = () => {
  const { data, loading, addProject } = useDashboard();

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Loading State đẹp hơn
  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
          <span className="text-slate-400 text-sm font-medium animate-pulse">
            Gathering your data...
          </span>
        </div>
      </div>
    );

  if (!data)
    return (
      <div className="text-center p-10 text-red-500">Failed to load data</div>
    );

  return (
    <DashboardLayout>
      <motion.div
        className="p-6 max-w-7xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* HEADER */}
        <motion.div variants={itemVariants}>
          <DashboardHeader
            userName={data.user?.name || "User"}
            date={formattedDate}
            stats={data.headerStats}
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-3 space-y-6">
            <motion.div variants={itemVariants}>
              <TasksCard tasks={data.tasks} />
            </motion.div>
            <motion.div variants={itemVariants}>
              <GoalsCard goals={data.goals} />
            </motion.div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div variants={itemVariants}>
              <CalendarCard events={data.upcomingEvents} />
            </motion.div>
            <motion.div variants={itemVariants}>
              {/* Truyền props onAddProject */}
              <ProjectsCard
                projects={data.projects}
                onAddProject={addProject}
              />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Index;
