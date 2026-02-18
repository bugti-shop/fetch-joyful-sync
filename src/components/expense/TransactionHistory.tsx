import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Filter, Download, ChevronDown, Calendar, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { useExpense } from '@/contexts/ExpenseContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, isWithinInterval, parseISO, startOfDay, endOfDay, subDays, subMonths, startOfMonth, endOfMonth, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

interface TransactionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

type DateRangePreset = 'all' | 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'last30Days' | 'last90Days' | 'custom';
type TransactionType = 'all' | 'expense' | 'income';
type SortBy = 'date' | 'amount' | 'category';
type SortOrder = 'asc' | 'desc';

interface CombinedTransaction {
  id: string;
  type: 'expense' | 'income';
  categoryId: string;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
}

export const TransactionHistory = ({ isOpen, onClose }: TransactionHistoryProps) => {
  const { expenses, incomes, categories, deleteExpense, deleteIncome } = useExpense();
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [transactionType, setTransactionType] = useState<TransactionType>('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Combine and filter transactions
  const filteredTransactions = useMemo(() => {
    // Combine expenses and incomes
    const combined: CombinedTransaction[] = [
      ...expenses.map(e => ({ ...e, type: 'expense' as const })),
      ...incomes.map(i => ({ ...i, type: 'income' as const }))
    ];

    // Apply filters
    let filtered = combined;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(query) ||
        categories.find(c => c.id === t.categoryId)?.name.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (transactionType !== 'all') {
      filtered = filtered.filter(t => t.type === transactionType);
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.categoryId === selectedCategory);
    }

    // Amount filters
    if (minAmount) {
      filtered = filtered.filter(t => t.amount >= parseFloat(minAmount));
    }
    if (maxAmount) {
      filtered = filtered.filter(t => t.amount <= parseFloat(maxAmount));
    }

    // Date range filter
    if (dateRangePreset !== 'all') {
      const now = new Date();
      let start: Date;
      let end: Date = endOfDay(now);

      switch (dateRangePreset) {
        case 'today':
          start = startOfDay(now);
          break;
        case 'yesterday':
          start = startOfDay(subDays(now, 1));
          end = endOfDay(subDays(now, 1));
          break;
        case 'thisWeek':
          start = startOfWeek(now, { weekStartsOn: 0 });
          break;
        case 'lastWeek':
          start = startOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });
          end = endOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });
          break;
        case 'thisMonth':
          start = startOfMonth(now);
          break;
        case 'lastMonth':
          start = startOfMonth(subMonths(now, 1));
          end = endOfMonth(subMonths(now, 1));
          break;
        case 'last30Days':
          start = subDays(now, 30);
          break;
        case 'last90Days':
          start = subDays(now, 90);
          break;
        case 'custom':
          if (customStartDate && customEndDate) {
            start = startOfDay(parseISO(customStartDate));
            end = endOfDay(parseISO(customEndDate));
          } else {
            start = new Date(0);
          }
          break;
        default:
          start = new Date(0);
      }

      filtered = filtered.filter(t => {
        const transactionDate = parseISO(t.date);
        return isWithinInterval(transactionDate, { start, end });
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'category':
          comparison = a.categoryId.localeCompare(b.categoryId);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [expenses, incomes, categories, searchQuery, dateRangePreset, customStartDate, customEndDate, selectedCategory, transactionType, minAmount, maxAmount, sortBy, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    return { totalExpenses, totalIncome, balance: totalIncome - totalExpenses, count: filteredTransactions.length };
  }, [filteredTransactions]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
    const rows = filteredTransactions.map(t => {
      const category = categories.find(c => c.id === t.categoryId);
      return [
        format(parseISO(t.date), 'yyyy-MM-dd'),
        t.type,
        category?.name || 'Unknown',
        t.description,
        t.amount.toFixed(2)
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    
    toast.success('Transactions exported successfully!');
  };

  const handleDelete = (transaction: CombinedTransaction) => {
    if (transaction.type === 'expense') {
      deleteExpense(transaction.id);
    } else {
      deleteIncome(transaction.id);
    }
    toast.success('Transaction deleted');
  };

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(c => c.id === categoryId) || { name: 'Unknown', icon: '💰' };
  };

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, CombinedTransaction[]> = {};
    filteredTransactions.forEach(t => {
      const dateKey = format(parseISO(t.date), 'yyyy-MM-dd');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(t);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredTransactions]);

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
            className="bg-card w-full max-w-2xl rounded-3xl shadow-2xl border border-border overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary transition-colors">
                <X size={20} className="text-muted-foreground" />
              </button>
              <h2 className="text-lg font-bold text-foreground">Transaction History</h2>
              <Button variant="ghost" size="sm" onClick={exportToCSV}>
                <Download size={18} />
              </Button>
            </div>

            {/* Search & Filter Toggle */}
            <div className="p-4 space-y-3 border-b border-border">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button 
                  variant={showFilters ? 'default' : 'outline'} 
                  size="icon"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter size={18} />
                </Button>
              </div>

              {/* Filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      {/* Date Range */}
                      <div className="space-y-1">
                        <Label className="text-xs">Date Range</Label>
                        <Select value={dateRangePreset} onValueChange={(v) => setDateRangePreset(v as DateRangePreset)}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="yesterday">Yesterday</SelectItem>
                            <SelectItem value="thisWeek">This Week</SelectItem>
                            <SelectItem value="lastWeek">Last Week</SelectItem>
                            <SelectItem value="thisMonth">This Month</SelectItem>
                            <SelectItem value="lastMonth">Last Month</SelectItem>
                            <SelectItem value="last30Days">Last 30 Days</SelectItem>
                            <SelectItem value="last90Days">Last 90 Days</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Type */}
                      <div className="space-y-1">
                        <Label className="text-xs">Type</Label>
                        <Select value={transactionType} onValueChange={(v) => setTransactionType(v as TransactionType)}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="expense">Expenses</SelectItem>
                            <SelectItem value="income">Income</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Category */}
                      <div className="space-y-1">
                        <Label className="text-xs">Category</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.icon} {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Sort */}
                      <div className="space-y-1">
                        <Label className="text-xs">Sort By</Label>
                        <Select value={`${sortBy}-${sortOrder}`} onValueChange={(v) => {
                          const [by, order] = v.split('-') as [SortBy, SortOrder];
                          setSortBy(by);
                          setSortOrder(order);
                        }}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="date-desc">Newest First</SelectItem>
                            <SelectItem value="date-asc">Oldest First</SelectItem>
                            <SelectItem value="amount-desc">Highest Amount</SelectItem>
                            <SelectItem value="amount-asc">Lowest Amount</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Custom Date Range */}
                    {dateRangePreset === 'custom' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">From</Label>
                          <Input
                            type="date"
                            value={customStartDate}
                            onChange={e => setCustomStartDate(e.target.value)}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">To</Label>
                          <Input
                            type="date"
                            value={customEndDate}
                            onChange={e => setCustomEndDate(e.target.value)}
                            className="h-9"
                          />
                        </div>
                      </div>
                    )}

                    {/* Amount Range */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Min Amount</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={minAmount}
                          onChange={e => setMinAmount(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Max Amount</Label>
                        <Input
                          type="number"
                          placeholder="∞"
                          value={maxAmount}
                          onChange={e => setMaxAmount(e.target.value)}
                          className="h-9"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-secondary/30">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Income</p>
                <p className="text-sm font-bold text-green-500">+${formatCurrency(stats.totalIncome)}</p>
              </div>
              <div className="text-center border-x border-border">
                <p className="text-xs text-muted-foreground">Expenses</p>
                <p className="text-sm font-bold text-destructive">-${formatCurrency(stats.totalExpenses)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Balance</p>
                <p className={`text-sm font-bold ${stats.balance >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                  ${formatCurrency(Math.abs(stats.balance))}
                </p>
              </div>
            </div>

            {/* Transactions List */}
            <div className="flex-1 overflow-y-auto p-4">
              {groupedTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <span className="text-4xl mb-2">🔍</span>
                  <p>No transactions found</p>
                  <p className="text-sm">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedTransactions.map(([date, transactions]) => (
                    <div key={date}>
                      <p className="text-xs font-medium text-muted-foreground mb-2 sticky top-0 bg-card py-1">
                        {format(parseISO(date), 'EEEE, MMM d, yyyy')}
                      </p>
                      <div className="space-y-2">
                        {transactions.map((transaction, index) => {
                          const category = getCategoryInfo(transaction.categoryId);
                          return (
                            <motion.div
                              key={transaction.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.03 }}
                              className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl hover:bg-secondary transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                                  transaction.type === 'income' ? 'bg-green-500/20' : 'bg-destructive/20'
                                }`}>
                                  {category.icon}
                                </div>
                                <div>
                                  <p className="font-medium text-foreground text-sm">{transaction.description}</p>
                                  <p className="text-xs text-muted-foreground">{category.name}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <p className={`font-bold text-sm ${
                                    transaction.type === 'income' ? 'text-green-500' : 'text-destructive'
                                  }`}>
                                    {transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleDelete(transaction)}
                                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-border text-center text-xs text-muted-foreground">
              Showing {stats.count} transactions
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};