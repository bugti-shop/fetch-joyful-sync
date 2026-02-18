import { ArrowLeft, Copy, Pencil, Trash2, FileText, Image as ImageIcon, Files, Star } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useMemo } from 'react';
import { useExpense } from '@/contexts/ExpenseContext';
import { formatCurrencyAmount, loadCurrencySettings } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';
import { hapticFeedback } from '@/lib/haptics';
import { EditTransactionModal } from './EditTransactionModal';
import { ReceiptViewer } from './ReceiptViewer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  date: string;
  categoryId?: string;
  accountId?: string;
  accountName?: string;
  receiptUrl?: string;
  currency?: string;
  originalAmount?: number;
  fromAccount?: string;
  toAccount?: string;
}

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (transaction: Transaction) => void;
}

type StoredAccount = { id: string; name: string };

export const TransactionDetailModal = ({
  transaction,
  isOpen,
  onClose,
  onDelete,
}: TransactionDetailModalProps) => {
  const { categories, expenses, incomes, addExpense, addIncome, starredIds, toggleStarred } = useExpense();
  const { toast } = useToast();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReceiptViewer, setShowReceiptViewer] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEditSave = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Get the latest transaction data from context - useMemo ensures it updates when context changes
  const txData = useMemo((): Transaction | null => {
    // refreshKey forces re-computation after edit save
    void refreshKey;
    
    if (!transaction) return null;
    
    if (transaction.type === 'expense') {
      const found = expenses.find(e => e.id === transaction.id);
      if (found) {
        return { ...transaction, ...found, type: 'expense' as const };
      }
    } else if (transaction.type === 'income') {
      const found = incomes.find(i => i.id === transaction.id);
      if (found) {
        return { ...transaction, ...found, type: 'income' as const };
      }
    }
    return transaction;
  }, [transaction, expenses, incomes, refreshKey]);

  // Early return AFTER all hooks
  if (!isOpen || !transaction || !txData) return null;

  const category = categories.find(c => c.id === txData.categoryId);
  const categoryName = category?.name || 'Other';
  const categoryIcon = category?.icon || '📦';
  const categoryColor = txData.type === 'expense'
    ? (category?.color || 'hsl(220, 15%, 50%)')
    : '#10b981';
  
  const isStarred = starredIds.includes(txData.id);
  
  const handleToggleStar = () => {
    hapticFeedback.light();
    toggleStarred(txData.id, txData.type as 'expense' | 'income');
    toast({ 
      title: isStarred ? 'Removed from starred' : 'Added to starred',
      description: isStarred ? 'Transaction removed from favorites' : 'Transaction added to favorites'
    });
  };

  const currencySettings = loadCurrencySettings();
  const baseCurrency = currencySettings.baseCurrency || 'USD';
  const primaryCurrency = txData.currency || baseCurrency;
  const primaryAmount = (txData.originalAmount ?? txData.amount);
  const showBaseAmount = !!(txData.currency && txData.originalAmount && txData.currency !== baseCurrency);

  const resolveAccountName = (): string => {
    if (!txData.accountId) return 'Cash Wallet';

    try {
      const raw = localStorage.getItem('jarify_accounts');
      const parsed = raw ? (JSON.parse(raw) as StoredAccount[]) : [];
      return parsed.find(a => a.id === txData.accountId)?.name || 'Cash Wallet';
    } catch {
      return 'Cash Wallet';
    }
  };

  const handleCopy = () => {
    hapticFeedback.light();
    const details = `${categoryName}: ${txData.type === 'expense' ? '-' : '+'}${formatCurrencyAmount(primaryAmount, primaryCurrency)}`;
    navigator.clipboard.writeText(details);
    toast({ title: 'Copied', description: 'Transaction details copied to clipboard' });
  };

  const handleDeleteClick = () => {
    hapticFeedback.medium();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    hapticFeedback.medium();
    if (onDelete) {
      onDelete(txData as Transaction);
    }
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleEdit = () => {
    hapticFeedback.light();
    setShowEditModal(true);
  };

  const handleDuplicate = () => {
    hapticFeedback.medium();
    const newTransaction = {
      categoryId: txData.categoryId || '',
      amount: txData.amount,
      description: txData.description,
      date: new Date().toISOString(),
      accountId: txData.accountId,
      receiptUrl: txData.receiptUrl,
      currency: txData.currency,
      originalAmount: txData.originalAmount,
    };

    if (txData.type === 'expense') {
      addExpense(newTransaction);
      toast({ title: 'Duplicated', description: 'Expense duplicated successfully' });
    } else if (txData.type === 'income') {
      addIncome(newTransaction);
      toast({ title: 'Duplicated', description: 'Income duplicated successfully' });
    }
    onClose();
  };

  const formattedDate = format(new Date(txData.date), 'MM/dd/yyyy, h:mm a');
  const hasDescription = txData.description && txData.description !== 'Expense' && txData.description !== 'Income';

  return (
    <>
      <div className="fixed inset-0 z-50 bg-background">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-1 text-foreground">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-lg font-semibold text-foreground">Record</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleToggleStar} 
              className={`p-2 transition-colors ${isStarred ? 'text-yellow-500' : 'text-muted-foreground hover:text-foreground'}`} 
              title={isStarred ? 'Remove from starred' : 'Add to starred'}
            >
              <Star size={22} fill={isStarred ? 'currentColor' : 'none'} />
            </button>
            <button onClick={handleCopy} className="p-2 text-muted-foreground hover:text-foreground" title="Copy">
              <Copy size={22} />
            </button>
            <button onClick={handleDuplicate} className="p-2 text-muted-foreground hover:text-foreground" title="Duplicate">
              <Files size={22} />
            </button>
            <button onClick={handleEdit} className="p-2 text-muted-foreground hover:text-foreground" title="Edit">
              <Pencil size={22} />
            </button>
            <button onClick={handleDeleteClick} className="p-2 text-muted-foreground hover:text-foreground" title="Delete">
              <Trash2 size={22} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Category Icon and Name */}
          <div className="flex items-center gap-4 mb-6">
            <div 
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: categoryColor }}
            >
              <span>{categoryIcon}</span>
            </div>
            <h2 className="text-2xl font-semibold text-foreground">{categoryName}</h2>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div className="flex">
              <span className="w-24 text-muted-foreground">Category</span>
              <span className="text-foreground">{categoryName}</span>
            </div>
            
            <div className="flex">
              <span className="w-24 text-muted-foreground">Amount</span>
              <div className="flex flex-col">
                <span className={txData.type === 'income' ? 'text-teal-500' : 'text-red-500'}>
                  {txData.type === 'expense' ? '-' : '+'}
                  {formatCurrencyAmount(primaryAmount, primaryCurrency)}
                </span>
                {showBaseAmount && (
                  <span className="text-xs text-muted-foreground">
                    ({formatCurrencyAmount(txData.amount, baseCurrency)})
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex">
              <span className="w-24 text-muted-foreground">Date</span>
              <span className="text-foreground">{formattedDate}</span>
            </div>
            
            <div className="flex">
              <span className="w-24 text-muted-foreground">Wallet</span>
              <span className="text-foreground">{resolveAccountName()}</span>
            </div>
            
            <div className="flex">
              <span className="w-24 text-muted-foreground">Type</span>
              <span className="text-foreground capitalize">{txData.type}</span>
            </div>

            {/* Note/Description */}
            {hasDescription && (
              <div className="flex">
                <span className="w-24 text-muted-foreground flex items-center gap-1">
                  <FileText size={14} />
                  Note
                </span>
                <span className="text-foreground flex-1">{txData.description}</span>
              </div>
            )}

            {/* Receipt */}
            {txData.receiptUrl && (
              <div className="pt-4">
                <button
                  onClick={() => {
                    hapticFeedback.light();
                    setShowReceiptViewer(true);
                  }}
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <ImageIcon size={16} />
                  <span>View Receipt</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EditTransactionModal
        transaction={txData as Transaction}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleEditSave}
      />

      {/* Receipt Viewer */}
      <ReceiptViewer
        receiptUrl={txData.receiptUrl || ''}
        description={txData.description}
        isOpen={showReceiptViewer}
        onClose={() => setShowReceiptViewer(false)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {txData.type}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
