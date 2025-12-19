import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, Video, MoreHorizontal } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { upcomingEvents, ScheduleEvent } from '@/data/mockData';

const Schedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(i);
    }

    return days;
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date();
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && 
                         currentDate.getFullYear() === today.getFullYear();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const groupEventsByDate = (events: ScheduleEvent[]) => {
    const grouped: { [key: string]: ScheduleEvent[] } = {};
    events.forEach((event) => {
      if (!grouped[event.date]) {
        grouped[event.date] = [];
      }
      grouped[event.date].push(event);
    });
    return grouped;
  };

  const groupedEvents = groupEventsByDate(upcomingEvents);

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-foreground mb-1">Schedule</h1>
          <p className="text-muted-foreground">Manage your meetings and events</p>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 dashboard-card"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {daysOfWeek.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => (
                <div
                  key={index}
                  className={`
                    aspect-square flex items-center justify-center rounded-full text-sm cursor-pointer transition-all
                    ${day === null ? '' : 'hover:bg-muted'}
                    ${isCurrentMonth && day === today.getDate()
                      ? 'calendar-day-active'
                      : 'text-foreground'
                    }
                  `}
                >
                  {day}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Events List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="dashboard-card"
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">Upcoming Events</h2>

            <div className="space-y-5">
              {Object.entries(groupedEvents).map(([date, events]) => (
                <div key={date}>
                  <p className="text-xs font-medium text-muted-foreground mb-2">{date}</p>
                  <div className="space-y-2">
                    {events.map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                        className="p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-violet-light flex items-center justify-center flex-shrink-0">
                            <Video className="w-4 h-4 text-violet" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <p className="font-medium text-foreground text-sm truncate">
                                {event.title}
                              </p>
                              <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-card rounded transition-all">
                                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                              </button>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {event.startTime} - {event.endTime}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Schedule;
