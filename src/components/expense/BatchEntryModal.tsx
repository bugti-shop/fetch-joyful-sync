import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, Calendar, Layers } from 'lucide-react';
import { useExpense } from '@/contexts/ExpenseContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { loadCurrencySettings, formatCurrencyAmount } from '@/lib/currency';
import { useSmartSuggestions } from '@/hooks/useSmartSuggestions';
import { motion, AnimatePresence } from 'framer-motion';

interface BatchEntry {
  id: string;
  type: 'expense' | 'income';
  amount: string;
  description: string;
  categoryId: string;
  date: string;
}

interface BatchEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BatchEntryModal = ({ isOpen, onClose }: BatchEntryModalProps) => {
  const { categories, addExpense, addIncome } = useExpense();
  const { toast } = useToast();
  const { suggestCategory, suggestAmount } = useSmartSuggestions();
  const [entries, setEntries] = useState<BatchEntry[]>([]);
  const [baseCurrency, setBaseCurrency] = useState('USD');

  const expenseCategories = categories.filter(c => c.budget > 0);
  const incomeCategories = categories.filter(c => c.budget === 0);

  useEffect(() => {
    if (isOpen) {
      const settings = loadCurrencySettings();
      setBaseCurrency(settings.baseCurrency);
      // Start with one empty entry
      setEntries([createEmptyEntry()]);
    }
  }, [isOpen]);

  const createEmptyEntry = (): BatchEntry => ({
    id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'expense',
    amount: '',
    description: '',
    categoryId: expenseCategories[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
  });

  const addEntry = () => {
    setEntries(prev => [...prev, createEmptyEntry()]);
  };

  const removeEntry = (id: string) => {
    if (entries.length > 1) {
      setEntries(prev => prev.filter(e => e.id !== id));
    }
  };

  const updateEntry = (id: string, updates: Partial<BatchEntry>) => {
    setEntries(prev => prev.map(entry => {
      if (entry.id !== id) return entry;
      
      const updated = { ...entry, ...updates };
      
      // If type changed, update categoryId to match
      if (updates.type && updates.type !== entry.type) {
        const cats = updates.type === 'expense' ? expenseCategories : incomeCategories;
        updated.categoryId = cats[0]?.id || '';
      }
      
      // Smart suggestions when description changes
      if (updates.description && updates.description !== entry.description) {
        const suggestedCat = suggestCategory(updates.description, updated.type);
        if (suggestedCat) {
          updated.categoryId = suggestedCat;
        }
        
        if (!updated.amount) {
          const suggestedAmt = suggestAmount(updates.description);
          if (suggestedAmt) {
            updated.amount = suggestedAmt.toString();
          }
        }
      }
      
      return updated;
    }));
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.icon || '📦';
  };

  const handleSubmit = () => {
    const validEntries = entries.filter(e => e.amount && parseFloat(e.amount) > 0 && e.categoryId);
    
    if (validEntries.length === 0) {
      toast({ 
        title: 'No valid entries', 
        description: 'Please add at least one transaction with amount and category', 
        variant: 'destructive' 
      });
      return;
    }

    let expenseCount = 0;
    let incomeCount = 0;
    let totalExpense = 0;
    let totalIncome = 0;

    validEntries.forEach(entry => {
      const amount = parseFloat(entry.amount);
      const transactionData = {
        categoryId: entry.categoryId,
        amount,
        description: entry.description || (entry.type === 'expense' ? 'Batch Expense' : 'Batch Income'),
        date: entry.date,
      };

      if (entry.type === 'expense') {
        addExpense(transactionData);
        expenseCount++;
        totalExpense += amount;
      } else {
        addIncome(transactionData);
        incomeCount++;
        totalIncome += amount;
      }
    });

    const messages: string[] = [];
    if (expenseCount > 0) {
      messages.push(`${expenseCount} expense${expenseCount > 1 ? 's' : ''} (${formatCurrencyAmount(totalExpense, baseCurrency)})`);
    }
    if (incomeCount > 0) {
      messages.push(`${incomeCount} income${incomeCount > 1 ? 's' : ''} (${formatCurrencyAmount(totalIncome, baseCurrency)})`);
    }

    toast({ 
      title: 'Batch added successfully! ✓', 
      description: messages.join(' and ') 
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-card w-full max-w-lg rounded-3xl shadow-2xl border border-border overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary">
            <X size={20} className="text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <Layers size={20} className="text-primary" />
            <h2 className="text-xl font-bold text-foreground">Batch Entry</h2>
          </div>
          <div className="w-9" />
        </div>

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence mode="popLayout">
            {entries.map((entry, index) => (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                className="bg-secondary/50 rounded-2xl p-3 space-y-3"
              >
                {/* Entry Header */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                  <div className="flex items-center gap-2">
                    {/* Type Toggle */}
                    <div className="flex bg-background rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => updateEntry(entry.id, { type: 'expense' })}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                          entry.type === 'expense' 
                            ? 'bg-destructive text-destructive-foreground' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Expense
                      </button>
                      <button
                        type="button"
                        onClick={() => updateEntry(entry.id, { type: 'income' })}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                          entry.type === 'income' 
                            ? 'bg-green-500 text-white' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Income
                      </button>
                    </div>
                    {entries.length > 1 && (
                      <button
                        onClick={() => removeEntry(entry.id)}
                        className="p-1.5 text-destructive hover:bg-destructive/10 rounded-full"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Amount & Description Row */}
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Amount"
                    value={entry.amount}
                    onChange={e => updateEntry(entry.id, { amount: e.target.value })}
                    className="w-28 text-lg font-bold"
                  />
                  <Input
                    type="text"
                    placeholder="Description (smart suggest)"
                    value={entry.description}
                    onChange={e => updateEntry(entry.id, { description: e.target.value })}
                    className="flex-1"
                  />
                </div>

                {/* Category & Date Row */}
                <div className="flex gap-2">
                  <Select
                    value={entry.categoryId}
                    onValueChange={value => updateEntry(entry.id, { categoryId: value })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Category">
                        {entry.categoryId && (
                          <span className="flex items-center gap-2">
                            <span>{getCategoryIcon(entry.categoryId)}</span>
                            <span className="truncate">
                              {categories.find(c => c.id === entry.categoryId)?.name}
                            </span>
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {(entry.type === 'expense' ? expenseCategories : incomeCategories).map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <span className="flex items-center gap-2">
                            <span>{cat.icon}</span>
                            <span>{cat.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="date"
                    value={entry.date}
                    onChange={e => updateEntry(entry.id, { date: e.target.value })}
                    className="w-36"
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add More Button */}
          <motion.button
            layout
            onClick={addEntry}
            className="w-full py-3 border-2 border-dashed border-primary/30 rounded-2xl flex items-center justify-center gap-2 text-primary hover:bg-primary/5 transition-colors"
          >
            <Plus size={20} />
            <span className="font-medium">Add Another</span>
          </motion.button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-card space-y-3">
          {/* Summary */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {entries.filter(e => e.amount && parseFloat(e.amount) > 0).length} valid entries
            </span>
            <span className="font-medium text-foreground">
              Total: {formatCurrencyAmount(
                entries.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0),
                baseCurrency
              )}
            </span>
          </div>

          <Button onClick={handleSubmit} className="w-full h-12 text-lg font-semibold">
            <Check size={20} className="mr-2" />
            Save All ({entries.filter(e => e.amount && parseFloat(e.amount) > 0).length})
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
