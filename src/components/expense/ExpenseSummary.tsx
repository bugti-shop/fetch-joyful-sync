import { motion } from 'framer-motion';
import { useExpense } from '@/contexts/ExpenseContext';
import { TrendingDown, Calendar, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export const ExpenseSummary = () => {
  const { getTotalExpenses, categories, getCategoryTotal } = useExpense();

  const daily = getTotalExpenses('daily');
  const weekly = getTotalExpenses('weekly');
  const monthly = getTotalExpenses('monthly');

  const totalBudget = categories.reduce((sum, cat) => sum + cat.budget, 0);
  const budgetUsed = (monthly / totalBudget) * 100;

  const summaryItems = [
    { label: 'Today', value: daily, icon: '📅', color: 'hsl(210, 85%, 55%)' },
    { label: 'This Week', value: weekly, icon: '📆', color: 'hsl(160, 70%, 45%)' },
    { label: 'This Month', value: monthly, icon: '🗓️', color: 'hsl(280, 70%, 50%)' },
  ];

  return (
    <div className="space-y-4">
      {/* Summary Cards - Full width stacked */}
      <div className="flex flex-col gap-3">
        {summaryItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card rounded-2xl p-4 border border-border shadow-sm flex items-center gap-4"
          >
            <div className="text-3xl">{item.icon}</div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="text-2xl font-bold text-foreground">${formatCurrency(item.value)}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Budget Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-2xl p-4 border border-border shadow-sm"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wallet className="text-primary" size={20} />
            <span className="font-semibold text-foreground">Monthly Budget</span>
          </div>
          <span className="text-sm text-muted-foreground">
            ${formatCurrency(monthly)} / ${formatCurrency(totalBudget)}
          </span>
        </div>
        
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(budgetUsed, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              budgetUsed > 100 
                ? 'bg-destructive' 
                : budgetUsed > 80 
                  ? 'bg-yellow-500' 
                  : 'bg-accent'
            }`}
          />
        </div>
        
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{budgetUsed.toFixed(0)}% used</span>
          <span>${formatCurrency(totalBudget - monthly)} remaining</span>
        </div>
      </motion.div>
    </div>
  );
};
