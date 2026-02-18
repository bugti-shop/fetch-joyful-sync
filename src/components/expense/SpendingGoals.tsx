import { useState, useEffect } from 'react';
import { X, Target, Bell, TrendingUp, AlertTriangle, Check, Plus, Trash2 } from 'lucide-react';
import { useExpense } from '@/contexts/ExpenseContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface SpendingGoalsProps {
  onClose: () => void;
}

interface SpendingGoal {
  id: string;
  name: string;
  type: 'weekly' | 'monthly';
  targetAmount: number;
  notifyAt: number;
  enabled: boolean;
}

const STORAGE_KEY = 'jarify_spending_goals';
const NOTIFICATIONS_KEY = 'jarify_goal_notifications';

export const SpendingGoals = ({ onClose }: SpendingGoalsProps) => {
  const { getTotalExpenses } = useExpense();
  const { toast } = useToast();
  const [goals, setGoals] = useState<SpendingGoal[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<SpendingGoal>>({
    name: '',
    type: 'monthly',
    targetAmount: 1000,
    notifyAt: 80,
    enabled: true,
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const notifSetting = localStorage.getItem(NOTIFICATIONS_KEY);
    if (saved) {
      setGoals(JSON.parse(saved));
    } else {
      setGoals([
        { id: 'weekly_default', name: 'Weekly Budget', type: 'weekly', targetAmount: 500, notifyAt: 80, enabled: true },
        { id: 'monthly_default', name: 'Monthly Budget', type: 'monthly', targetAmount: 2000, notifyAt: 80, enabled: true },
      ]);
    }
    if (notifSetting !== null) {
      setNotificationsEnabled(notifSetting === 'true');
    }
  }, []);

  const saveGoals = (updatedGoals: SpendingGoal[]) => {
    setGoals(updatedGoals);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedGoals));
  };

  const saveNotificationSetting = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    localStorage.setItem(NOTIFICATIONS_KEY, String(enabled));
  };

  const getSpendingForGoal = (goal: SpendingGoal): number => {
    return getTotalExpenses(goal.type);
  };

  const handleAddGoal = () => {
    if (!newGoal.name || !newGoal.targetAmount) {
      toast({ title: 'Missing fields', description: 'Please fill in all fields' });
      return;
    }

    const goal: SpendingGoal = {
      id: `goal_${Date.now()}`,
      name: newGoal.name!,
      type: newGoal.type as 'weekly' | 'monthly',
      targetAmount: newGoal.targetAmount!,
      notifyAt: newGoal.notifyAt || 80,
      enabled: true,
    };

    saveGoals([...goals, goal]);
    setNewGoal({ name: '', type: 'monthly', targetAmount: 1000, notifyAt: 80, enabled: true });
    setIsAdding(false);
    toast({ title: 'Goal added', description: 'Your spending goal has been created' });
  };

  const handleDeleteGoal = (goalId: string) => {
    saveGoals(goals.filter(g => g.id !== goalId));
    toast({ title: 'Goal deleted' });
  };

  const toggleGoal = (goalId: string) => {
    saveGoals(goals.map(g => g.id === goalId ? { ...g, enabled: !g.enabled } : g));
  };

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Target className="text-primary" size={22} />
            <h2 className="text-lg font-bold text-foreground">Spending Goals</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl mb-4">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-primary" />
            <Label htmlFor="goal-notifications" className="text-sm">Alert Notifications</Label>
          </div>
          <Switch id="goal-notifications" checked={notificationsEnabled} onCheckedChange={saveNotificationSetting} />
        </div>

        <div className="space-y-3">
          {goals.map((goal) => {
            const spent = getSpendingForGoal(goal);
            const percentage = Math.min((spent / goal.targetAmount) * 100, 100);
            const isOver = spent > goal.targetAmount;
            const isNear = percentage >= goal.notifyAt && !isOver;

            return (
              <div
                key={goal.id}
                className={`p-3 rounded-xl border ${
                  isOver ? 'bg-destructive/10 border-destructive/30' : isNear ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-secondary/50 border-border'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isOver ? <AlertTriangle size={16} className="text-destructive" /> : isNear ? <TrendingUp size={16} className="text-yellow-500" /> : <Check size={16} className="text-emerald-500" />}
                    <span className="font-medium text-sm text-foreground">{goal.name}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-muted rounded-full text-muted-foreground">{goal.type}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch checked={goal.enabled} onCheckedChange={() => toggleGoal(goal.id)} className="scale-75" />
                    <button onClick={() => handleDeleteGoal(goal.id)} className="p-1 hover:bg-secondary rounded">
                      <Trash2 size={14} className="text-muted-foreground" />
                    </button>
                  </div>
                </div>

                <div className="mb-2">
                  <Progress 
                    value={percentage} 
                    className={`h-2 ${isOver ? '[&>div]:bg-destructive' : isNear ? '[&>div]:bg-yellow-500' : '[&>div]:bg-emerald-500'}`}
                  />
                </div>

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>${spent.toFixed(0)} / ${goal.targetAmount.toFixed(0)}</span>
                  <span className={isOver ? 'text-destructive' : isNear ? 'text-yellow-500' : ''}>
                    {percentage.toFixed(0)}% {isOver ? '(over!)' : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {isAdding ? (
          <div className="mt-4 p-4 bg-secondary/50 rounded-xl space-y-3">
            <Input placeholder="Goal name (e.g., Vacation Budget)" value={newGoal.name} onChange={(e) => setNewGoal(prev => ({ ...prev, name: e.target.value }))} />
            <div className="flex gap-2">
              <select value={newGoal.type} onChange={(e) => setNewGoal(prev => ({ ...prev, type: e.target.value as 'weekly' | 'monthly' }))} className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm">
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <Input type="number" placeholder="Target $" value={newGoal.targetAmount} onChange={(e) => setNewGoal(prev => ({ ...prev, targetAmount: parseFloat(e.target.value) || 0 }))} className="flex-1" />
            </div>
            <div className="flex gap-2 items-center">
              <Label className="text-xs whitespace-nowrap">Alert at</Label>
              <Input type="number" value={newGoal.notifyAt} onChange={(e) => setNewGoal(prev => ({ ...prev, notifyAt: parseInt(e.target.value) || 80 }))} className="w-16" />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsAdding(false)} className="flex-1 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium">Cancel</button>
              <button onClick={handleAddGoal} className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">Add Goal</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setIsAdding(true)} className="w-full mt-4 py-3 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary hover:text-primary flex items-center justify-center gap-2">
            <Plus size={18} />
            Add Spending Goal
          </button>
        )}
      </div>
    </div>
  );
};