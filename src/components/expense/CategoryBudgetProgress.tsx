import { motion } from 'framer-motion';
import { useExpense } from '@/contexts/ExpenseContext';
import { AlertTriangle, TrendingUp, Check } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface CategoryBudgetProgressProps {
  limit?: number;
  showLabels?: boolean;
}

export const CategoryBudgetProgress = ({ limit = 5, showLabels = true }: CategoryBudgetProgressProps) => {
  const { categories, getCategoryTotal } = useExpense();

  // Get categories with budgets and their spending
  const categoryProgress = categories
    .filter(cat => cat.budget > 0)
    .map(cat => {
      const spent = getCategoryTotal(cat.id, 'monthly');
      const percentage = (spent / cat.budget) * 100;
      const remaining = cat.budget - spent;
      const isOver = percentage > 100;
      const isNear = percentage >= 80 && !isOver;

      return {
        ...cat,
        spent,
        percentage,
        remaining,
        isOver,
        isNear,
      };
    })
    .sort((a, b) => b.percentage - a.percentage) // Sort by percentage (highest first)
    .slice(0, limit);

  if (categoryProgress.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {showLabels && (
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-medium text-muted-foreground">Category Budgets</h3>
          <span className="text-[10px] text-muted-foreground">This month</span>
        </div>
      )}
      
      <div className="space-y-2">
        {categoryProgress.map((cat, index) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card/50 rounded-lg p-2.5 border border-border/50"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm">{cat.icon}</span>
                <span className="text-xs font-medium text-foreground truncate max-w-[100px]">
                  {cat.name}
                </span>
                {cat.isOver && <AlertTriangle size={12} className="text-destructive" />}
                {cat.isNear && <TrendingUp size={12} className="text-yellow-500" />}
                {!cat.isOver && !cat.isNear && cat.percentage > 0 && (
                  <Check size={12} className="text-emerald-500" />
                )}
              </div>
              <span className={`text-[10px] font-medium ${
                cat.isOver ? 'text-destructive' : cat.isNear ? 'text-yellow-500' : 'text-muted-foreground'
              }`}>
                {cat.percentage.toFixed(0)}%
              </span>
            </div>

            {/* Progress Bar */}
            <Progress 
              value={Math.min(cat.percentage, 100)} 
              className={`h-1.5 ${
                cat.isOver 
                  ? '[&>div]:bg-destructive' 
                  : cat.isNear 
                    ? '[&>div]:bg-yellow-500' 
                    : ''
              }`}
              style={!cat.isOver && !cat.isNear ? { ['--progress-color' as any]: cat.color } : undefined}
            />

            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
              <span>${cat.spent.toFixed(0)} spent</span>
              <span className={cat.remaining < 0 ? 'text-destructive' : ''}>
                ${Math.abs(cat.remaining).toFixed(0)} {cat.remaining < 0 ? 'over' : 'left'}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
