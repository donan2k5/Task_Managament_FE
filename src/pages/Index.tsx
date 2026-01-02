import DashboardLayout from "@/components/layout/DashboardLayout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { TasksCard } from "@/components/dashboard/TasksCard";
import { OverdueTasksCard } from "@/components/dashboard/OverdueTasksCard";
import { ProjectsCard } from "@/components/dashboard/ProjectsCard";
import { CalendarCard } from "@/components/dashboard/CalendarCard";
import { useDashboard } from "@/hooks/useDashboard";
import { DashboardSkeleton } from "@/components/skeletons";
import { motion, Variants } from "framer-motion";

// --- ANIMATION VARIANTS ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      when: "beforeChildren",
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "tween", duration: 0.2, ease: "easeOut" },
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

  // Loading State with Skeleton
  if (loading)
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    );

  if (!data)
    return (
      <div className="text-center p-10 text-red-500">Failed to load data</div>
    );

  return (
    <DashboardLayout>
      <motion.div
        className="p-4 w-full"
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

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-3 space-y-4 md:space-y-6">
            <motion.div variants={itemVariants}>
              <TasksCard tasks={data.tasks} />
            </motion.div>
            <motion.div variants={itemVariants}>
              <OverdueTasksCard tasks={data.overdueTasks || []} />
            </motion.div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <motion.div variants={itemVariants}>
              <CalendarCard />
            </motion.div>
            <motion.div variants={itemVariants}>
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
