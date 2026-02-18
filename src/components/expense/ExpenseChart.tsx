import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useExpense } from '@/contexts/ExpenseContext';
import { motion } from 'framer-motion';

interface ExpenseChartProps {
  type: 'pie' | 'bar';
  period?: 'daily' | 'weekly' | 'monthly';
}

export const ExpenseChart = ({ type, period = 'monthly' }: ExpenseChartProps) => {
  const { categories, getCategoryTotal } = useExpense();

  const data = categories.map(cat => ({
    name: cat.name,
    value: getCategoryTotal(cat.id, period),
    color: cat.color,
    icon: cat.icon,
  })).filter(item => item.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
        <span className="text-4xl mb-2">📊</span>
        <p>No expenses yet</p>
      </div>
    );
  }

  if (type === 'pie') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="h-64"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          {data.map((entry, index) => (
            <div key={index} className="flex items-center gap-1.5 text-xs">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.icon} {entry.name}</span>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-64"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <XAxis type="number" tickFormatter={(value) => `$${value}`} />
          <YAxis 
            type="category" 
            dataKey="icon" 
            width={30}
            tick={{ fontSize: 16 }}
          />
          <Tooltip 
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Spent']}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px'
            }}
          />
          <Bar 
            dataKey="value" 
            radius={[0, 8, 8, 0]}
            animationBegin={0}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell key={`bar-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};
