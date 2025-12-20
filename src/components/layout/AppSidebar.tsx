import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Sparkles,
  CheckSquare,
  Inbox,
  Calendar,
  BarChart3,
  Settings,
  Plus,
} from "lucide-react";
import { currentUser } from "@/data/mockData";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: CheckSquare, label: "My tasks", path: "/tasks" },
  { icon: Calendar, label: "Calendar", path: "/calendar" },
  { icon: BarChart3, label: "Reports & Analytics", path: "/analytics" },
];

const AppSidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-56 h-screen bg-sidebar border-r border-sidebar-border flex flex-col sticky top-0">
      {/* User Profile */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-9 h-9 rounded-full object-cover"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green rounded-full border-2 border-sidebar" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-foreground truncate">
              {currentUser.name}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {currentUser.status}
            </p>
          </div>
          <button className="text-muted-foreground hover:text-foreground">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn("nav-item", isActive && "active")}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* My Projects Section */}
        <div className="pt-6">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              My Projects
            </span>
            <button className="text-xs text-accent font-medium hover:underline flex items-center gap-1">
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>
        </div>
      </nav>

      {/* Settings */}
      <div className="p-3 border-t border-sidebar-border">
        <Link to="/settings" className="nav-item">
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
};

export default AppSidebar;
