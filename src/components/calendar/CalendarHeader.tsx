import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Check,
  Loader2,
  Download,
  LogOut,
  Settings,
} from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";

interface CalendarHeaderProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onOpenSyncSettings?: () => void;
}

export const CalendarHeader = ({
  currentDate,
  onDateChange,
  onOpenSyncSettings,
}: CalendarHeaderProps) => {
  const {
    isGoogleConnected,
    isLoading,
    googleStatus,
    connectGoogle,
    disconnectGoogle,
  } = useGoogleAuth();
  const [showImportModal, setShowImportModal] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white shrink-0">
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="text-xl font-bold flex items-center gap-2 px-2 hover:bg-slate-50"
              >
                {format(currentDate, "MMMM yyyy")}
                <CalendarIcon className="w-4 h-4 text-slate-400" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[60]" align="start">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(d) => d && onDateChange(d)}
              />
            </PopoverContent>
          </Popover>

          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onDateChange(subDays(currentDate, 7))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              className="text-xs font-semibold h-7 px-3"
              onClick={() => onDateChange(new Date())}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onDateChange(addDays(currentDate, 7))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Google Calendar Connection */}
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Button variant="outline" size="sm" disabled>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </Button>
          ) : isGoogleConnected ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <Check className="w-3 h-3 text-green-500" />
                  <span className="hidden sm:inline">Connected</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {googleStatus?.email && (
                  <>
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      {googleStatus.email}
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => setShowImportModal(true)}>
                  <Download className="w-4 h-4 mr-2" />
                  Import Calendar
                </DropdownMenuItem>
                {onOpenSyncSettings && (
                  <DropdownMenuItem onClick={onOpenSyncSettings}>
                    <Settings className="w-4 h-4 mr-2" />
                    Sync Settings
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={disconnectGoogle}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={connectGoogle}
              className="gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="hidden sm:inline">Connect Google Calendar</span>
              <span className="sm:hidden">Connect</span>
            </Button>
          )}
        </div>
      </div>
    </>
  );
};
