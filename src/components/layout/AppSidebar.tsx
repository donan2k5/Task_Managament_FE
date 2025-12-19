import { Link, useLocation } from 'react-router-dom';
import { Home, CheckSquare, Calendar, FolderKanban, BarChart3, Settings } from 'lucide-react';
import { currentUser, projects } from '@/data/mockData';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: CheckSquare, label: 'Today Tasks', path: '/tasks' },
  { icon: Calendar, label: 'Schedule', path: '/schedule' },
  { icon: FolderKanban, label: 'Projects', path: '/projects' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
];

const AppSidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col sticky top-0">
      {/* User Profile */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-sidebar" />
          </div>
          <div>
            <p className="font-medium text-foreground">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{currentUser.status}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn('nav-item', isActive && 'active')}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Projects */}
      <div className="px-3 pb-3">
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            My Projects
          </span>
          <button className="text-xs text-primary font-medium hover:underline">
            + Add
          </button>
        </div>
        <div className="space-y-1">
          {projects.slice(0, 3).map((project) => (
            <Link
              key={project.id}
              to={`/projects`}
              className="nav-item py-2"
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: project.color }}
              />
              <span className="text-sm truncate">{project.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="p-3 border-t border-sidebar-border">
        <Link to="/settings" className="nav-item">
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
};

export default AppSidebar;
