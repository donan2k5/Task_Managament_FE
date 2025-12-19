import { motion } from 'framer-motion';
import { Clock, Video } from 'lucide-react';
import { ScheduleEvent } from '@/data/mockData';
import { Link } from 'react-router-dom';

interface SchedulePreviewProps {
  events: ScheduleEvent[];
}

const SchedulePreview = ({ events }: SchedulePreviewProps) => {
  const upcomingEvents = events.slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="dashboard-card"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Upcoming Schedule</h3>
      </div>

      <div className="space-y-3">
        {upcomingEvents.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Video className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{event.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {event.date} • {event.startTime} - {event.endTime}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Link
        to="/schedule"
        className="flex items-center justify-center mt-4 py-2 text-sm text-primary font-medium hover:underline"
      >
        View full schedule →
      </Link>
    </motion.div>
  );
};

export default SchedulePreview;
