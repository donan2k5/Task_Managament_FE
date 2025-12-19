import { motion } from 'framer-motion';
import { Project } from '@/data/mockData';
import { useEffect, useState } from 'react';

interface ProjectCardProps {
  project: Project;
  index: number;
}

const ProjectCard = ({ project, index }: ProjectCardProps) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(project.progress);
    }, 100 + index * 100);
    return () => clearTimeout(timer);
  }, [project.progress, index]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="dashboard-card cursor-pointer"
    >
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
          style={{ backgroundColor: project.color }}
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground truncate">{project.name}</h4>
          <p className="text-sm text-muted-foreground truncate">{project.description}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{project.tasksCount} tasks</span>
          <span className="font-medium text-foreground">{project.progress}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{
              width: `${animatedProgress}%`,
              background: project.color,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
