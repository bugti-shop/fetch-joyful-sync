import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Edit2, Save } from 'lucide-react';
import { useExpense } from '@/contexts/ExpenseContext';
import { RecentTransactions } from './RecentTransactions';
import { AddExpenseModal } from './AddExpenseModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CategoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
}

export const CategoryDetailModal = ({ isOpen, onClose, categoryId }: CategoryDetailModalProps) => {
  const { categories, getCategoryTotal, updateCategoryBudget } = useExpense();
  const category = categories.find(c => c.id === categoryId);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState(category?.budget.toString() || '');

  if (!category) return null;

  const spent = getCategoryTotal(categoryId, 'monthly');
  const percentage = category.budget > 0 ? (spent / category.budget) * 100 : 0;
  const remaining = category.budget - spent;

  const handleSaveBudget = () => {
    const budget = parseFloat(newBudget);
    if (!isNaN(budget) && budget >= 0) {
      updateCategoryBudget(categoryId, budget);
      setIsEditingBudget(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className="bg-card w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[85vh] overflow-hidden shadow-2xl border border-border"
          >
            {/* Header */}
            <div 
              className="p-6 text-white relative overflow-hidden"
              style={{ backgroundColor: category.color }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              <button 
                onClick={onClose} 
                className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="relative z-10">
                <span className="text-5xl mb-3 block">{category.icon}</span>
                <h2 className="text-2xl font-bold">{category.name}</h2>
                <p className="text-white/80 mt-1">Monthly spending</p>
              </div>
            </div>

            {/* Stats */}
            <div className="p-4 border-b border-border">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-foreground">${spent.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Spent</p>
                </div>
                <div>
                  {isEditingBudget ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={newBudget}
                        onChange={e => setNewBudget(e.target.value)}
                        className="h-8 w-20 text-center"
                      />
                      <button onClick={handleSaveBudget} className="p-1">
                        <Save size={16} className="text-primary" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-foreground flex items-center justify-center gap-1">
                        ${category.budget}
                        <button onClick={() => { setNewBudget(category.budget.toString()); setIsEditingBudget(true); }}>
                          <Edit2 size={14} className="text-muted-foreground" />
                        </button>
                      </p>
                      <p className="text-xs text-muted-foreground">Budget</p>
                    </>
                  )}
                </div>
                <div>
                  <p className={`text-2xl font-bold ${remaining < 0 ? 'text-destructive' : 'text-foreground'}`}>
                    ${Math.abs(remaining).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">{remaining < 0 ? 'Over' : 'Left'}</p>
                </div>
              </div>
              
              {/* Progress */}
              <div className="mt-4">
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percentage, 100)}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full rounded-full"
                    style={{ 
                      backgroundColor: percentage > 100 ? 'hsl(var(--destructive))' : category.color 
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  {percentage.toFixed(0)}% of budget used
                </p>
              </div>
            </div>

            {/* Add Expense Button */}
            <div className="p-4 border-b border-border">
              <Button 
                onClick={() => setShowAddExpense(true)}
                className="w-full"
                style={{ backgroundColor: category.color }}
              >
                <Plus size={18} className="mr-2" />
                Add Expense to {category.name}
              </Button>
            </div>

            {/* Transactions */}
            <div className="p-4 max-h-60 overflow-y-auto">
              <h3 className="font-semibold text-foreground mb-3">Recent Transactions</h3>
              <RecentTransactions categoryId={categoryId} limit={10} showDelete />
            </div>

            {/* Add Expense Modal */}
            <AddExpenseModal
              isOpen={showAddExpense}
              onClose={() => setShowAddExpense(false)}
              preselectedCategory={categoryId}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
