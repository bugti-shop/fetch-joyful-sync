import { useExpense } from '@/contexts/ExpenseContext';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

interface RecentTransactionsProps {
  limit?: number;
  categoryId?: string;
  showDelete?: boolean;
}

export const RecentTransactions = ({ limit = 5, categoryId, showDelete = false }: RecentTransactionsProps) => {
  const { expenses, categories, deleteExpense } = useExpense();

  const filteredExpenses = categoryId 
    ? expenses.filter(exp => exp.categoryId === categoryId)
    : expenses;

  const recentExpenses = [...filteredExpenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);

  if (recentExpenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <span className="text-4xl mb-2">💸</span>
        <p>No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {recentExpenses.map((expense) => {
        const category = categories.find(c => c.id === expense.categoryId);
        
        return (
          <div
            key={expense.id}
            className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl hover:bg-secondary"
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                style={{ backgroundColor: category?.color ? `${category.color}20` : 'hsl(var(--secondary))' }}
              >
                {category?.icon || '💰'}
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">{expense.description}</p>
                <p className="text-xs text-muted-foreground">
                  {category?.name} • {format(new Date(expense.date), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground">-${formatCurrency(expense.amount)}</span>
              {showDelete && (
                <button
                  onClick={() => deleteExpense(expense.id)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};