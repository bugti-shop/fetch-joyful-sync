import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, DollarSign, FileText } from 'lucide-react';
import { useExpense } from '@/contexts/ExpenseContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCategory?: string;
}

export const AddExpenseModal = ({ isOpen, onClose, preselectedCategory }: AddExpenseModalProps) => {
  const { categories, addExpense } = useExpense();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(preselectedCategory || categories[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: 'Invalid amount', description: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }

    addExpense({
      categoryId,
      amount: parseFloat(amount),
      description: description || 'Expense',
      date,
    });

    toast({ title: 'Expense added', description: `$${parseFloat(amount).toFixed(2)} added to ${categories.find(c => c.id === categoryId)?.name}` });
    
    // Reset form
    setAmount('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    onClose();
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
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">Add Expense</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary transition-colors">
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Amount */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <DollarSign size={16} />
                  Amount
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="text-2xl font-bold h-14"
                />
              </div>

              {/* Category Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Category</label>
                <div className="grid grid-cols-5 gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                        categoryId === cat.id 
                          ? 'bg-primary text-primary-foreground scale-105 shadow-lg' 
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      <span className="text-xl">{cat.icon}</span>
                      <span className="text-[10px] truncate w-full text-center">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <FileText size={16} />
                  Description
                </label>
                <Input
                  type="text"
                  placeholder="What was this expense for?"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Calendar size={16} />
                  Date
                </label>
                <Input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full h-12 text-lg font-semibold">
                Add Expense
              </Button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
