import { useState, useEffect } from 'react';
import { X, Bell, Calendar, Clock, Plus, Trash2, BellRing, Check } from 'lucide-react';
import { useExpense } from '@/contexts/ExpenseContext';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, differenceInDays, isPast, isToday, isTomorrow } from 'date-fns';

interface BillReminder {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  frequency: 'one-time' | 'weekly' | 'monthly' | 'yearly';
  categoryId: string;
  reminderDays: number;
  enabled: boolean;
  lastNotified?: string;
}

interface BillRemindersProps {
  onClose: () => void;
}

const STORAGE_KEY = 'jarify_bill_reminders';
const REMINDER_LOG_KEY = 'jarify_reminder_log';

export const BillReminders = ({ onClose }: BillRemindersProps) => {
  const { categories } = useExpense();
  const { toast } = useToast();
  const [reminders, setReminders] = useState<BillReminder[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newReminder, setNewReminder] = useState<Partial<BillReminder>>({
    name: '',
    amount: 0,
    dueDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    frequency: 'monthly',
    categoryId: categories.find(c => c.budget > 0)?.id || categories[0]?.id || '',
    reminderDays: 3,
    enabled: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setReminders(JSON.parse(saved));
  }, []);

  const saveReminders = (updated: BillReminder[]) => {
    setReminders(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const getNextDueDate = (currentDate: Date, frequency: string): Date => {
    const next = new Date(currentDate);
    switch (frequency) {
      case 'weekly': next.setDate(next.getDate() + 7); break;
      case 'monthly': next.setMonth(next.getMonth() + 1); break;
      case 'yearly': next.setFullYear(next.getFullYear() + 1); break;
    }
    return next;
  };

  const handleAddReminder = () => {
    if (!newReminder.name || !newReminder.amount) {
      toast({ title: 'Missing fields', description: 'Please fill in all required fields' });
      return;
    }

    const reminder: BillReminder = {
      id: `bill_${Date.now()}`,
      name: newReminder.name!,
      amount: newReminder.amount!,
      dueDate: newReminder.dueDate!,
      frequency: newReminder.frequency as BillReminder['frequency'],
      categoryId: newReminder.categoryId!,
      reminderDays: newReminder.reminderDays || 3,
      enabled: true,
    };

    saveReminders([...reminders, reminder]);
    setNewReminder({
      name: '', amount: 0, dueDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      frequency: 'monthly', categoryId: categories.find(c => c.budget > 0)?.id || categories[0]?.id || '',
      reminderDays: 3, enabled: true,
    });
    setIsAdding(false);
    toast({ title: 'Reminder added', description: `You'll be notified ${reminder.reminderDays} days before` });
  };

  const deleteReminder = (id: string) => {
    saveReminders(reminders.filter(r => r.id !== id));
    toast({ title: 'Reminder deleted' });
  };

  const toggleReminder = (id: string) => {
    saveReminders(reminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const getStatusBadge = (dueDate: string) => {
    const due = new Date(dueDate);
    const daysUntil = differenceInDays(due, new Date());

    if (isPast(due) && !isToday(due)) return <span className="px-1.5 py-0.5 bg-destructive/20 text-destructive text-[10px] rounded-full">Overdue</span>;
    if (isToday(due)) return <span className="px-1.5 py-0.5 bg-destructive/20 text-destructive text-[10px] rounded-full">Today</span>;
    if (isTomorrow(due)) return <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-600 text-[10px] rounded-full">Tomorrow</span>;
    if (daysUntil <= 7) return <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-600 text-[10px] rounded-full">{daysUntil} days</span>;
    return <span className="px-1.5 py-0.5 bg-muted text-muted-foreground text-[10px] rounded-full">{format(due, 'MMM d')}</span>;
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-2xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <BellRing className="text-primary" size={22} />
            <h2 className="text-lg font-bold text-foreground">Bill Reminders</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-2 mb-4">
          {reminders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell size={32} className="mx-auto mb-2 opacity-50" />
              <p>No bill reminders set</p>
              <p className="text-sm">Add reminders to never miss a payment</p>
            </div>
          ) : (
            reminders.map((reminder) => {
              const category = categories.find(c => c.id === reminder.categoryId);
              return (
                <div key={reminder.id} className={`p-3 rounded-xl border ${reminder.enabled ? 'bg-card border-border' : 'bg-secondary/30 border-border/50 opacity-60'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{category?.icon || '📋'}</span>
                      <span className="font-medium text-sm text-foreground">{reminder.name}</span>
                      {getStatusBadge(reminder.dueDate)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Switch checked={reminder.enabled} onCheckedChange={() => toggleReminder(reminder.id)} className="scale-75" />
                      <button onClick={() => deleteReminder(reminder.id)} className="p-1 hover:bg-secondary rounded">
                        <Trash2 size={14} className="text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock size={10} /> Remind {reminder.reminderDays} days before</span>
                    <span className="font-medium text-foreground">${reminder.amount.toFixed(2)}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {reminder.frequency !== 'one-time' && `Repeats ${reminder.frequency}`}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {isAdding ? (
          <div className="p-4 bg-secondary/50 rounded-xl space-y-3">
            <Input placeholder="Bill name (e.g., Netflix, Rent)" value={newReminder.name} onChange={(e) => setNewReminder(prev => ({ ...prev, name: e.target.value }))} />
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-xs">Amount</Label>
                <Input type="number" placeholder="0.00" value={newReminder.amount || ''} onChange={(e) => setNewReminder(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="flex-1">
                <Label className="text-xs">Due Date</Label>
                <Input type="date" value={newReminder.dueDate} onChange={(e) => setNewReminder(prev => ({ ...prev, dueDate: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-xs">Frequency</Label>
                <select value={newReminder.frequency} onChange={(e) => setNewReminder(prev => ({ ...prev, frequency: e.target.value as BillReminder['frequency'] }))} className="w-full h-9 bg-background border border-border rounded-lg px-2 text-sm">
                  <option value="one-time">One-time</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="flex-1">
                <Label className="text-xs">Remind before</Label>
                <select value={newReminder.reminderDays} onChange={(e) => setNewReminder(prev => ({ ...prev, reminderDays: parseInt(e.target.value) }))} className="w-full h-9 bg-background border border-border rounded-lg px-2 text-sm">
                  <option value={1}>1 day</option>
                  <option value={3}>3 days</option>
                  <option value={7}>1 week</option>
                  <option value={14}>2 weeks</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsAdding(false)} className="flex-1 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium">Cancel</button>
              <button onClick={handleAddReminder} className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">Add Reminder</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setIsAdding(true)} className="w-full py-3 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary hover:text-primary flex items-center justify-center gap-2">
            <Plus size={18} /> Add Bill Reminder
          </button>
        )}
      </div>
    </div>
  );
};