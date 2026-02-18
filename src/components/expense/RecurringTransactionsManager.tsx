import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Calendar, Repeat, Trash2, Edit2, Check, DollarSign } from 'lucide-react';
import { useExpense } from '@/contexts/ExpenseContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { format, addDays, addWeeks, addMonths, addYears, isAfter, isBefore, parseISO, startOfDay } from 'date-fns';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

interface RecurringTransactionsManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RecurringTransaction {
  id: string;
  type: 'expense' | 'income';
  categoryId: string;
  amount: number;
  description: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  lastProcessed?: string;
  isActive: boolean;
  createdAt: string;
}

const STORAGE_KEY = 'jarify_recurring_transactions';

export const RecurringTransactionsManager = ({ isOpen, onClose }: RecurringTransactionsManagerProps) => {
  const { categories, addExpense, addIncome } = useExpense();
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formType, setFormType] = useState<'expense' | 'income'>('expense');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formFrequency, setFormFrequency] = useState<RecurringTransaction['frequency']>('monthly');
  const [formStartDate, setFormStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formEndDate, setFormEndDate] = useState('');

  // Load from storage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setRecurringTransactions(JSON.parse(saved));
    }
  }, []);

  // Save to storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recurringTransactions));
  }, [recurringTransactions]);

  // Process recurring transactions on open
  useEffect(() => {
    if (isOpen) {
      processRecurringTransactions();
    }
  }, [isOpen]);

  const getNextOccurrence = (lastDate: Date, frequency: RecurringTransaction['frequency']): Date => {
    switch (frequency) {
      case 'daily': return addDays(lastDate, 1);
      case 'weekly': return addWeeks(lastDate, 1);
      case 'biweekly': return addWeeks(lastDate, 2);
      case 'monthly': return addMonths(lastDate, 1);
      case 'yearly': return addYears(lastDate, 1);
      default: return addMonths(lastDate, 1);
    }
  };

  const processRecurringTransactions = () => {
    const today = startOfDay(new Date());
    let processedCount = 0;

    const updated = recurringTransactions.map(rt => {
      if (!rt.isActive) return rt;

      const startDate = parseISO(rt.startDate);
      const endDate = rt.endDate ? parseISO(rt.endDate) : null;
      let lastProcessed = rt.lastProcessed ? parseISO(rt.lastProcessed) : null;

      // If never processed, start from startDate
      if (!lastProcessed) {
        lastProcessed = startDate;
        // If start date is today or past, add the transaction
        if (!isAfter(startDate, today)) {
          if (rt.type === 'expense') {
            addExpense({
              categoryId: rt.categoryId,
              amount: rt.amount,
              description: rt.description,
              date: format(startDate, 'yyyy-MM-dd'),
            });
          } else {
            addIncome({
              categoryId: rt.categoryId,
              amount: rt.amount,
              description: rt.description,
              date: format(startDate, 'yyyy-MM-dd'),
            });
          }
          processedCount++;
        }
      }

      // Process any missed occurrences
      let nextOccurrence = getNextOccurrence(lastProcessed, rt.frequency);
      while (!isAfter(nextOccurrence, today)) {
        if (endDate && isAfter(nextOccurrence, endDate)) break;

        if (rt.type === 'expense') {
          addExpense({
            categoryId: rt.categoryId,
            amount: rt.amount,
            description: rt.description,
            date: format(nextOccurrence, 'yyyy-MM-dd'),
          });
        } else {
          addIncome({
            categoryId: rt.categoryId,
            amount: rt.amount,
            description: rt.description,
            date: format(nextOccurrence, 'yyyy-MM-dd'),
          });
        }
        processedCount++;
        lastProcessed = nextOccurrence;
        nextOccurrence = getNextOccurrence(lastProcessed, rt.frequency);
      }

      return {
        ...rt,
        lastProcessed: format(lastProcessed, 'yyyy-MM-dd'),
      };
    });

    if (processedCount > 0) {
      setRecurringTransactions(updated);
      toast.success(`Processed ${processedCount} recurring transaction(s)`);
    }
  };

  const expenseCategories = categories.filter(c => c.budget > 0);
  const incomeCategories = categories.filter(c => c.budget === 0);
  const filteredCategories = formType === 'expense' ? expenseCategories : incomeCategories;

  const resetForm = () => {
    setFormType('expense');
    setFormCategoryId('');
    setFormAmount('');
    setFormDescription('');
    setFormFrequency('monthly');
    setFormStartDate(format(new Date(), 'yyyy-MM-dd'));
    setFormEndDate('');
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleSubmit = () => {
    if (!formAmount || !formCategoryId || !formDescription) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newTransaction: RecurringTransaction = {
      id: editingId || `rt_${Date.now()}`,
      type: formType,
      categoryId: formCategoryId,
      amount: parseFloat(formAmount),
      description: formDescription,
      frequency: formFrequency,
      startDate: formStartDate,
      endDate: formEndDate || undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    if (editingId) {
      setRecurringTransactions(prev => prev.map(rt => rt.id === editingId ? newTransaction : rt));
      toast.success('Recurring transaction updated');
    } else {
      setRecurringTransactions(prev => [...prev, newTransaction]);
      toast.success('Recurring transaction added');
    }

    resetForm();
  };

  const handleEdit = (rt: RecurringTransaction) => {
    setEditingId(rt.id);
    setFormType(rt.type);
    setFormCategoryId(rt.categoryId);
    setFormAmount(rt.amount.toString());
    setFormDescription(rt.description);
    setFormFrequency(rt.frequency);
    setFormStartDate(rt.startDate);
    setFormEndDate(rt.endDate || '');
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    setRecurringTransactions(prev => prev.filter(rt => rt.id !== id));
    toast.success('Recurring transaction deleted');
  };

  const toggleActive = (id: string) => {
    setRecurringTransactions(prev => prev.map(rt => 
      rt.id === id ? { ...rt, isActive: !rt.isActive } : rt
    ));
  };

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(c => c.id === categoryId) || { name: 'Unknown', icon: '💰' };
  };

  const getFrequencyLabel = (freq: RecurringTransaction['frequency']) => {
    switch (freq) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'biweekly': return 'Every 2 weeks';
      case 'monthly': return 'Monthly';
      case 'yearly': return 'Yearly';
      default: return freq;
    }
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
            className="bg-card w-full max-w-lg rounded-3xl border border-border overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary transition-colors">
                <X size={20} className="text-muted-foreground" />
              </button>
              <div className="flex items-center gap-2">
                <Repeat className="text-primary" size={20} />
                <h2 className="text-lg font-bold text-foreground">Recurring Transactions</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowAddForm(true)}>
                <Plus size={20} />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <AnimatePresence mode="wait">
                {showAddForm ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-foreground">
                        {editingId ? 'Edit' : 'Add'} Recurring Transaction
                      </h3>
                      <button onClick={resetForm} className="text-sm text-muted-foreground hover:text-foreground">
                        Cancel
                      </button>
                    </div>

                    {/* Type Toggle */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setFormType('expense')}
                        className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                          formType === 'expense' 
                            ? 'bg-destructive/20 text-destructive border-2 border-destructive' 
                            : 'bg-secondary text-muted-foreground border-2 border-transparent'
                        }`}
                      >
                        Expense
                      </button>
                      <button
                        onClick={() => setFormType('income')}
                        className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                          formType === 'income' 
                            ? 'bg-green-500/20 text-green-500 border-2 border-green-500' 
                            : 'bg-secondary text-muted-foreground border-2 border-transparent'
                        }`}
                      >
                        Income
                      </button>
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={formAmount}
                        onChange={e => setFormAmount(e.target.value)}
                        className="text-xl font-bold h-12"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        placeholder="e.g., Netflix subscription"
                        value={formDescription}
                        onChange={e => setFormDescription(e.target.value)}
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={formCategoryId} onValueChange={setFormCategoryId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredCategories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.icon} {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Frequency */}
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Select value={formFrequency} onValueChange={(v) => setFormFrequency(v as RecurringTransaction['frequency'])}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Start Date */}
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={formStartDate}
                        onChange={e => setFormStartDate(e.target.value)}
                      />
                    </div>

                    {/* End Date (Optional) */}
                    <div className="space-y-2">
                      <Label>End Date (Optional)</Label>
                      <Input
                        type="date"
                        value={formEndDate}
                        onChange={e => setFormEndDate(e.target.value)}
                      />
                    </div>

                    {/* Submit */}
                    <Button onClick={handleSubmit} className="w-full h-12">
                      <Check size={18} className="mr-2" />
                      {editingId ? 'Update' : 'Add'} Recurring Transaction
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-3"
                  >
                    {recurringTransactions.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Repeat size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No recurring transactions</p>
                        <p className="text-sm">Add one to automate your tracking</p>
                        <Button onClick={() => setShowAddForm(true)} className="mt-4">
                          <Plus size={18} className="mr-2" />
                          Add First
                        </Button>
                      </div>
                    ) : (
                      recurringTransactions.map((rt, index) => {
                        const category = getCategoryInfo(rt.categoryId);
                        return (
                          <motion.div
                            key={rt.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`p-4 rounded-2xl border ${
                              rt.isActive ? 'bg-card border-border' : 'bg-secondary/30 border-border opacity-60'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                                  rt.type === 'income' ? 'bg-green-500/20' : 'bg-destructive/20'
                                }`}>
                                  {category.icon}
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{rt.description}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {category.name} • {getFrequencyLabel(rt.frequency)}
                                  </p>
                                </div>
                              </div>
                              <p className={`font-bold ${rt.type === 'income' ? 'text-green-500' : 'text-destructive'}`}>
                                {rt.type === 'income' ? '+' : '-'}${formatCurrency(rt.amount)}
                              </p>
                            </div>
                            
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                              <div className="flex items-center gap-2">
                                <Switch 
                                  checked={rt.isActive} 
                                  onCheckedChange={() => toggleActive(rt.id)}
                                />
                                <span className="text-xs text-muted-foreground">
                                  {rt.isActive ? 'Active' : 'Paused'}
                                </span>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleEdit(rt)}
                                  className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(rt.id)}
                                  className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
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