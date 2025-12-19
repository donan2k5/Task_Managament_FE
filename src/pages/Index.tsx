import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronDown, Plus, MoreHorizontal, Expand, FileText, Clock, Bell } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { tasks, projects, goals, upcomingEvents, currentUser, calendarDays, reminders } from '@/data/mockData';
import { cn } from '@/lib/utils';

const TaskSection = ({ 
  title, 
  status, 
  tasks: sectionTasks, 
  defaultOpen = true 
}: { 
  title: string; 
  status: string;
  tasks: typeof tasks;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const filteredTasks = sectionTasks.filter(t => t.status === status);
  
  const statusClass = {
    'in-progress': 'status-progress',
    'todo': 'status-todo',
    'upcoming': 'status-upcoming',
  }[status] || 'status-todo';

  return (
    <div className="mb-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full text-left py-2"
      >
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", !isOpen && "-rotate-90")} />
        <span className={cn("status-badge", statusClass)}>{title}</span>
        <span className="text-sm text-muted-foreground">• {filteredTasks.length} tasks</span>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-b border-border py-2 px-4 grid grid-cols-[1fr,80px,80px] text-xs text-muted-foreground">
              <span>Name</span>
              <span>Priority</span>
              <span>Due date</span>
            </div>
            {filteredTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="grid grid-cols-[1fr,80px,80px] items-center py-3 px-4 hover:bg-muted/30 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-sm",
                    task.priority === 'high' ? 'bg-cyan' : 
                    task.priority === 'medium' ? 'bg-blue' : 'bg-muted-foreground/30'
                  )} />
                  <span className="text-sm text-foreground">{task.name}</span>
                </div>
                <span className={cn("priority-badge text-xs", `priority-${task.priority}`)}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
                <span className={cn(
                  "text-sm",
                  task.dueDate === 'Today' ? 'text-accent font-medium' : 'text-muted-foreground'
                )}>
                  {task.dueDate}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Index = () => {
  const today = new Date();
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'long', day: 'numeric' };
  const formattedDate = today.toLocaleDateString('en-US', dateOptions);

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <p className="text-sm text-muted-foreground mb-1">{formattedDate}</p>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-0.5">
                Hello, {currentUser.name.split(' ')[0]}
              </h1>
              <p className="text-lg gradient-text font-medium">
                How can I help you today?
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button className="action-chip action-chip-primary">
                <Sparkles className="w-4 h-4" />
                Ask AI
              </button>
              <button className="action-chip action-chip-outline">Get tasks updates</button>
              <button className="action-chip action-chip-outline">Create workspace</button>
              <button className="action-chip action-chip-outline">Connect apps</button>
            </div>
          </div>
        </motion.header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Left Column - Tasks & Goals */}
          <div className="lg:col-span-3 space-y-5">
            {/* My Tasks Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="dashboard-card"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-base font-semibold text-foreground">My Tasks</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                    <Expand className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <TaskSection title="IN PROGRESS" status="in-progress" tasks={tasks} />
              <TaskSection title="TO DO" status="todo" tasks={tasks} defaultOpen={false} />
              <TaskSection title="UPCOMING" status="upcoming" tasks={tasks} defaultOpen={false} />
              
              <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-2">
                <Plus className="w-4 h-4" />
                Add task
              </button>
            </motion.div>

            {/* My Goals Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="dashboard-card"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded-full bg-violet-light flex items-center justify-center">
                  <span className="text-xs">🎯</span>
                </div>
                <h3 className="text-base font-semibold text-foreground">My Goals</h3>
              </div>

              <div className="space-y-4">
                {goals.map((goal, index) => (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{goal.name}</p>
                      <p className="text-xs text-muted-foreground">{goal.project} • {goal.category}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="w-24 progress-bar">
                        <div 
                          className="progress-bar-fill" 
                          style={{ width: `${goal.progress}%`, backgroundColor: goal.color }}
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground w-10 text-right">{goal.progress}%</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Projects Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="dashboard-card"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">📁</span>
                  <h3 className="text-base font-semibold text-foreground">Projects</h3>
                </div>
                <button className="text-xs text-muted-foreground flex items-center gap-1">
                  Recents <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-border hover:border-primary/30 hover:bg-muted/30 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <Plus className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Create new project</span>
                </button>
                
                {projects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div 
                      className="project-icon text-lg"
                      style={{ backgroundColor: `${project.color}20` }}
                    >
                      {project.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{project.name}</p>
                      <p className="text-xs text-muted-foreground">{project.tasksCount} tasks • {project.teammates} teammates</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Calendar Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="dashboard-card"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">📅</span>
                  <h3 className="text-base font-semibold text-foreground">Calendar</h3>
                </div>
                <button className="text-sm text-muted-foreground flex items-center gap-1">
                  July <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center justify-between mb-4">
                <button className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground">
                  <ChevronDown className="w-4 h-4 rotate-90" />
                </button>
                <div className="flex gap-1">
                  {calendarDays.map((day) => (
                    <div key={day.day} className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">{day.name}</p>
                      <div className={cn("calendar-day", day.isToday ? "calendar-day-active" : "calendar-day-inactive")}>
                        {String(day.day).padStart(2, '0')}
                      </div>
                    </div>
                  ))}
                </div>
                <button className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground">
                  <ChevronDown className="w-4 h-4 -rotate-90" />
                </button>
              </div>

              {/* Meeting Card */}
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-foreground">{upcomingEvents[0].title}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {upcomingEvents[0].date} • {upcomingEvents[0].startTime} - {upcomingEvents[0].endTime}
                      </span>
                    </div>
                  </div>
                  <button className="p-1 hover:bg-muted rounded transition-colors">
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-card rounded-lg border border-border">
                    <div className="w-4 h-4 rounded bg-gradient-to-r from-blue to-green" />
                    <span className="text-sm">Google Meet</span>
                  </div>
                  <div className="flex -space-x-2">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-violet to-pink border-2 border-card" />
                    ))}
                    <div className="w-7 h-7 rounded-full bg-cyan text-xs font-medium flex items-center justify-center border-2 border-card text-accent-foreground">
                      +2
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Reminders Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="dashboard-card"
            >
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-base font-semibold text-foreground">Reminders</h3>
              </div>

              <button className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <ChevronDown className="w-3 h-3" />
                Today • {reminders.length}
              </button>

              <div className="space-y-3">
                {reminders.map((reminder) => (
                  <div key={reminder.id} className="flex items-start gap-3 group">
                    <p className="text-sm text-foreground flex-1">{reminder.text}</p>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 hover:bg-muted rounded">
                        <Bell className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button className="p-1 hover:bg-muted rounded">
                        <span className="w-3.5 h-3.5 text-muted-foreground">🗑</span>
                      </button>
                    </div>
                  </div>
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
