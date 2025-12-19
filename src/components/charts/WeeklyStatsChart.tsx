import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { weeklyStats, getTotalWeeklyHours, getCurrentDayIndex } from '@/data/mockData';

const WeeklyStatsChart = () => {
  const currentDayIndex = getCurrentDayIndex();
  const totalHours = getTotalWeeklyHours();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="dashboard-card"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Weekly Focus Time</h3>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{totalHours}h</p>
          <p className="text-xs text-muted-foreground">Total this week</p>
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeklyStats} barCategoryGap="20%">
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickFormatter={(value) => `${value}h`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-lg)',
              }}
              formatter={(value: number) => [`${value} hours`, 'Focus Time']}
              labelFormatter={(label) => {
                const stat = weeklyStats.find((s) => s.day === label);
                return stat?.dayName || label;
              }}
            />
            <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
              {weeklyStats.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    index === currentDayIndex
                      ? 'hsl(var(--primary))'
                      : 'hsl(var(--muted))'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default WeeklyStatsChart;
