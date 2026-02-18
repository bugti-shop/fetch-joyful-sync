import { useExpense, ExpenseCategory } from '@/contexts/ExpenseContext';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface ExpenseCategoryCardProps {
  category: ExpenseCategory;
  onClick: () => void;
}

export const ExpenseCategoryCard = ({ category, onClick }: ExpenseCategoryCardProps) => {
  const { getCategoryTotal } = useExpense();
  const spent = getCategoryTotal(category.id, 'monthly');
  const percentage = category.budget > 0 ? (spent / category.budget) * 100 : 0;
  const isOverBudget = percentage > 100;
  const isNearLimit = percentage >= 80 && percentage <= 100;

  return (
    <div
      onClick={onClick}
      className="bg-card rounded-2xl p-4 shadow-md border border-border cursor-pointer hover:shadow-lg"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${category.color}20` }}
          >
            {category.icon}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{category.name}</h3>
            <p className="text-sm text-muted-foreground">
              ${spent.toFixed(2)} / ${category.budget}
            </p>
          </div>
        </div>
        {isOverBudget && (
          <AlertTriangle className="text-destructive" size={20} />
        )}
        {isNearLimit && !isOverBudget && (
          <TrendingUp className="text-yellow-500" size={20} />
        )}
      </div>
      
      {/* Progress Bar */}
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${
            isOverBudget 
              ? 'bg-destructive' 
              : isNearLimit 
                ? 'bg-yellow-500' 
                : 'bg-accent'
          }`}
          style={{ 
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: !isOverBudget && !isNearLimit ? category.color : undefined 
          }}
        />
      </div>
      
      <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
        <span>{percentage.toFixed(0)}% used</span>
        <span>${(category.budget - spent).toFixed(2)} left</span>
      </div>
    </div>
  );
};