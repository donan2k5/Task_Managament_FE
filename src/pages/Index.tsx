import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, ListTodo } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TaskItem from '@/components/tasks/TaskItem';
import ProjectCard from '@/components/projects/ProjectCard';
import WeeklyStatsChart from '@/components/charts/WeeklyStatsChart';
import SchedulePreview from '@/components/schedule/SchedulePreview';
import { todayTasks, projects, upcomingEvents, currentUser } from '@/data/mockData';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [tasks, setTasks] = useState(todayTasks);

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const today = new Date();
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  };
  const formattedDate = today.toLocaleDateString('en-US', dateOptions);

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <p className="text-sm text-muted-foreground mb-1">{formattedDate}</p>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">
                Hello, {currentUser.name.split(' ')[0]} 👋
              </h1>
              <p className="text-muted-foreground">
                Here's what you need to focus on today
              </p>
            </div>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
          </div>
        </motion.header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Tasks & Weekly Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today Tasks Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="dashboard-card"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ListTodo className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Today Tasks</h3>
                    <p className="text-sm text-muted-foreground">
                      {completedCount} of {totalCount} completed
                    </p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-border">
                {tasks.map((task, index) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggleTask}
                    index={index}
                  />
                ))}
              </div>

              <button className="w-full mt-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                + Add task
              </button>
            </motion.div>

            {/* Weekly Stats */}
            <WeeklyStatsChart />
          </div>

          {/* Right Column - Schedule & Projects */}
          <div className="space-y-6">
            {/* Schedule Preview */}
            <SchedulePreview events={upcomingEvents} />

            {/* Projects */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="dashboard-card"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Projects</h3>
                <button className="text-sm text-primary font-medium hover:underline">
                  View all
                </button>
              </div>

              <div className="space-y-4">
                {projects.slice(0, 3).map((project, index) => (
                  <ProjectCard key={project.id} project={project} index={index} />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
