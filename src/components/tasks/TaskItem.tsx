import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { Task } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  index: number;
}

const TaskItem = ({ task, onToggle, index }: TaskItemProps) => {
  const [isChecked, setIsChecked] = useState(task.completed);

  const handleToggle = () => {
    setIsChecked(!isChecked);
    setTimeout(() => onToggle(task.id), 150);
  };

  const priorityClasses = {
    high: 'priority-high',
    medium: 'priority-medium',
    low: 'priority-low',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors group"
    >
      <button
        onClick={handleToggle}
        className={cn(
          'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200',
          isChecked
            ? 'bg-primary border-primary scale-95'
            : 'border-muted-foreground/30 hover:border-primary hover:scale-105'
        )}
      >
        <AnimatePresence>
          {isChecked && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Check className="w-3 h-3 text-primary-foreground" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      <span
        className={cn(
          'flex-1 text-sm transition-all duration-300',
          isChecked && 'line-through text-muted-foreground'
        )}
      >
        {task.name}
      </span>

      <span className={cn('priority-badge', priorityClasses[task.priority])}>
        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
      </span>
    </motion.div>
  );
};

export default TaskItem;
