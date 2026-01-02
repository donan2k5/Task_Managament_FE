import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Sparkles,
  CheckSquare,
  Calendar,
  BarChart3,
  Settings,
  Timer,
  RefreshCw,
  Loader2,
  Target,
  PanelLeft,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProfileDialog } from "@/components/profile/ProfileDialog";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: CheckSquare, label: "My Tasks", path: "/tasks" },
  { icon: Calendar, label: "Calendar", path: "/calendar" },
  { icon: Target, label: "Habits", path: "/habits" },
  { icon: BarChart3, label: "Reports & Analytics", path: "/reports" },
  { icon: Timer, label: "Pomodoro", path: "/pomodoro" },
  { icon: Sparkles, label: "AI coming soon", path: "#", comingSoon: true },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const AppSidebar = () => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true); 
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, isSyncLoading, initializeSync } = useAuth();

  return (
    <>
      {/* Toggle Button - floating with transparency */}
      <button 
        onClick={() => setIsVisible(!isVisible)}
        className={cn(
             "fixed z-[60] bottom-4 transition-all duration-300 p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-black/5",
             isVisible ? "left-[75px] opacity-100" : "left-4 opacity-50 hover:opacity-100 bg-white/50 backdrop-blur-sm shadow-sm border border-slate-200/50"
        )}
        title={isVisible ? "Hide Sidebar" : "Show Sidebar"}
      >
          <PanelLeft className="w-5 h-5" />
      </button>

      <aside
        className={cn(
            "h-screen bg-white border-r border-slate-200 flex flex-col sticky top-0 z-50 flex-shrink-0 transition-all duration-300 overflow-hidden shadow-lg md:shadow-none",
            isVisible ? "w-[70px] opacity-100" : "w-0 opacity-0 border-none"
        )}
      >
        {/* User Profile */}
        <div className="p-2 pt-4 border-b border-slate-100 flex justify-center">
            <div 
                className="relative cursor-pointer group"
                onClick={() => setIsProfileOpen(true)}
            >
                {user?.avatar ? (
                    <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-slate-100 group-hover:border-indigo-200 transition-colors"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border-2 border-indigo-50 group-hover:border-indigo-200 transition-colors">
                        {user?.name?.charAt(0) || "U"}
                    </div>
                )}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
            </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-2 overflow-y-auto overflow-x-hidden no-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const content = (
              <div
                className={cn(
                  "flex items-center justify-center w-full aspect-square rounded-xl transition-all group relative",
                  isActive 
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" 
                    : item.comingSoon
                      ? "text-slate-300 cursor-not-allowed opacity-60"
                      : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.comingSoon && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                )}
              </div>
            );

            return (
              <Tooltip key={item.label} delayDuration={0}>
                <TooltipTrigger asChild>
                  {item.comingSoon ? (
                    content
                  ) : (
                    <Link to={item.path}>{content}</Link>
                  )}
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium bg-slate-900 text-white border-slate-800">
                    {item.label} {item.comingSoon && "(Coming Soon)"}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Footer: Sync */}
        <div className="p-4 border-t border-slate-100 flex flex-col items-center gap-3 bg-slate-50/50">
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <button
                        className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                            isSyncLoading ? "bg-indigo-50 text-indigo-500 animate-spin" : "bg-white text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 border border-slate-200"
                        )}
                        onClick={() => initializeSync && initializeSync()}
                    >
                        {isSyncLoading ? <Loader2 className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                    </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                    {isSyncLoading ? "Syncing..." : "Sync Now"}
                </TooltipContent>
            </Tooltip>
        </div>
      </aside>
      
      <ProfileDialog open={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </>
  );
};

export default AppSidebar;
