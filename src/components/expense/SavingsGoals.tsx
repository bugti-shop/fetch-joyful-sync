import { useState, useEffect } from 'react';
import { X, PiggyBank, Plus, Trash2, TrendingUp, Target, DollarSign, Edit2, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays } from 'date-fns';

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline?: string;
  icon: string;
  color: string;
  createdAt: string;
}

interface SavingsGoalsProps {
  onClose: () => void;
}

const STORAGE_KEY = 'jarify_savings_goals';
const GOAL_ICONS = ['🏖️', '📱', '🚗', '🏠', '💻', '🎮', '👗', '✈️', '🎓', '💍', '🎸', '📷'];
const GOAL_COLORS = ['hsl(200, 80%, 50%)', 'hsl(280, 70%, 55%)', 'hsl(340, 75%, 55%)', 'hsl(25, 90%, 50%)', 'hsl(160, 70%, 45%)', 'hsl(45, 90%, 50%)'];

export const SavingsGoals = ({ onClose }: SavingsGoalsProps) => {
  const { toast } = useToast();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [addAmount, setAddAmount] = useState<Record<string, string>>({});
  const [newGoal, setNewGoal] = useState<Partial<SavingsGoal>>({ name: '', targetAmount: 500, savedAmount: 0, icon: '🎯', color: GOAL_COLORS[0] });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setGoals(JSON.parse(saved));
  }, []);

  const saveGoals = (updated: SavingsGoal[]) => {
    setGoals(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleAddGoal = () => {
    if (!newGoal.name || !newGoal.targetAmount) {
      toast({ title: 'Missing fields', description: 'Please enter a name and target amount' });
      return;
    }
    const goal: SavingsGoal = {
      id: `savings_${Date.now()}`, name: newGoal.name!, targetAmount: newGoal.targetAmount!,
      savedAmount: newGoal.savedAmount || 0, deadline: newGoal.deadline, icon: newGoal.icon || '🎯',
      color: newGoal.color || GOAL_COLORS[0], createdAt: new Date().toISOString(),
    };
    saveGoals([...goals, goal]);
    setNewGoal({ name: '', targetAmount: 500, savedAmount: 0, icon: '🎯', color: GOAL_COLORS[0] });
    setIsAdding(false);
    toast({ title: 'Goal created!', description: `Saving towards ${goal.name}` });
  };

  const handleAddSavings = (goalId: string) => {
    const amount = parseFloat(addAmount[goalId] || '0');
    if (amount <= 0) return;
    saveGoals(goals.map(g => {
      if (g.id === goalId) {
        const newSaved = Math.min(g.savedAmount + amount, g.targetAmount);
        if (newSaved >= g.targetAmount) toast({ title: '🎉 Goal Achieved!', description: `Congratulations! You've reached your ${g.name} goal!` });
        else toast({ title: 'Savings added', description: `+$${amount.toFixed(2)} to ${g.name}` });
        return { ...g, savedAmount: newSaved };
      }
      return g;
    }));
    setAddAmount(prev => ({ ...prev, [goalId]: '' }));
  };

  const deleteGoal = (id: string) => {
    saveGoals(goals.filter(g => g.id !== id));
    toast({ title: 'Goal deleted' });
  };

  const getDaysRemaining = (deadline?: string) => {
    if (!deadline) return null;
    const days = differenceInDays(new Date(deadline), new Date());
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.savedAmount, 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-2xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <PiggyBank className="text-primary" size={22} />
            <h2 className="text-lg font-bold text-foreground">Savings Goals</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {goals.length > 0 && (
          <div className="p-3 bg-primary/10 rounded-xl mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Total Progress</span>
              <span className="font-semibold text-foreground">${totalSaved.toFixed(0)} / ${totalTarget.toFixed(0)}</span>
            </div>
            <Progress value={overallProgress} className="h-2 [&>div]:bg-primary" />
            <p className="text-xs text-muted-foreground mt-1 text-right">{overallProgress.toFixed(0)}% of all goals</p>
          </div>
        )}

        <div className="space-y-3 mb-4">
          {goals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <PiggyBank size={32} className="mx-auto mb-2 opacity-50" />
              <p>No savings goals yet</p>
              <p className="text-sm">Start saving for something special!</p>
            </div>
          ) : (
            goals.map((goal) => {
              const percentage = (goal.savedAmount / goal.targetAmount) * 100;
              const remaining = goal.targetAmount - goal.savedAmount;
              const daysInfo = getDaysRemaining(goal.deadline);
              return (
                <div key={goal.id} className="p-3 rounded-xl border border-border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: `${goal.color}20` }}>{goal.icon}</div>
                      <div>
                        <span className="font-medium text-sm text-foreground">{goal.name}</span>
                        {daysInfo && <p className={`text-[10px] ${daysInfo === 'Overdue' ? 'text-destructive' : 'text-muted-foreground'}`}>{daysInfo}</p>}
                      </div>
                    </div>
                    <button onClick={() => deleteGoal(goal.id)} className="p-1 hover:bg-secondary rounded"><Trash2 size={14} className="text-muted-foreground" /></button>
                  </div>
                  <Progress value={Math.min(percentage, 100)} className="h-2 mb-2" indicatorColor={percentage >= 100 ? 'hsl(145, 63%, 42%)' : goal.color} />
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted-foreground">${goal.savedAmount.toFixed(0)} saved</span>
                    <span className={percentage >= 100 ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}>{percentage >= 100 ? '✓ Complete!' : `$${remaining.toFixed(0)} to go`}</span>
                  </div>
                  {percentage < 100 && (
                    <div className="flex gap-2">
                      <Input type="number" placeholder="Add amount" value={addAmount[goal.id] || ''} onChange={(e) => setAddAmount(prev => ({ ...prev, [goal.id]: e.target.value }))} className="h-8 text-sm" />
                      <button onClick={() => handleAddSavings(goal.id)} className="px-3 h-8 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-1"><Plus size={14} />Add</button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {isAdding ? (
          <div className="p-4 bg-secondary/50 rounded-xl space-y-3">
            <Input placeholder="What are you saving for?" value={newGoal.name} onChange={(e) => setNewGoal(prev => ({ ...prev, name: e.target.value }))} />
            <div className="flex gap-2">
              <div className="flex-1"><Label className="text-xs">Target Amount</Label><Input type="number" placeholder="0" value={newGoal.targetAmount || ''} onChange={(e) => setNewGoal(prev => ({ ...prev, targetAmount: parseFloat(e.target.value) || 0 }))} /></div>
              <div className="flex-1"><Label className="text-xs">Already Saved</Label><Input type="number" placeholder="0" value={newGoal.savedAmount || ''} onChange={(e) => setNewGoal(prev => ({ ...prev, savedAmount: parseFloat(e.target.value) || 0 }))} /></div>
            </div>
            <div><Label className="text-xs">Deadline (optional)</Label><Input type="date" value={newGoal.deadline || ''} onChange={(e) => setNewGoal(prev => ({ ...prev, deadline: e.target.value }))} /></div>
            <div><Label className="text-xs">Icon</Label><div className="flex flex-wrap gap-2 mt-1">{GOAL_ICONS.map(icon => (<button key={icon} onClick={() => setNewGoal(prev => ({ ...prev, icon }))} className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center ${newGoal.icon === icon ? 'bg-primary/20 ring-2 ring-primary' : 'bg-secondary hover:bg-secondary/80'}`}>{icon}</button>))}</div></div>
            <div><Label className="text-xs">Color</Label><div className="flex gap-2 mt-1">{GOAL_COLORS.map(color => (<button key={color} onClick={() => setNewGoal(prev => ({ ...prev, color }))} className={`w-6 h-6 rounded-full ${newGoal.color === color ? 'ring-2 ring-offset-2 ring-primary' : ''}`} style={{ backgroundColor: color }} />))}</div></div>
            <div className="flex gap-2">
              <button onClick={() => setIsAdding(false)} className="flex-1 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium">Cancel</button>
              <button onClick={handleAddGoal} className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">Create Goal</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setIsAdding(true)} className="w-full py-3 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary hover:text-primary flex items-center justify-center gap-2"><Plus size={18} />Add Savings Goal</button>
        )}
      </div>
    </div>
  );
};