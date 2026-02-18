import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, RefreshCw, Trash2, Calendar, DollarSign } from 'lucide-react';
import { useExpense } from '@/contexts/ExpenseContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format, addMonths, addWeeks, addDays, isAfter, isBefore, startOfDay } from 'date-fns';

export interface RecurringExpense {
  id: string;
  categoryId: string;
  amount: number;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  nextDueDate: string;
  isActive: boolean;
}

interface RecurringExpensesProps {
  onClose: () => void;
}

const STORAGE_KEY = 'jarify_recurring_expenses';

export const RecurringExpenses = ({ onClose }: RecurringExpensesProps) => {
  const { categories, addExpense } = useExpense();
  const { toast } = useToast();
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRecurring, setNewRecurring] = useState({
    categoryId: categories[0]?.id || '',
    amount: '',
    description: '',
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly',
    startDate: new Date().toISOString().split('T')[0],
  });

  // Load from storage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setRecurringExpenses(JSON.parse(stored));
    }
  }, []);

  // Save to storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recurringExpenses));
  }, [recurringExpenses]);

  // Check and process due recurring expenses
  useEffect(() => {
    const today = startOfDay(new Date());
    
    recurringExpenses.forEach(recurring => {
      if (!recurring.isActive) return;
      
      const dueDate = startOfDay(new Date(recurring.nextDueDate));
      
      if (isBefore(dueDate, today) || dueDate.getTime() === today.getTime()) {
        // Add the expense
        addExpense({
          categoryId: recurring.categoryId,
          amount: recurring.amount,
          description: `${recurring.description} (Recurring)`,
          date: recurring.nextDueDate,
        });

        // Calculate next due date
        let nextDate: Date;
        switch (recurring.frequency) {
          case 'daily':
            nextDate = addDays(dueDate, 1);
            break;
          case 'weekly':
            nextDate = addWeeks(dueDate, 1);
            break;
          case 'monthly':
            nextDate = addMonths(dueDate, 1);
            break;
        }

        // Update the recurring expense
        setRecurringExpenses(prev => 
          prev.map(r => 
            r.id === recurring.id 
              ? { ...r, nextDueDate: nextDate.toISOString().split('T')[0] }
              : r
          )
        );

        toast({
          title: 'Recurring expense added',
          description: `${recurring.description}: $${recurring.amount.toFixed(2)}`,
        });
      }
    });
  }, []);

  const handleAddRecurring = () => {
    if (!newRecurring.amount || parseFloat(newRecurring.amount) <= 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
      return;
    }

    const newItem: RecurringExpense = {
      id: `rec_${Date.now()}`,
      categoryId: newRecurring.categoryId,
      amount: parseFloat(newRecurring.amount),
      description: newRecurring.description || 'Recurring Expense',
      frequency: newRecurring.frequency,
      startDate: newRecurring.startDate,
      nextDueDate: newRecurring.startDate,
      isActive: true,
    };

    setRecurringExpenses(prev => [...prev, newItem]);
    setNewRecurring({
      categoryId: categories[0]?.id || '',
      amount: '',
      description: '',
      frequency: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
    });
    setShowAddForm(false);

    toast({ title: 'Recurring expense created', description: `Will repeat ${newRecurring.frequency}` });
  };

  const toggleActive = (id: string) => {
    setRecurringExpenses(prev =>
      prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r)
    );
  };

  const deleteRecurring = (id: string) => {
    setRecurringExpenses(prev => prev.filter(r => r.id !== id));
    toast({ title: 'Recurring expense deleted' });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-card w-full max-w-lg rounded-3xl shadow-2xl border border-border overflow-hidden max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <RefreshCw className="text-primary" size={20} />
            <h2 className="text-xl font-bold text-foreground">Recurring Expenses</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary transition-colors">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Add Button */}
          {!showAddForm && (
            <Button onClick={() => setShowAddForm(true)} className="w-full mb-4">
              <Plus size={18} className="mr-2" />
              Add Recurring Expense
            </Button>
          )}

          {/* Add Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-secondary/50 rounded-2xl p-4 mb-4 space-y-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">Amount</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newRecurring.amount}
                      onChange={e => setNewRecurring({ ...newRecurring, amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">Frequency</label>
                    <select
                      value={newRecurring.frequency}
                      onChange={e => setNewRecurring({ ...newRecurring, frequency: e.target.value as any })}
                      className="w-full h-10 rounded-md border border-input bg-background px-3"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Description</label>
                  <Input
                    placeholder="e.g., Netflix, Rent, Gym"
                    value={newRecurring.description}
                    onChange={e => setNewRecurring({ ...newRecurring, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.slice(0, 5).map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setNewRecurring({ ...newRecurring, categoryId: cat.id })}
                        className={`px-2 py-1 rounded-lg text-sm transition-all ${
                          newRecurring.categoryId === cat.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary'
                        }`}
                      >
                        {cat.icon} {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Start Date</label>
                  <Input
                    type="date"
                    value={newRecurring.startDate}
                    onChange={e => setNewRecurring({ ...newRecurring, startDate: e.target.value })}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleAddRecurring} className="flex-1">Add</Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* List */}
          {recurringExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <RefreshCw size={48} className="mb-3 opacity-50" />
              <p>No recurring expenses</p>
              <p className="text-sm">Add subscriptions and bills that repeat</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recurringExpenses.map((recurring, index) => {
                const category = categories.find(c => c.id === recurring.categoryId);
                return (
                  <motion.div
                    key={recurring.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      recurring.isActive 
                        ? 'bg-card border-border' 
                        : 'bg-secondary/30 border-border/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                        style={{ backgroundColor: category?.color ? `${category.color}20` : undefined }}
                      >
                        {category?.icon || '📦'}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{recurring.description}</p>
                        <p className="text-xs text-muted-foreground">
                          ${recurring.amount.toFixed(2)} • {recurring.frequency} • Next: {format(new Date(recurring.nextDueDate), 'MMM d')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleActive(recurring.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          recurring.isActive ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      >
                        <RefreshCw size={16} />
                      </button>
                      <button
                        onClick={() => deleteRecurring(recurring.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
