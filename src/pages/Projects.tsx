import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, MoreHorizontal } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { projects as projectsData, Project } from '@/data/mockData';
import { Button } from '@/components/ui/button';

const Projects = () => {
  const [projectList, setProjectList] = useState<(Project & { animatedProgress: number })[]>(
    projectsData.map((p) => ({ ...p, animatedProgress: 0 }))
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setProjectList((prev) =>
        prev.map((p) => ({ ...p, animatedProgress: p.progress }))
      );
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-start justify-between gap-4 flex-wrap"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Projects</h1>
            <p className="text-muted-foreground">Track progress across all your projects</p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </motion.header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projectList.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="dashboard-card group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div
                    className="project-icon text-xl"
                    style={{ backgroundColor: `${project.color}20` }}
                  >
                    {project.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{project.name}</h3>
                    <p className="text-sm text-muted-foreground">{project.teammates} teammates</p>
                  </div>
                </div>
                <button className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted transition-all">
                  <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Tasks: </span>
                    <span className="font-medium text-foreground">{project.tasksCount}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Progress: </span>
                    <span className="font-medium text-foreground">{project.progress}%</span>
                  </div>
                </div>

                <div className="progress-bar h-2">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${project.animatedProgress}%`,
                      background: project.color,
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {Math.round((project.progress / 100) * project.tasksCount)} of {project.tasksCount} tasks done
                  </span>
                  <button className="text-primary font-medium hover:underline">
                    View →
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: projectList.length * 0.1, duration: 0.4 }}
            className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Plus className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-muted-foreground">Create New Project</p>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Projects;
