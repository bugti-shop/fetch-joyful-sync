import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Filter, Calendar, DollarSign } from 'lucide-react';
import { useExpense } from '@/contexts/ExpenseContext';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

interface ExpenseSearchProps {
  onClose: () => void;
}

export const ExpenseSearch = ({ onClose }: ExpenseSearchProps) => {
  const { expenses, categories, deleteExpense } = useExpense();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredExpenses = expenses.filter(exp => {
    // Text search
    if (searchQuery && !exp.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Category filter
    if (categoryFilter !== 'all' && exp.categoryId !== categoryFilter) {
      return false;
    }
    
    // Date range filter
    if (dateFrom) {
      const expDate = new Date(exp.date);
      const fromDate = new Date(dateFrom);
      if (expDate < fromDate) return false;
    }
    
    if (dateTo) {
      const expDate = new Date(exp.date);
      const toDate = new Date(dateTo);
      if (expDate > toDate) return false;
    }
    
    // Amount filter
    if (minAmount && exp.amount < parseFloat(minAmount)) {
      return false;
    }
    
    if (maxAmount && exp.amount > parseFloat(maxAmount)) {
      return false;
    }
    
    return true;
  });

  const totalFiltered = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm"
    >
      <div className="h-full flex flex-col max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg"
              autoFocus
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-xl transition-colors ${showFilters ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
          >
            <Filter size={20} />
          </button>
          <button onClick={onClose} className="p-3 rounded-xl bg-secondary">
            <X size={20} />
          </button>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-card rounded-2xl p-4 mb-4 border border-border space-y-4">
                {/* Category Filter */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Category</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setCategoryFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        categoryFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                      }`}
                    >
                      All
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setCategoryFilter(cat.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          categoryFilter === cat.id ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                        }`}
                      >
                        {cat.icon} {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block flex items-center gap-1">
                      <Calendar size={14} /> From
                    </label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={e => setDateFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block flex items-center gap-1">
                      <Calendar size={14} /> To
                    </label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={e => setDateTo(e.target.value)}
                    />
                  </div>
                </div>

                {/* Amount Range */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block flex items-center gap-1">
                      <DollarSign size={14} /> Min Amount
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={minAmount}
                      onChange={e => setMinAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block flex items-center gap-1">
                      <DollarSign size={14} /> Max Amount
                    </label>
                    <Input
                      type="number"
                      placeholder="1000"
                      value={maxAmount}
                      onChange={e => setMaxAmount(e.target.value)}
                    />
                  </div>
                </div>

                {/* Clear Filters */}
                <button
                  onClick={() => {
                    setCategoryFilter('all');
                    setDateFrom('');
                    setDateTo('');
                    setMinAmount('');
                    setMaxAmount('');
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-3 text-sm">
          <span className="text-muted-foreground">
            {filteredExpenses.length} transaction{filteredExpenses.length !== 1 ? 's' : ''} found
          </span>
          <span className="font-semibold text-foreground">
            Total: ${totalFiltered.toFixed(2)}
          </span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Search size={48} className="mb-3 opacity-50" />
              <p>No expenses found</p>
            </div>
          ) : (
            filteredExpenses
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((expense, index) => {
                const category = categories.find(c => c.id === expense.categoryId);
                return (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="flex items-center justify-between p-3 bg-card rounded-xl border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                        style={{ backgroundColor: category?.color ? `${category.color}20` : 'hsl(var(--secondary))' }}
                      >
                        {category?.icon || '💰'}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{expense.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {category?.name} • {format(new Date(expense.date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-foreground">-${expense.amount.toFixed(2)}</span>
                  </motion.div>
                );
              })
          )}
        </div>
      </div>
    </motion.div>
  );
};
