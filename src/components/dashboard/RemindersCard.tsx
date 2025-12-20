import { motion } from "framer-motion";
import { Bell, ChevronDown } from "lucide-react";
import { Reminder } from "@/types";

interface RemindersCardProps {
  reminders: Reminder[];
}

export const RemindersCard = ({ reminders }: RemindersCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.4 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-4 h-4 text-slate-500" />
        <h3 className="text-base font-semibold text-slate-900">Reminders</h3>
      </div>

      <button className="flex items-center gap-2 text-sm text-slate-500 mb-3">
        <ChevronDown className="w-3 h-3" />
        Today • {reminders.length}
      </button>

      <div className="space-y-3">
        {reminders.map((reminder) => (
          <div key={reminder.id} className="flex items-start gap-3 group">
            <p className="text-sm text-slate-900 flex-1">{reminder.text}</p>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-1 hover:bg-slate-100 rounded">
                <Bell className="w-3.5 h-3.5 text-slate-500" />
              </button>
              <button className="p-1 hover:bg-slate-100 rounded">
                <span className="w-3.5 h-3.5 text-slate-500">🗑</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
