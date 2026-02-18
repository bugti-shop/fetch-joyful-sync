import { useState } from 'react';
import { Star, TrendingDown, TrendingUp, ChevronRight } from 'lucide-react';
import { useExpense } from '@/contexts/ExpenseContext';
import { Card } from '@/components/ui/card';
import { formatCurrencyAmount, loadCurrencySettings } from '@/lib/currency';
import { motion, AnimatePresence } from 'framer-motion';
import { TransactionDetailModal } from './TransactionDetailModal';

interface StarredTransactionsProps {
  limit?: number;
  showTitle?: boolean;
  onClose?: () => void;
}

export const StarredTransactions = ({ limit = 5, showTitle = true, onClose }: StarredTransactionsProps) => {
  const { getStarredTransactions, categories, starredIds, deleteExpense, deleteIncome } = useExpense();
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  
  const baseCurrency = loadCurrencySettings().baseCurrency;
  const starredTxs = getStarredTransactions().slice(0, limit) as Array<{
    id: string;
    categoryId: string;
    amount: number;
    description: string;
    date: string;
    type: 'expense' | 'income';
  }>;

  if (starredIds.length === 0) {
    return null;
  }

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(c => c.id === categoryId);
  };

  const handleDelete = (transaction: any) => {
    if (transaction.type === 'expense') {
      deleteExpense(transaction.id);
    } else {
      deleteIncome(transaction.id);
    }
  };

  return (
    <div className="space-y-3">
      {showTitle && (
        <div className="flex items-center gap-2">
          <Star size={18} className="text-amber-500 fill-amber-500" />
          <h3 className="font-semibold text-foreground">Starred</h3>
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
            {starredIds.length}
          </span>
        </div>
      )}

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {starredTxs.map((tx, index) => {
            const category = getCategoryInfo(tx.categoryId);
            const isExpense = tx.type === 'expense';
            
            return (
              <motion.div
                key={tx.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  onClick={() => setSelectedTransaction(tx)}
                  className="p-3 cursor-pointer hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${category?.color}20` }}
                    >
                      {category?.icon || '📦'}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{tx.description}</p>
                        <Star size={12} className="text-amber-500 fill-amber-500 flex-shrink-0" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {category?.name} • {new Date(tx.date).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className={`font-bold ${isExpense ? 'text-destructive' : 'text-green-500'}`}>
                          {isExpense ? '-' : '+'}{formatCurrencyAmount(tx.amount, baseCurrency)}
                        </p>
                      </div>
                      {isExpense ? (
                        <TrendingDown size={16} className="text-destructive" />
                      ) : (
                        <TrendingUp size={16} className="text-green-500" />
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onDelete={handleDelete}
      />
    </div>
  );
};
