import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Calendar as CalendarIcon, X, CalendarDays } from 'lucide-react';
import { format, subMonths, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, startOfWeek, endOfWeek, getDay } from 'date-fns';
import { useExpense } from '@/contexts/ExpenseContext';
import { hapticFeedback } from '@/lib/haptics';
import { formatCurrency } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface Account {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'savings' | 'account';
  balance: number;
  icon: string;
  color: string;
}

const ACCOUNTS_STORAGE_KEY = 'jarify_accounts';

export const ExpenseStatsView = () => {
  const { expenses, incomes, categories } = useExpense();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showOverviewDetails, setShowOverviewDetails] = useState(false);
  const [showExpenseDetails, setShowExpenseDetails] = useState(false);
  const [showIncomeDetails, setShowIncomeDetails] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [balanceView, setBalanceView] = useState<'total' | 'income' | 'expense'>('total');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Load accounts from localStorage
  useEffect(() => {
    const loadAccounts = () => {
      const saved = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Account[];
        setAccounts(parsed);
        // Select first account by default if none selected
        if (!selectedAccountId && parsed.length > 0) {
          setSelectedAccountId(parsed[0].id);
        }
      }
    };
    loadAccounts();
    const interval = setInterval(loadAccounts, 2000);
    return () => clearInterval(interval);
  }, [selectedAccountId]);

  // Get selected account
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  // Calculate overall totals (all time)
  const allTimeIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
  const allTimeExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const allTimeBalance = allTimeIncome - allTimeExpense;
  
  // Calculate total from all accounts
  const totalAccountsBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const goToPreviousMonth = () => {
    hapticFeedback.light();
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    hapticFeedback.light();
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Filter transactions for current month
  const currentMonthExpenses = useMemo(() => 
    expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate >= monthStart && expDate <= monthEnd;
    }), [expenses, monthStart, monthEnd]);

  const currentMonthIncomes = useMemo(() => 
    incomes.filter(inc => {
      const incDate = new Date(inc.date);
      return incDate >= monthStart && incDate <= monthEnd;
    }), [incomes, monthStart, monthEnd]);

  const totalExpense = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalIncome = currentMonthIncomes.reduce((sum, inc) => sum + inc.amount, 0);
  const totalBalance = totalIncome - totalExpense;

  // Calculate previous month's balance as "Opening Balance"
  const previousExpenses = expenses.filter(exp => {
    const expDate = new Date(exp.date);
    return expDate < monthStart;
  }).reduce((sum, exp) => sum + exp.amount, 0);
  
  const previousIncomes = incomes.filter(inc => {
    const incDate = new Date(inc.date);
    return incDate < monthStart;
  }).reduce((sum, inc) => sum + inc.amount, 0);
  
  const openingBalance = previousIncomes - previousExpenses;
  const endingBalance = openingBalance + totalBalance;

  // Fallback colors for categories without a color
  const FALLBACK_EXPENSE_COLORS = ['hsl(174, 72%, 56%)', 'hsl(280, 60%, 55%)', 'hsl(45, 90%, 55%)', 'hsl(0, 75%, 55%)', 'hsl(200, 70%, 55%)', 'hsl(220, 15%, 50%)'];
  const FALLBACK_INCOME_COLORS = ['hsl(160, 70%, 50%)', 'hsl(200, 80%, 50%)', 'hsl(140, 70%, 45%)', 'hsl(180, 60%, 50%)', 'hsl(120, 60%, 50%)', 'hsl(220, 15%, 50%)'];

  // Category breakdown for expense pie chart with "Others" slice
  const expenseCategoryData = useMemo(() => {
    const categoryTotals = currentMonthExpenses.reduce((acc, exp) => {
      acc[exp.categoryId] = (acc[exp.categoryId] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    const allCategories = Object.entries(categoryTotals)
      .map(([categoryId, amount], idx) => {
        const category = categories.find(c => c.id === categoryId);
        return {
          id: categoryId,
          name: category?.name || 'Other',
          icon: category?.icon || '📦',
          value: amount,
          color: category?.color || FALLBACK_EXPENSE_COLORS[idx % FALLBACK_EXPENSE_COLORS.length],
          percentage: totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : '0'
        };
      })
      .sort((a, b) => b.value - a.value);

    // Top 4 categories + Others
    if (allCategories.length <= 5) return allCategories;

    const top4 = allCategories.slice(0, 4);
    const othersValue = allCategories.slice(4).reduce((sum, c) => sum + c.value, 0);
    const othersPercentage = totalExpense > 0 ? ((othersValue / totalExpense) * 100).toFixed(1) : '0';

    return [
      ...top4,
      {
        id: 'others',
        name: 'Others',
        icon: '📦',
        value: othersValue,
        color: 'hsl(220, 15%, 50%)',
        percentage: othersPercentage
      }
    ];
  }, [currentMonthExpenses, categories, totalExpense]);

  // Category breakdown for income pie chart with "Others" slice
  const incomeCategoryData = useMemo(() => {
    const categoryTotals = currentMonthIncomes.reduce((acc, inc) => {
      acc[inc.categoryId] = (acc[inc.categoryId] || 0) + inc.amount;
      return acc;
    }, {} as Record<string, number>);

    const allCategories = Object.entries(categoryTotals)
      .map(([categoryId, amount], idx) => {
        const category = categories.find(c => c.id === categoryId);
        return {
          id: categoryId,
          name: category?.name || 'Other',
          icon: category?.icon || '💰',
          value: amount,
          color: category?.color || FALLBACK_INCOME_COLORS[idx % FALLBACK_INCOME_COLORS.length],
          percentage: totalIncome > 0 ? ((amount / totalIncome) * 100).toFixed(1) : '0'
        };
      })
      .sort((a, b) => b.value - a.value);

    // Top 4 categories + Others
    if (allCategories.length <= 5) return allCategories;

    const top4 = allCategories.slice(0, 4);
    const othersValue = allCategories.slice(4).reduce((sum, c) => sum + c.value, 0);
    const othersPercentage = totalIncome > 0 ? ((othersValue / totalIncome) * 100).toFixed(1) : '0';

    return [
      ...top4,
      {
        id: 'others',
        name: 'Others',
        icon: '💰',
        value: othersValue,
        color: 'hsl(220, 15%, 50%)',
        percentage: othersPercentage
      }
    ];
  }, [currentMonthIncomes, categories, totalIncome]);

  // Calendar data
  const calendarDays = useMemo(() => {
    const start = startOfWeek(monthStart, { weekStartsOn: 0 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [monthStart, monthEnd]);

  const getDayData = (day: Date) => {
    const dayExpenses = expenses.filter(exp => isSameDay(new Date(exp.date), day));
    const dayIncomes = incomes.filter(inc => isSameDay(new Date(inc.date), day));
    const totalDayExpense = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalDayIncome = dayIncomes.reduce((sum, inc) => sum + inc.amount, 0);
    return { expenses: dayExpenses, incomes: dayIncomes, totalExpense: totalDayExpense, totalIncome: totalDayIncome };
  };

  // Get transactions for selected day
  const selectedDayData = selectedDay ? getDayData(selectedDay) : null;

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get display balance based on selected view
  const getDisplayBalance = () => {
    switch (balanceView) {
      case 'income': return allTimeIncome;
      case 'expense': return allTimeExpense;
      default: return allTimeBalance;
    }
  };

  const getBalanceLabel = () => {
    switch (balanceView) {
      case 'income': return 'Total Income';
      case 'expense': return 'Total Expense';
      default: return 'Total Balance';
    }
  };

  return (
    <div className="space-y-4 pb-24 bg-secondary/30 min-h-screen -mx-4 px-4 -mt-4 pt-4">
      {/* Top Balance Header - Competitor Style */}
      <div className="flex items-center justify-between py-2">
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button onClick={() => hapticFeedback.light()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                {selectedAccount ? (
                  <>
                    <span>{selectedAccount.icon}</span>
                    <span>{selectedAccount.name}</span>
                  </>
                ) : (
                  <span>All Accounts</span>
                )}
                <ChevronDown size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-card border border-border z-50">
              <DropdownMenuItem 
                onClick={() => setSelectedAccountId(null)}
                className={!selectedAccountId ? 'bg-secondary' : ''}
              >
                <span className="mr-2">📊</span>
                <span className="flex-1">All Accounts</span>
                <span className="font-semibold text-xs">${formatCurrency(totalAccountsBalance)}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {accounts.map(account => (
                <DropdownMenuItem 
                  key={account.id}
                  onClick={() => setSelectedAccountId(account.id)}
                  className={selectedAccountId === account.id ? 'bg-secondary' : ''}
                >
                  <span className="mr-2">{account.icon}</span>
                  <span className="flex-1">{account.name}</span>
                  <span className={`font-semibold text-xs ${account.balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    ${formatCurrency(Math.abs(account.balance))}
                  </span>
                </DropdownMenuItem>
              ))}
              {accounts.length === 0 && (
                <DropdownMenuItem disabled>
                  <span className="text-muted-foreground text-sm">No accounts yet</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button onClick={() => hapticFeedback.light()} className="flex items-center gap-1 text-2xl font-bold text-foreground hover:opacity-80 transition-opacity">
                ${formatCurrency(selectedAccount ? selectedAccount.balance : (balanceView === 'total' ? allTimeBalance : balanceView === 'income' ? allTimeIncome : allTimeExpense))}
                <ChevronDown size={20} className="text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-card border border-border z-50">
              <DropdownMenuItem 
                onClick={() => setBalanceView('total')}
                className={balanceView === 'total' ? 'bg-secondary' : ''}
              >
                <span className="flex-1">Total Balance</span>
                <span className="font-semibold">${formatCurrency(allTimeBalance)}</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setBalanceView('income')}
                className={balanceView === 'income' ? 'bg-secondary' : ''}
              >
                <span className="flex-1">Total Income</span>
                <span className="font-semibold text-emerald-500">${formatCurrency(allTimeIncome)}</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setBalanceView('expense')}
                className={balanceView === 'expense' ? 'bg-secondary' : ''}
              >
                <span className="flex-1">Total Expense</span>
                <span className="font-semibold text-red-500">${formatCurrency(allTimeExpense)}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              hapticFeedback.light();
              setShowCalendar(!showCalendar);
            }}
            className={`p-2 rounded-lg transition-colors ${showCalendar ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
          >
            <CalendarDays size={20} className={showCalendar ? 'text-primary-foreground' : 'text-foreground'} />
          </button>
        </div>
      </div>

      {/* Month Navigation with Balance */}
      <div className="bg-card rounded-2xl p-4 border border-border">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ChevronLeft size={24} className="text-foreground" />
          </button>
          
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-foreground">
              {format(currentDate, 'MMM yyyy')}
            </h2>
            <button
              onClick={() => {
                hapticFeedback.light();
                setShowCalendar(!showCalendar);
              }}
              className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
            >
              <CalendarIcon size={18} className="text-muted-foreground" />
            </button>
          </div>
          
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ChevronRight size={24} className="text-foreground" />
          </button>
        </div>

        {/* Opening/Ending Balance */}
        <div className="flex justify-between text-sm mb-3">
          <div>
            <p className="text-muted-foreground">Opening Balance</p>
            <p className="font-semibold text-foreground">${formatCurrency(Math.abs(openingBalance))}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">Ending Balance</p>
            <p className="font-semibold text-foreground">${formatCurrency(Math.abs(endingBalance))}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${totalIncome > 0 ? Math.min((totalIncome / (totalIncome + totalExpense)) * 100, 100) : 50}%`,
              background: 'linear-gradient(90deg, hsl(160, 70%, 50%), hsl(140, 70%, 45%))'
            }}
          />
        </div>
      </div>

      {/* Calendar View */}
      <AnimatePresence>
        {showCalendar && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card rounded-2xl p-4 border border-border overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">Calendar</h3>
              <button
                onClick={() => {
                  hapticFeedback.light();
                  setShowCalendar(false);
                }}
                className="p-1 hover:bg-secondary rounded-lg transition-colors"
              >
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>

            {/* Week headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map(day => {
                const dayData = getDayData(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isToday = isSameDay(day, new Date());
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const hasTransactions = dayData.totalExpense > 0 || dayData.totalIncome > 0;

                // Format amounts for mini display
                const formatMini = (val: number) => {
                  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                  if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
                  return val.toFixed(0);
                };

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`
                      relative p-1 rounded-lg text-sm transition-colors min-h-[58px] flex flex-col items-center justify-start
                      ${!isCurrentMonth ? 'text-muted-foreground/40' : 'text-foreground'}
                      ${isToday ? 'ring-2 ring-primary' : ''}
                      ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}
                    `}
                  >
                    <span className="font-medium text-xs">{format(day, 'd')}</span>
                    {hasTransactions && isCurrentMonth && (
                      <div className="flex flex-col items-center gap-0 mt-0.5 leading-none">
                        {dayData.totalIncome > 0 && (
                          <span
                            className="text-[8px] font-semibold leading-tight"
                            style={{ color: isSelected ? 'inherit' : 'hsl(160, 70%, 50%)' }}
                          >
                            +{formatMini(dayData.totalIncome)}
                          </span>
                        )}
                        {dayData.totalExpense > 0 && (
                          <span
                            className="text-[8px] font-semibold leading-tight"
                            style={{ color: isSelected ? 'inherit' : 'hsl(0, 75%, 55%)' }}
                          >
                            -{formatMini(dayData.totalExpense)}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected day details */}
            <AnimatePresence>
              {selectedDay && selectedDayData && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-border"
                >
                  <h4 className="font-semibold text-foreground mb-3">
                    {format(selectedDay, 'EEEE, MMM d, yyyy')}
                  </h4>
                  
                  <div className="flex gap-4 mb-3">
                    <div className="flex-1 bg-secondary/50 rounded-lg p-2 text-center">
                      <p className="text-xs text-muted-foreground">Income</p>
                      <p className="font-semibold" style={{ color: 'hsl(160, 70%, 50%)' }}>
                        +${formatCurrency(selectedDayData.totalIncome)}
                      </p>
                    </div>
                    <div className="flex-1 bg-secondary/50 rounded-lg p-2 text-center">
                      <p className="text-xs text-muted-foreground">Expense</p>
                      <p className="font-semibold" style={{ color: 'hsl(0, 75%, 55%)' }}>
                        -${formatCurrency(selectedDayData.totalExpense)}
                      </p>
                    </div>
                  </div>

                  {(selectedDayData.incomes.length > 0 || selectedDayData.expenses.length > 0) ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedDayData.incomes.map(inc => {
                        const category = categories.find(c => c.id === inc.categoryId);
                        return (
                          <div key={inc.id} className="flex items-center justify-between bg-secondary/30 rounded-lg p-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{category?.icon || '💰'}</span>
                              <div>
                                <p className="text-sm font-medium text-foreground">{inc.description}</p>
                                <p className="text-xs text-muted-foreground">{category?.name || 'Income'}</p>
                              </div>
                            </div>
                            <span className="font-semibold" style={{ color: 'hsl(160, 70%, 50%)' }}>
                              +${formatCurrency(inc.amount)}
                            </span>
                          </div>
                        );
                      })}
                      {selectedDayData.expenses.map(exp => {
                        const category = categories.find(c => c.id === exp.categoryId);
                        return (
                          <div key={exp.id} className="flex items-center justify-between bg-secondary/30 rounded-lg p-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{category?.icon || '📦'}</span>
                              <div>
                                <p className="text-sm font-medium text-foreground">{exp.description}</p>
                                <p className="text-xs text-muted-foreground">{category?.name || 'Expense'}</p>
                              </div>
                            </div>
                            <span className="font-semibold" style={{ color: 'hsl(0, 75%, 55%)' }}>
                              -${formatCurrency(exp.amount)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">No transactions</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overview Card */}
      <div className="bg-card rounded-2xl p-5 border border-border">
        <h3 className="text-xl font-bold text-foreground mb-4">Overview</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-foreground">Income</span>
            <span className="font-semibold" style={{ color: 'hsl(200, 80%, 50%)' }}>
              ${formatCurrency(totalIncome)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-foreground">Expense</span>
            <span className="font-semibold" style={{ color: 'hsl(0, 75%, 55%)' }}>
              -${formatCurrency(totalExpense)}
            </span>
          </div>
          
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="text-foreground font-medium">Total</span>
            <span className="font-bold text-foreground">
              ${formatCurrency(Math.abs(totalBalance))}
            </span>
          </div>
        </div>

        {/* Show more button */}
        <button 
          onClick={() => setShowOverviewDetails(!showOverviewDetails)}
          className="flex items-center justify-between w-full mt-4 pt-3 border-t border-border text-foreground hover:text-muted-foreground transition-colors"
        >
          <span className="text-sm">Show {showOverviewDetails ? 'less' : 'more'}</span>
          {showOverviewDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {/* Expanded transaction list */}
        <AnimatePresence>
          {showOverviewDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-2 max-h-60 overflow-y-auto">
                {[...currentMonthIncomes, ...currentMonthExpenses]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 10)
                  .map(transaction => {
                    const isIncome = 'categoryId' in transaction && currentMonthIncomes.some(i => i.id === transaction.id);
                    const category = categories.find(c => c.id === transaction.categoryId);
                    return (
                      <div key={transaction.id} className="flex items-center justify-between bg-secondary/30 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{category?.icon || (isIncome ? '💰' : '📦')}</span>
                          <div>
                            <p className="font-medium text-foreground">{transaction.description}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(transaction.date), 'MMM d, yyyy')}</p>
                          </div>
                        </div>
                        <span className="font-semibold" style={{ color: isIncome ? 'hsl(160, 70%, 50%)' : 'hsl(0, 75%, 55%)' }}>
                          {isIncome ? '+' : '-'}${formatCurrency(transaction.amount)}
                        </span>
                      </div>
                    );
                  })}
                {currentMonthIncomes.length === 0 && currentMonthExpenses.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No transactions this month</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Expense Structure Card */}
      <div className="bg-card rounded-2xl p-5 border border-border">
        <h3 className="text-xl font-bold text-foreground mb-4">Expense Structure</h3>
        
        {expenseCategoryData.length > 0 ? (
          <div className="flex flex-wrap items-center gap-4">
            {/* Donut Chart */}
            <div className="relative w-40 h-40 sm:w-44 sm:h-44 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {expenseCategoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-muted-foreground">Expense</span>
                <span className="text-sm font-bold" style={{ color: 'hsl(0, 75%, 55%)' }}>
                  -${formatCurrency(totalExpense)}
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 min-w-[10rem] space-y-2">
              {expenseCategoryData.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 text-xs"
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="min-w-0 truncate text-foreground">{item.name}</span>
                  <span className="whitespace-nowrap text-right tabular-nums text-muted-foreground">
                    ({item.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-44 text-muted-foreground">
            No expense data for this month
          </div>
        )}

        {/* Show more button */}
        <button 
          onClick={() => setShowExpenseDetails(!showExpenseDetails)}
          className="flex items-center justify-between w-full mt-4 pt-3 border-t border-border text-foreground hover:text-muted-foreground transition-colors"
        >
          <span className="text-sm">Show {showExpenseDetails ? 'less' : 'more'}</span>
          {showExpenseDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {/* Expanded expense list by category */}
        <AnimatePresence>
          {showExpenseDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-2 max-h-60 overflow-y-auto">
                {expenseCategoryData.map((cat, index) => {
                  const categoryExpenses = currentMonthExpenses.filter(e => e.categoryId === cat.id);
                  return (
                    <div key={cat.id} className="bg-secondary/30 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="font-medium text-foreground">{cat.icon} {cat.name}</span>
                        </div>
                        <span className="font-semibold" style={{ color: 'hsl(0, 75%, 55%)' }}>
                          -${formatCurrency(cat.value)}
                        </span>
                      </div>
                      <div className="pl-5 space-y-1">
                        {categoryExpenses.slice(0, 3).map(exp => (
                          <div key={exp.id} className="flex justify-between text-sm text-muted-foreground">
                            <span>{exp.description}</span>
                            <span>-${formatCurrency(exp.amount)}</span>
                          </div>
                        ))}
                        {categoryExpenses.length > 3 && (
                          <p className="text-xs text-muted-foreground">+{categoryExpenses.length - 3} more</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Income Structure Card */}
      <div className="bg-card rounded-2xl p-5 border border-border">
        <h3 className="text-xl font-bold text-foreground mb-4">Income Structure</h3>
        
        {incomeCategoryData.length > 0 ? (
          <div className="flex flex-wrap items-center gap-4">
            {/* Donut Chart */}
            <div className="relative w-40 h-40 sm:w-44 sm:h-44 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {incomeCategoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-muted-foreground">Income</span>
                <span className="text-sm font-bold" style={{ color: 'hsl(160, 70%, 50%)' }}>
                  +${formatCurrency(totalIncome)}
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 min-w-[10rem] space-y-2">
              {incomeCategoryData.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 text-xs"
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="min-w-0 truncate text-foreground">{item.name}</span>
                  <span className="whitespace-nowrap text-right tabular-nums text-muted-foreground">
                    ({item.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-44 text-muted-foreground">
            No income data for this month
          </div>
        )}

        {/* Show more button */}
        <button 
          onClick={() => setShowIncomeDetails(!showIncomeDetails)}
          className="flex items-center justify-between w-full mt-4 pt-3 border-t border-border text-foreground hover:text-muted-foreground transition-colors"
        >
          <span className="text-sm">Show {showIncomeDetails ? 'less' : 'more'}</span>
          {showIncomeDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {/* Expanded income list by category */}
        <AnimatePresence>
          {showIncomeDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-2 max-h-60 overflow-y-auto">
                {incomeCategoryData.map((cat, index) => {
                  const categoryIncomes = currentMonthIncomes.filter(i => i.categoryId === cat.id);
                  return (
                    <div key={cat.id} className="bg-secondary/30 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="font-medium text-foreground">{cat.icon} {cat.name}</span>
                        </div>
                        <span className="font-semibold" style={{ color: 'hsl(160, 70%, 50%)' }}>
                          +${formatCurrency(cat.value)}
                        </span>
                      </div>
                      <div className="pl-5 space-y-1">
                        {categoryIncomes.slice(0, 3).map(inc => (
                          <div key={inc.id} className="flex justify-between text-sm text-muted-foreground">
                            <span>{inc.description}</span>
                            <span>+${formatCurrency(inc.amount)}</span>
                          </div>
                        ))}
                        {categoryIncomes.length > 3 && (
                          <p className="text-xs text-muted-foreground">+{categoryIncomes.length - 3} more</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
