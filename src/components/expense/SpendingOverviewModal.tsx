import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, PieChart, BarChart3 } from 'lucide-react';
import { useExpense } from '@/contexts/ExpenseContext';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface SpendingOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpendingOverviewModal = ({ isOpen, onClose }: SpendingOverviewModalProps) => {
  const { expenses, incomes, categories, getTotalExpenses, getTotalIncome } = useExpense();
  
  const totalExpense = getTotalExpenses('monthly');
  const totalIncome = getTotalIncome('monthly');
  const savings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

  // Get category breakdown
  const getCategoryBreakdown = () => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    
    const breakdown: Record<string, { amount: number; category: typeof categories[0] }> = {};
    
    expenses.forEach(exp => {
      const d = new Date(exp.date);
      if (d >= start && d <= end) {
        if (!breakdown[exp.categoryId]) {
          const cat = categories.find(c => c.id === exp.categoryId) || {
            id: 'other',
            name: 'Other',
            icon: '📦',
            color: 'hsl(220, 15%, 50%)',
            budget: 0
          };
          breakdown[exp.categoryId] = { amount: 0, category: cat };
        }
        breakdown[exp.categoryId].amount += exp.amount;
      }
    });
    
    return Object.values(breakdown).sort((a, b) => b.amount - a.amount);
  };

  const categoryBreakdown = getCategoryBreakdown();
  const maxCategoryAmount = Math.max(...categoryBreakdown.map(c => c.amount), 1);

  // Monthly comparison
  const getMonthlyComparison = () => {
    const now = new Date();
    const thisMonth = { start: startOfMonth(now), end: endOfMonth(now) };
    const lastMonth = { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
    
    const thisMonthExpenses = expenses
      .filter(exp => new Date(exp.date) >= thisMonth.start && new Date(exp.date) <= thisMonth.end)
      .reduce((sum, exp) => sum + exp.amount, 0);
    
    const lastMonthExpenses = expenses
      .filter(exp => new Date(exp.date) >= lastMonth.start && new Date(exp.date) <= lastMonth.end)
      .reduce((sum, exp) => sum + exp.amount, 0);
    
    const change = lastMonthExpenses > 0 
      ? ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 
      : 0;
    
    return { thisMonth: thisMonthExpenses, lastMonth: lastMonthExpenses, change };
  };

  const monthlyComparison = getMonthlyComparison();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border overflow-hidden max-h-[85vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
              <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary transition-colors">
                <X size={20} className="text-muted-foreground" />
              </button>
              <h2 className="text-lg font-bold text-foreground">Spending Overview</h2>
              <div className="w-9" />
            </div>

            <div className="p-4 space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={14} className="text-emerald-500" />
                    <span className="text-xs text-muted-foreground">Income</span>
                  </div>
                  <p className="text-lg font-bold text-emerald-500">{formatCurrency(totalIncome)}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="p-3 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown size={14} className="text-red-500" />
                    <span className="text-xs text-muted-foreground">Expenses</span>
                  </div>
                  <p className="text-lg font-bold text-red-500">{formatCurrency(totalExpense)}</p>
                </motion.div>
              </div>

              {/* Savings Rate */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-3 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Savings Rate</p>
                    <p className={`text-xl font-bold ${savings >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {savingsRate.toFixed(0)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Net Savings</p>
                    <p className={`text-lg font-bold ${savings >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {savings >= 0 ? '+' : ''}{formatCurrency(savings)}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Monthly Comparison */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="p-3 rounded-2xl bg-secondary/50 border border-border"
              >
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 size={14} className="text-primary" />
                  <span className="text-xs font-medium text-foreground">vs Last Month</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Last month: {formatCurrency(monthlyComparison.lastMonth)}
                  </div>
                  <div className={`text-sm font-medium ${
                    monthlyComparison.change <= 0 ? 'text-emerald-500' : 'text-red-500'
                  }`}>
                    {monthlyComparison.change <= 0 ? '↓' : '↑'} {Math.abs(monthlyComparison.change).toFixed(0)}%
                  </div>
                </div>
              </motion.div>

              {/* Category Breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <PieChart size={14} className="text-primary" />
                  <span className="text-sm font-medium text-foreground">Spending by Category</span>
                </div>
                
                <div className="space-y-2">
                  {categoryBreakdown.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-4">No expenses this month</p>
                  ) : (
                    categoryBreakdown.slice(0, 8).map((item, index) => {
                      const percentage = (item.amount / totalExpense) * 100;
                      const barWidth = (item.amount / maxCategoryAmount) * 100;
                      
                      return (
                        <motion.div
                          key={item.category.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.05 }}
                          className="relative"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{item.category.icon}</span>
                              <span className="text-xs font-medium text-foreground">{item.category.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-medium text-foreground">{formatCurrency(item.amount)}</span>
                              <span className="text-[10px] text-muted-foreground ml-1">({percentage.toFixed(0)}%)</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${barWidth}%` }}
                              transition={{ duration: 0.5, delay: 0.3 + index * 0.05 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: item.category.color }}
                            />
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </motion.div>

              {/* Insights */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20"
              >
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">💡 Insight</p>
                <p className="text-xs text-muted-foreground">
                  {categoryBreakdown.length > 0 
                    ? `Your top spending category is ${categoryBreakdown[0].category.name} at ${formatCurrency(categoryBreakdown[0].amount)} (${((categoryBreakdown[0].amount / totalExpense) * 100).toFixed(0)}% of total).`
                    : 'Start tracking your expenses to see insights!'}
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};