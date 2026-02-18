import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, ArrowRight, PieChart, BarChart3, Calendar } from 'lucide-react';
import { useExpense } from '@/contexts/ExpenseContext';
import { format, subMonths, startOfMonth, endOfMonth, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface FinancialDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewMode = 'overview' | 'trends' | 'breakdown';

export const FinancialDashboard = ({ isOpen, onClose }: FinancialDashboardProps) => {
  const { expenses, incomes, categories, getTotalExpenses, getTotalIncome, getCategoryTotal } = useExpense();
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<'3months' | '6months' | '12months'>('6months');

  // Calculate monthly data for trends
  const getMonthlyData = () => {
    const months = selectedPeriod === '3months' ? 3 : selectedPeriod === '6months' ? 6 : 12;
    const data = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);

      const monthExpenses = expenses.filter(exp => {
        const d = new Date(exp.date);
        return d >= start && d <= end;
      }).reduce((sum, exp) => sum + exp.amount, 0);

      const monthIncome = incomes.filter(inc => {
        const d = new Date(inc.date);
        return d >= start && d <= end;
      }).reduce((sum, inc) => sum + inc.amount, 0);

      data.push({
        month: format(monthDate, 'MMM'),
        income: monthIncome,
        expense: monthExpenses,
        savings: monthIncome - monthExpenses,
      });
    }
    return data;
  };

  // Get category breakdown for pie chart
  const getCategoryBreakdown = () => {
    const expenseCategories = categories.filter(c => c.budget > 0);
    return expenseCategories
      .map(cat => ({
        name: cat.name,
        value: getCategoryTotal(cat.id, 'monthly'),
        color: cat.color,
        icon: cat.icon,
      }))
      .filter(c => c.value > 0)
      .sort((a, b) => b.value - a.value);
  };

  const monthlyData = getMonthlyData();
  const categoryBreakdown = getCategoryBreakdown();
  const totalMonthlyIncome = getTotalIncome('monthly');
  const totalMonthlyExpenses = getTotalExpenses('monthly');
  const savingsRate = totalMonthlyIncome > 0 
    ? ((totalMonthlyIncome - totalMonthlyExpenses) / totalMonthlyIncome * 100).toFixed(1)
    : '0';

  // Calculate averages
  const avgMonthlyExpense = monthlyData.reduce((sum, m) => sum + m.expense, 0) / monthlyData.length;
  const avgMonthlyIncome = monthlyData.reduce((sum, m) => sum + m.income, 0) / monthlyData.length;
  const avgMonthlySavings = monthlyData.reduce((sum, m) => sum + m.savings, 0) / monthlyData.length;

  // Get spending trend (comparing current month to previous)
  const currentMonthExpense = monthlyData[monthlyData.length - 1]?.expense || 0;
  const prevMonthExpense = monthlyData[monthlyData.length - 2]?.expense || 0;
  const expenseTrend = prevMonthExpense > 0 
    ? ((currentMonthExpense - prevMonthExpense) / prevMonthExpense * 100).toFixed(1)
    : '0';

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
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto"
        >
          <div className="min-h-full p-4 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-foreground">Financial Dashboard</h1>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary transition-colors">
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            {/* View Mode Tabs */}
            <div className="flex gap-1 p-1 bg-secondary rounded-xl mb-4">
              {[
                { id: 'overview', label: 'Overview', icon: PieChart },
                { id: 'trends', label: 'Trends', icon: BarChart3 },
                { id: 'breakdown', label: 'Breakdown', icon: Calendar },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id as ViewMode)}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                    viewMode === tab.id 
                      ? 'bg-background text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Overview View */}
            {viewMode === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Monthly Summary Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-card border border-border rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <TrendingUp size={16} className="text-emerald-500" />
                      </div>
                      <span className="text-xs text-muted-foreground">Income</span>
                    </div>
                    <p className="text-xl font-bold text-emerald-500">{formatCurrency(totalMonthlyIncome)}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">This month</p>
                  </div>

                  <div className="bg-card border border-border rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                        <TrendingDown size={16} className="text-red-500" />
                      </div>
                      <span className="text-xs text-muted-foreground">Expenses</span>
                    </div>
                    <p className="text-xl font-bold text-red-500">{formatCurrency(totalMonthlyExpenses)}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {Number(expenseTrend) > 0 ? '↑' : '↓'} {Math.abs(Number(expenseTrend))}% vs last month
                    </p>
                  </div>
                </div>

                {/* Savings Rate */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Savings Rate</p>
                      <p className="text-2xl font-bold text-primary">{savingsRate}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Net Savings</p>
                      <p className={`text-lg font-bold ${totalMonthlyIncome - totalMonthlyExpenses >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {formatCurrency(totalMonthlyIncome - totalMonthlyExpenses)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Top Spending Categories */}
                <div className="bg-card border border-border rounded-2xl p-4">
                  <h3 className="font-semibold text-sm mb-3">Top Spending Categories</h3>
                  <div className="space-y-2">
                    {categoryBreakdown.slice(0, 5).map((cat, index) => (
                      <div key={cat.name} className="flex items-center gap-3">
                        <span className="text-lg">{cat.icon}</span>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-foreground">{cat.name}</span>
                            <span className="text-xs text-muted-foreground">{formatCurrency(cat.value)}</span>
                          </div>
                          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(cat.value / (categoryBreakdown[0]?.value || 1)) * 100}%` }}
                              transition={{ duration: 0.5, delay: index * 0.1 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Insights */}
                <div className="bg-card border border-border rounded-2xl p-4">
                  <h3 className="font-semibold text-sm mb-3">Monthly Insights</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <span className="text-primary">💡</span>
                      <p className="text-muted-foreground">
                        Your average monthly spending is <span className="text-foreground font-medium">{formatCurrency(avgMonthlyExpense)}</span>
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-500">📈</span>
                      <p className="text-muted-foreground">
                        Average monthly savings: <span className="text-foreground font-medium">{formatCurrency(avgMonthlySavings)}</span>
                      </p>
                    </div>
                    {categoryBreakdown[0] && (
                      <div className="flex items-start gap-2">
                        <span>{categoryBreakdown[0].icon}</span>
                        <p className="text-muted-foreground">
                          Highest spending: <span className="text-foreground font-medium">{categoryBreakdown[0].name}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Trends View */}
            {viewMode === 'trends' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Period Selector */}
                <div className="flex gap-2">
                  {(['3months', '6months', '12months'] as const).map(period => (
                    <button
                      key={period}
                      onClick={() => setSelectedPeriod(period)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                        selectedPeriod === period 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {period === '3months' ? '3 Months' : period === '6months' ? '6 Months' : '12 Months'}
                    </button>
                  ))}
                </div>

                {/* Income vs Expense Chart */}
                <div className="bg-card border border-border rounded-2xl p-4">
                  <h3 className="font-semibold text-sm mb-4">Income vs Expenses</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData} barGap={2}>
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }} 
                          formatter={(value: number) => [formatCurrency(value), '']}
                        />
                        <Bar dataKey="income" fill="hsl(145, 63%, 45%)" radius={[4, 4, 0, 0]} name="Income" />
                        <Bar dataKey="expense" fill="hsl(0, 72%, 50%)" radius={[4, 4, 0, 0]} name="Expenses" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(145, 63%, 45%)' }} />
                      <span className="text-xs text-muted-foreground">Income</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(0, 72%, 50%)' }} />
                      <span className="text-xs text-muted-foreground">Expenses</span>
                    </div>
                  </div>
                </div>

                {/* Savings Trend */}
                <div className="bg-card border border-border rounded-2xl p-4">
                  <h3 className="font-semibold text-sm mb-4">Monthly Savings</h3>
                  <div className="space-y-2">
                    {monthlyData.map((month, index) => (
                      <div key={month.month} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-8">{month.month}</span>
                        <div className="flex-1 h-6 bg-secondary rounded-full overflow-hidden relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ 
                              width: `${Math.min(Math.abs(month.savings) / (Math.max(...monthlyData.map(m => Math.abs(m.savings))) || 1) * 100, 100)}%` 
                            }}
                            transition={{ duration: 0.5, delay: index * 0.05 }}
                            className={`h-full rounded-full ${month.savings >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                          />
                        </div>
                        <span className={`text-xs font-medium w-16 text-right ${month.savings >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {month.savings >= 0 ? '+' : ''}{formatCurrency(month.savings)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Breakdown View */}
            {viewMode === 'breakdown' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Pie Chart */}
                <div className="bg-card border border-border rounded-2xl p-4">
                  <h3 className="font-semibold text-sm mb-4">Expense Distribution</h3>
                  {categoryBreakdown.length > 0 ? (
                    <>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPie>
                            <Pie
                              data={categoryBreakdown}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={70}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {categoryBreakdown.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                                fontSize: '12px'
                              }}
                              formatter={(value: number) => [formatCurrency(value), '']}
                            />
                          </RechartsPie>
                        </ResponsiveContainer>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {categoryBreakdown.slice(0, 6).map(cat => (
                          <div key={cat.name} className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                            <span className="text-xs text-muted-foreground truncate">{cat.name}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No expenses this month
                    </div>
                  )}
                </div>

                {/* Full Category List */}
                <div className="bg-card border border-border rounded-2xl p-4">
                  <h3 className="font-semibold text-sm mb-3">All Categories</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {categoryBreakdown.map(cat => {
                      const percentage = ((cat.value / totalMonthlyExpenses) * 100).toFixed(1);
                      return (
                        <div key={cat.name} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                          <span className="text-lg">{cat.icon}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{cat.name}</p>
                            <p className="text-[10px] text-muted-foreground">{percentage}% of total</p>
                          </div>
                          <span className="text-sm font-semibold text-foreground">{formatCurrency(cat.value)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
