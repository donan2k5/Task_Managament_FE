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
    </div>
  );
};
