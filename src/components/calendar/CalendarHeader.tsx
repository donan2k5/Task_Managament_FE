import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { format, addDays, subDays } from "date-fns";

interface CalendarHeaderProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export const CalendarHeader = ({
  currentDate,
  onDateChange,
}: CalendarHeaderProps) => {
  return (
    <div className="flex items-center justify-between px-2 md:px-4 py-2 md:py-3 border-b bg-white shrink-0">
      <div className="flex items-center gap-1 md:gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="text-base md:text-xl font-bold flex items-center gap-1 md:gap-2 px-1 md:px-2 hover:bg-slate-50"
            >
              <span className="hidden sm:inline">{format(currentDate, "MMMM yyyy")}</span>
              <span className="sm:hidden">{format(currentDate, "MMM yyyy")}</span>
              <CalendarIcon className="w-3 h-3 md:w-4 md:h-4 text-slate-400" />
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
            className="h-6 w-6 md:h-7 md:w-7"
            onClick={() => onDateChange(subDays(currentDate, 7))}
          >
            <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" />
          </Button>
          <Button
            variant="ghost"
            className="text-[10px] md:text-xs font-semibold h-6 md:h-7 px-2 md:px-3"
            onClick={() => onDateChange(new Date())}
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 md:h-7 md:w-7"
            onClick={() => onDateChange(addDays(currentDate, 7))}
          >
            <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

