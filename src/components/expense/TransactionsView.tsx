import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { useExpense } from '@/contexts/ExpenseContext';
import { AddExpenseModal } from './AddExpenseModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const TransactionsView = () => {
  const { expenses, incomes, categories, deleteExpense, deleteIncome } = useExpense();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');

  // Combine and sort all transactions
  const allTransactions = [
    ...expenses.map(e => ({ ...e, type: 'expense' as const })),
    ...incomes.map(i => ({ ...i, type: 'income' as const })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter transactions
  const filteredTransactions = allTransactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  // Group by date
  const groupedByDate = filteredTransactions.reduce((groups, transaction) => {
    const date = format(new Date(transaction.date), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, typeof filteredTransactions>);

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(c => c.id === categoryId) || { name: 'Unknown', icon: '📦', color: 'hsl(0,0%,50%)' };
  };

  const handleDelete = (id: string, type: 'expense' | 'income') => {
    if (type === 'expense') {
      deleteExpense(id);
    } else {
      deleteIncome(id);
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button
          onClick={() => setShowAddExpense(true)}
          className="flex-1"
          variant="destructive"
        >
          <TrendingDown size={18} className="mr-2" />
          Expense
        </Button>
        <Button
          onClick={() => setShowAddIncome(true)}
          className="flex-1"
          variant="default"
        >
          <TrendingUp size={18} className="mr-2" />
          Income
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transactions..."
            className="pl-10"
          />
        </div>
        <div className="flex bg-secondary rounded-lg p-0.5">
          {(['all', 'expense', 'income'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-all capitalize ${
                filterType === type
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {Object.entries(groupedByDate).length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No transactions yet</p>
            <p className="text-sm">Add your first expense or income</p>
          </div>
        ) : (
          Object.entries(groupedByDate).map(([date, transactions]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                {format(new Date(date), 'EEEE, MMM d')}
              </h3>
              <div className="space-y-2">
                {transactions.map((transaction) => {
                  const category = getCategoryInfo(transaction.categoryId);
                  const isExpense = transaction.type === 'expense';
                  
                  return (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-card border border-border rounded-xl p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span 
                          className="text-xl p-2 rounded-lg"
                          style={{ backgroundColor: `${category.color}20` }}
                        >
                          {category.icon}
                        </span>
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {transaction.description || category.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {category.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={`font-bold ${isExpense ? 'text-destructive' : 'text-green-500'}`}>
                          {isExpense ? '-' : '+'}${transaction.amount.toFixed(2)}
                        </p>
                        <button
                          onClick={() => handleDelete(transaction.id, transaction.type)}
                          className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} className="text-destructive" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={showAddExpense}
        onClose={() => setShowAddExpense(false)}
      />

      {/* Add Income - using same modal */}
      <AddExpenseModal
        isOpen={showAddIncome}
        onClose={() => setShowAddIncome(false)}
      />
    </div>
  );
};
