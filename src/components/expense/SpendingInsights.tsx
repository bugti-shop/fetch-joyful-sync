import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Lightbulb, PieChart, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { useExpense } from '@/contexts/ExpenseContext';
import { format, subMonths, startOfMonth, endOfMonth, parseISO, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface SpendingInsightsProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = ['hsl(210, 85%, 55%)', 'hsl(160, 70%, 45%)', 'hsl(280, 70%, 50%)', 'hsl(25, 95%, 53%)', 'hsl(340, 80%, 55%)', 'hsl(45, 90%, 50%)', 'hsl(0, 85%, 55%)', 'hsl(190, 80%, 45%)'];

export const SpendingInsights = ({ isOpen, onClose }: SpendingInsightsProps) => {
  const { expenses, incomes, categories, getCategoryTotal } = useExpense();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'tips'>('overview');

  // Calculate monthly data
  const monthlyData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(new Date(), i);
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      
      const monthExpenses = expenses.filter(e => {
        const date = parseISO(e.date);
        return date >= start && date <= end;
      });
      
      const monthIncomes = incomes.filter(inc => {
        const date = parseISO(inc.date);
        return date >= start && date <= end;
      });

      months.push({
        name: format(month, 'MMM'),
        expenses: monthExpenses.reduce((sum, e) => sum + e.amount, 0),
        income: monthIncomes.reduce((sum, i) => sum + i.amount, 0),
      });
    }
    return months;
  }, [expenses, incomes]);

  // Weekly spending trend
  const weeklyData = useMemo(() => {
    const weeks = [];
    for (let i = 3; i >= 0; i--) {
      const week = subWeeks(new Date(), i);
      const start = startOfWeek(week, { weekStartsOn: 0 });
      const end = endOfWeek(week, { weekStartsOn: 0 });
      
      const weekExpenses = expenses.filter(e => {
        const date = parseISO(e.date);
        return date >= start && date <= end;
      });

      weeks.push({
        name: `Week ${4 - i}`,
        amount: weekExpenses.reduce((sum, e) => sum + e.amount, 0),
      });
    }
    return weeks;
  }, [expenses]);

  // Category breakdown for current month
  const categoryData = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    
    const expenseCategories = categories.filter(c => c.budget > 0);
    
    return expenseCategories.map(cat => {
      const catExpenses = expenses.filter(e => {
        const date = parseISO(e.date);
        return e.categoryId === cat.id && date >= start && date <= end;
      });
      const total = catExpenses.reduce((sum, e) => sum + e.amount, 0);
      return {
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        value: total,
        budget: cat.budget,
        percentage: cat.budget > 0 ? (total / cat.budget) * 100 : 0,
      };
    }).filter(c => c.value > 0).sort((a, b) => b.value - a.value);
  }, [expenses, categories, currentMonth]);

  // Calculate insights
  const insights = useMemo(() => {
    const thisMonth = monthlyData[monthlyData.length - 1];
    const lastMonth = monthlyData[monthlyData.length - 2];
    
    const expenseChange = lastMonth?.expenses > 0 
      ? ((thisMonth?.expenses - lastMonth?.expenses) / lastMonth?.expenses) * 100 
      : 0;

    const savingsRate = thisMonth?.income > 0 
      ? ((thisMonth?.income - thisMonth?.expenses) / thisMonth?.income) * 100 
      : 0;

    const topCategory = categoryData[0];
    const overBudgetCategories = categoryData.filter(c => c.percentage > 100);
    const nearBudgetCategories = categoryData.filter(c => c.percentage >= 80 && c.percentage < 100);

    return {
      expenseChange,
      savingsRate,
      topCategory,
      overBudgetCategories,
      nearBudgetCategories,
      totalExpenses: thisMonth?.expenses || 0,
      totalIncome: thisMonth?.income || 0,
    };
  }, [monthlyData, categoryData]);

  // Generate money-saving tips
  const tips = useMemo(() => {
    const tipsList = [];

    if (insights.overBudgetCategories.length > 0) {
      insights.overBudgetCategories.forEach(cat => {
        tipsList.push({
          type: 'warning',
          icon: cat.icon,
          title: `${cat.name} Over Budget`,
          description: `You've spent $${formatCurrency(cat.value)} of your $${formatCurrency(cat.budget)} budget. Try to reduce spending here.`,
        });
      });
    }

    if (insights.savingsRate < 20 && insights.totalIncome > 0) {
      tipsList.push({
        type: 'tip',
        icon: '💡',
        title: 'Boost Your Savings',
        description: `Your savings rate is ${insights.savingsRate.toFixed(0)}%. Aim for 20% or more by reviewing non-essential expenses.`,
      });
    }

    if (insights.topCategory && insights.topCategory.value > 500) {
      tipsList.push({
        type: 'insight',
        icon: insights.topCategory.icon,
        title: 'Highest Spending Category',
        description: `${insights.topCategory.name} is your biggest expense at $${formatCurrency(insights.topCategory.value)}. Look for ways to optimize here.`,
      });
    }

    if (insights.expenseChange > 20) {
      tipsList.push({
        type: 'warning',
        icon: '📈',
        title: 'Spending Increased',
        description: `Your expenses increased by ${insights.expenseChange.toFixed(0)}% compared to last month. Review recent purchases.`,
      });
    } else if (insights.expenseChange < -10) {
      tipsList.push({
        type: 'success',
        icon: '🎉',
        title: 'Great Job Saving!',
        description: `Your expenses decreased by ${Math.abs(insights.expenseChange).toFixed(0)}% compared to last month. Keep it up!`,
      });
    }

    // General tips
    tipsList.push({
      type: 'tip',
      icon: '🍳',
      title: 'Cook at Home',
      description: 'Preparing meals at home can save you 50-70% compared to eating out.',
    });

    tipsList.push({
      type: 'tip',
      icon: '🔄',
      title: 'Review Subscriptions',
      description: 'Cancel unused subscriptions. Most people forget about 2-3 active subscriptions.',
    });

    tipsList.push({
      type: 'tip',
      icon: '🛒',
      title: 'Use a Shopping List',
      description: 'Stick to a list when shopping to avoid impulse purchases.',
    });

    return tipsList;
  }, [insights]);

  const goToPreviousMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentMonth(prev => {
    const next = subMonths(prev, -1);
    return next > new Date() ? prev : next;
  });

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
            className="bg-card w-full max-w-lg rounded-3xl border border-border overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary transition-colors">
                <X size={20} className="text-muted-foreground" />
              </button>
              <div className="flex items-center gap-2">
                <Lightbulb className="text-primary" size={20} />
                <h2 className="text-lg font-bold text-foreground">Spending Insights</h2>
              </div>
              <div className="w-9" />
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
              {[
                { id: 'overview', label: 'Overview', icon: PieChart },
                { id: 'trends', label: 'Trends', icon: BarChart3 },
                { id: 'tips', label: 'Tips', icon: Lightbulb },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors relative ${
                    activeTab === tab.id ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="insights-tab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <AnimatePresence mode="wait">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between">
                      <button onClick={goToPreviousMonth} className="p-2 hover:bg-secondary rounded-lg">
                        <ChevronLeft size={20} />
                      </button>
                      <h3 className="font-semibold text-foreground">{format(currentMonth, 'MMMM yyyy')}</h3>
                      <button onClick={goToNextMonth} className="p-2 hover:bg-secondary rounded-lg">
                        <ChevronRight size={20} />
                      </button>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 text-center">
                        <TrendingUp className="mx-auto mb-2 text-green-500" size={24} />
                        <p className="text-xs text-muted-foreground">Income</p>
                        <p className="text-lg font-bold text-green-500">${formatCurrency(insights.totalIncome)}</p>
                      </div>
                      <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 text-center">
                        <TrendingDown className="mx-auto mb-2 text-destructive" size={24} />
                        <p className="text-xs text-muted-foreground">Expenses</p>
                        <p className="text-lg font-bold text-destructive">${formatCurrency(insights.totalExpenses)}</p>
                      </div>
                    </div>

                    {/* Savings Rate */}
                    <div className={`p-4 rounded-2xl border ${insights.savingsRate >= 20 ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Savings Rate</span>
                        <span className={`font-bold ${insights.savingsRate >= 20 ? 'text-green-500' : 'text-yellow-500'}`}>
                          {insights.savingsRate.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full mt-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${insights.savingsRate >= 20 ? 'bg-green-500' : 'bg-yellow-500'}`}
                          style={{ width: `${Math.min(insights.savingsRate, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Category Pie Chart */}
                    {categoryData.length > 0 && (
                      <div className="bg-secondary/30 rounded-2xl p-4">
                        <h4 className="font-semibold text-foreground mb-4">Category Breakdown</h4>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                              <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={70}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                labelLine={false}
                              >
                                {categoryData.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value: number) => `$${formatCurrency(value)}`} />
                            </RePieChart>
                          </ResponsiveContainer>
                        </div>
                        {/* Category List */}
                        <div className="space-y-2 mt-4">
                          {categoryData.slice(0, 5).map((cat, index) => (
                            <div key={cat.id} className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                              <span className="text-sm flex-1">{cat.icon} {cat.name}</span>
                              <span className="text-sm font-medium">${formatCurrency(cat.value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Trends Tab */}
                {activeTab === 'trends' && (
                  <motion.div
                    key="trends"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {/* Monthly Trend */}
                    <div className="bg-secondary/30 rounded-2xl p-4">
                      <h4 className="font-semibold text-foreground mb-4">6-Month Overview</h4>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={monthlyData}>
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip formatter={(value: number) => `$${formatCurrency(value)}`} />
                            <Bar dataKey="income" fill="hsl(120, 60%, 45%)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expenses" fill="hsl(0, 85%, 55%)" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-center gap-6 mt-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span className="text-xs text-muted-foreground">Income</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-destructive" />
                          <span className="text-xs text-muted-foreground">Expenses</span>
                        </div>
                      </div>
                    </div>

                    {/* Weekly Spending */}
                    <div className="bg-secondary/30 rounded-2xl p-4">
                      <h4 className="font-semibold text-foreground mb-4">Weekly Spending Trend</h4>
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={weeklyData}>
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip formatter={(value: number) => `$${formatCurrency(value)}`} />
                            <Line 
                              type="monotone" 
                              dataKey="amount" 
                              stroke="hsl(var(--primary))" 
                              strokeWidth={2}
                              dot={{ fill: 'hsl(var(--primary))' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Month Comparison */}
                    <div className={`p-4 rounded-2xl border ${
                      insights.expenseChange < 0 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : insights.expenseChange > 10 
                          ? 'bg-destructive/10 border-destructive/30'
                          : 'bg-secondary/30 border-border'
                    }`}>
                      <p className="text-sm text-muted-foreground">vs. Last Month</p>
                      <p className={`text-xl font-bold ${
                        insights.expenseChange < 0 ? 'text-green-500' : insights.expenseChange > 10 ? 'text-destructive' : 'text-foreground'
                      }`}>
                        {insights.expenseChange > 0 ? '+' : ''}{insights.expenseChange.toFixed(0)}%
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Tips Tab */}
                {activeTab === 'tips' && (
                  <motion.div
                    key="tips"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-3"
                  >
                    {tips.map((tip, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 rounded-2xl border ${
                          tip.type === 'warning' 
                            ? 'bg-destructive/10 border-destructive/30'
                            : tip.type === 'success'
                              ? 'bg-green-500/10 border-green-500/30'
                              : 'bg-primary/5 border-primary/20'
                        }`}
                      >
                        <div className="flex gap-3">
                          <span className="text-2xl">{tip.icon}</span>
                          <div>
                            <p className="font-semibold text-foreground">{tip.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">{tip.description}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};