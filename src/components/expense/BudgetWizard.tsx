import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, DollarSign, Sparkles, Check, AlertCircle } from 'lucide-react';
import { useExpense } from '@/contexts/ExpenseContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

interface BudgetWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const BUDGET_TEMPLATES = {
  conservative: { name: 'Conservative', description: 'Focus on savings and essentials', allocations: { rent: 25, utilities: 5, groceries: 12, transport: 8, health: 5, insurance: 5, education: 3, entertainment: 5, shopping: 5, misc: 7, savings: 20 } },
  balanced: { name: 'Balanced', description: 'Mix of saving and lifestyle', allocations: { rent: 28, utilities: 5, groceries: 10, transport: 10, health: 4, insurance: 4, education: 3, entertainment: 8, shopping: 8, misc: 5, savings: 15 } },
  flexible: { name: 'Flexible', description: 'More for lifestyle, less savings', allocations: { rent: 30, utilities: 5, groceries: 10, transport: 10, health: 3, insurance: 3, education: 2, entertainment: 12, shopping: 10, misc: 5, savings: 10 } }
};

export const BudgetWizard = ({ isOpen, onClose }: BudgetWizardProps) => {
  const { categories, updateCategoryBudget } = useExpense();
  const [step, setStep] = useState(1);
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<'conservative' | 'balanced' | 'flexible'>('balanced');
  const [customBudgets, setCustomBudgets] = useState<Record<string, number>>({});

  const expenseCategories = categories.filter(c => c.budget > 0 || !['salary', 'freelance', 'bonus', 'investment', 'rental', 'dividends', 'refund', 'other_income'].includes(c.id));
  const income = parseFloat(monthlyIncome) || 0;

  const generateRecommendations = () => {
    const template = BUDGET_TEMPLATES[selectedTemplate];
    return expenseCategories.map(cat => {
      const percentage = (template.allocations as any)[cat.id] || 3;
      const amount = Math.round((income * percentage) / 100);
      let priority: 'essential' | 'important' | 'flexible' = 'flexible';
      if (['rent', 'mortgage', 'utilities', 'groceries', 'health', 'insurance'].includes(cat.id)) priority = 'essential';
      else if (['transport', 'education', 'phone', 'internet'].includes(cat.id)) priority = 'important';
      return { categoryId: cat.id, name: cat.name, icon: cat.icon, percentage, amount: customBudgets[cat.id] ?? amount, priority };
    }).sort((a, b) => ({ essential: 0, important: 1, flexible: 2 }[a.priority] - { essential: 0, important: 1, flexible: 2 }[b.priority]));
  };

  const recommendations = generateRecommendations();
  const totalAllocated = recommendations.reduce((sum, r) => sum + r.amount, 0);
  const remaining = income - totalAllocated;

  const applyBudgets = () => {
    recommendations.forEach(rec => updateCategoryBudget(rec.categoryId, rec.amount));
    toast.success('Budgets applied successfully!');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-card w-full max-w-lg rounded-3xl shadow-2xl border border-border overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary"><X size={20} className="text-muted-foreground" /></button>
          <div className="flex items-center gap-2"><Sparkles className="text-primary" size={20} /><h2 className="text-lg font-bold text-foreground">Budget Wizard</h2></div>
          <div className="w-9" />
        </div>
        <div className="px-4 pt-4"><Progress value={(step / 3) * 100} className="h-2" /><p className="text-xs text-muted-foreground mt-2 text-center">Step {step} of 3</p></div>
        <div className="flex-1 overflow-y-auto p-4">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center"><div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"><DollarSign size={32} className="text-primary" /></div><h3 className="text-xl font-bold text-foreground">What's your monthly income?</h3><p className="text-sm text-muted-foreground mt-2">We'll use this to recommend smart budget allocations</p></div>
              <div className="space-y-2"><Label>Monthly Income</Label><Input type="number" placeholder="5000" value={monthlyIncome} onChange={e => setMonthlyIncome(e.target.value)} className="text-2xl font-bold h-16 text-center" /></div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-6"><h3 className="text-xl font-bold text-foreground">Choose your budgeting style</h3></div>
              {Object.entries(BUDGET_TEMPLATES).map(([key, template]) => (
                <button key={key} onClick={() => setSelectedTemplate(key as any)} className={`w-full p-4 rounded-2xl border-2 text-left ${selectedTemplate === key ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                  <div className="flex items-center justify-between"><div><p className="font-semibold text-foreground">{template.name}</p><p className="text-sm text-muted-foreground">{template.description}</p><p className="text-xs text-primary mt-1">{template.allocations.savings}% savings target</p></div>{selectedTemplate === key && <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center"><Check size={14} className="text-primary-foreground" /></div>}</div>
                </button>
              ))}
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-4"><h3 className="text-xl font-bold text-foreground">Review your budgets</h3></div>
              <div className={`p-3 rounded-xl ${remaining >= 0 ? 'bg-green-500/10 border border-green-500/30' : 'bg-destructive/10 border border-destructive/30'}`}>
                <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Income:</span><span className="font-bold text-foreground">${formatCurrency(income)}</span></div>
                <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Allocated:</span><span className="font-bold text-foreground">${formatCurrency(totalAllocated)}</span></div>
                <div className="flex justify-between items-center border-t border-border pt-2 mt-2"><span className="text-sm font-medium">Remaining:</span><span className={`font-bold ${remaining >= 0 ? 'text-green-500' : 'text-destructive'}`}>${formatCurrency(Math.abs(remaining))}{remaining < 0 && ' over'}</span></div>
              </div>
              {remaining < 0 && <div className="flex items-center gap-2 text-destructive text-sm"><AlertCircle size={16} /><span>Your allocations exceed your income.</span></div>}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recommendations.map(rec => (
                  <div key={rec.categoryId} className="flex items-center gap-3 p-2 bg-secondary/50 rounded-xl">
                    <span className="text-xl">{rec.icon}</span>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground truncate">{rec.name}</p><p className={`text-xs ${rec.priority === 'essential' ? 'text-green-500' : rec.priority === 'important' ? 'text-yellow-500' : 'text-muted-foreground'}`}>{rec.priority}</p></div>
                    <Input type="number" value={rec.amount} onChange={e => setCustomBudgets(prev => ({ ...prev, [rec.categoryId]: parseFloat(e.target.value) || 0 }))} className="w-24 h-8 text-right text-sm" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-border flex gap-3">
          {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1"><ChevronLeft size={18} className="mr-1" />Back</Button>}
          {step < 3 ? <Button onClick={() => setStep(step + 1)} className="flex-1" disabled={step === 1 && !monthlyIncome}>Next<ChevronRight size={18} className="ml-1" /></Button> : <Button onClick={applyBudgets} className="flex-1" disabled={remaining < 0}><Check size={18} className="mr-1" />Apply Budgets</Button>}
        </div>
      </div>
    </div>
  );
};