import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, PieChart, BarChart3, ChevronRight, AlertCircle, Search, Download, RefreshCw } from 'lucide-react';
import { useExpense } from '@/contexts/ExpenseContext';
import { hapticFeedback } from '@/lib/haptics';
import { ExpenseCategoryCard } from './ExpenseCategoryCard';
import { ExpenseSummary } from './ExpenseSummary';
import { ExpenseChart } from './ExpenseChart';
import { RecentTransactions } from './RecentTransactions';
import { AddExpenseModal } from './AddExpenseModal';
import { CategoryDetailModal } from './CategoryDetailModal';
import { ExpenseSearch } from './ExpenseSearch';
import { RecurringExpenses } from './RecurringExpenses';
import { ExpenseExport } from './ExpenseExport';
import { Button } from '@/components/ui/button';

interface ExpenseTrackerProps {
  darkMode: boolean;
}

export const ExpenseTracker = ({ darkMode }: ExpenseTrackerProps) => {
  const { categories, getCategoryTotal, getTotalExpenses } = useExpense();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [showSearch, setShowSearch] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [showExport, setShowExport] = useState(false);

  // Find categories over budget
  const overBudgetCategories = categories.filter(cat => {
    const spent = getCategoryTotal(cat.id, 'monthly');
    return spent > cat.budget;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Action Bar */}
      <div className="flex gap-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            hapticFeedback.light();
            setShowSearch(true);
          }}
          className="flex-1 bg-card border border-border rounded-xl p-3 flex items-center justify-center gap-2 text-sm font-medium text-foreground"
        >
          <Search size={16} />
          Search
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            hapticFeedback.light();
            setShowRecurring(true);
          }}
          className="flex-1 bg-card border border-border rounded-xl p-3 flex items-center justify-center gap-2 text-sm font-medium text-foreground"
        >
          <RefreshCw size={16} />
          Recurring
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            hapticFeedback.light();
            setShowExport(true);
          }}
          className="flex-1 bg-card border border-border rounded-xl p-3 flex items-center justify-center gap-2 text-sm font-medium text-foreground"
        >
          <Download size={16} />
          Export
        </motion.button>
      </div>

      {/* Overspending Alert */}
      <AnimatePresence>
        {overBudgetCategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="text-destructive" size={24} />
              <div>
                <p className="font-semibold text-destructive">Budget Alert!</p>
                <p className="text-sm text-muted-foreground">
                  You've exceeded your budget in: {overBudgetCategories.map(c => c.name).join(', ')}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Section */}
      <ExpenseSummary />

      {/* Quick Add Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          hapticFeedback.medium();
          setShowAddModal(true);
        }}
        className="w-full bg-primary text-primary-foreground rounded-2xl p-4 flex items-center justify-center gap-2 font-semibold transition-all"
      >
        <Plus size={20} />
        Quick Add Expense
      </motion.button>

      {/* Chart Section */}
      <div className="bg-card rounded-3xl p-4 sm:p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Spending Overview</h2>
          <div className="flex items-center gap-2">
            {/* Period Toggle */}
            <div className="flex bg-secondary rounded-lg p-0.5">
              {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    hapticFeedback.light();
                    setPeriod(p);
                  }}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                    period === p 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1, 3)}
                </button>
              ))}
            </div>
            
            {/* Chart Type Toggle */}
            <div className="flex bg-secondary rounded-lg p-0.5">
              <button
                onClick={() => {
                  hapticFeedback.light();
                  setChartType('pie');
                }}
                className={`p-1.5 rounded-md transition-all ${
                  chartType === 'pie' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                <PieChart size={16} />
              </button>
              <button
                onClick={() => {
                  hapticFeedback.light();
                  setChartType('bar');
                }}
                className={`p-1.5 rounded-md transition-all ${
                  chartType === 'bar' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                <BarChart3 size={16} />
              </button>
            </div>
          </div>
        </div>
        
        <ExpenseChart type={chartType} period={period} />
      </div>

      {/* Categories Grid */}
      <div className="bg-card rounded-3xl p-4 sm:p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Categories</h2>
          <span className="text-sm text-muted-foreground">
            ${getTotalExpenses('monthly').toFixed(2)} this month
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ExpenseCategoryCard
                category={category}
                onClick={() => {
                  hapticFeedback.light();
                  setSelectedCategory(category.id);
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-card rounded-3xl p-4 sm:p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Recent Transactions</h2>
          <ChevronRight className="text-muted-foreground" size={20} />
        </div>
        
        <RecentTransactions limit={5} showDelete />
      </div>

      {/* Modals */}
      <AddExpenseModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
      />
      
      <CategoryDetailModal
        isOpen={!!selectedCategory}
        onClose={() => setSelectedCategory(null)}
        categoryId={selectedCategory || ''}
      />

      <AnimatePresence>
        {showSearch && <ExpenseSearch onClose={() => setShowSearch(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showRecurring && <RecurringExpenses onClose={() => setShowRecurring(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showExport && <ExpenseExport onClose={() => setShowExport(false)} />}
      </AnimatePresence>
    </motion.div>
  );
};
