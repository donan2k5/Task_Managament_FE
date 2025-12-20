import { motion } from "framer-motion";
import { Goal } from "@/types";

interface GoalsCardProps {
  goals: Goal[];
}

export const GoalsCard = ({ goals }: GoalsCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center">
          <span className="text-xs">🎯</span>
        </div>
        <h3 className="text-base font-semibold text-slate-900">My Goals</h3>
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
              <p className="text-sm font-medium text-slate-900 truncate">
                {goal.name}
              </p>
              <p className="text-xs text-slate-500">
                {goal.project} • {goal.category}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${goal.progress}%`,
                    backgroundColor: goal.color,
                  }}
                />
              </div>
              <span className="text-sm font-medium text-slate-900 w-10 text-right">
                {goal.progress}%
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
