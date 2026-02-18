import { Search, ChevronDown, ChevronRight, ArrowUpDown, Wallet, CreditCard, Receipt, Briefcase, ShoppingBag, UtensilsCrossed, Pencil, Target, BellRing, PiggyBank, LayoutDashboard, Image } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useExpense } from '@/contexts/ExpenseContext';
import { format, isToday, isYesterday, isSameDay, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ExpenseSearch } from './ExpenseSearch';
import { SpendingOverviewModal } from './SpendingOverviewModal';
import { SwipeableTransaction } from './SwipeableTransaction';
import { SpendingGoals } from './SpendingGoals';
import { BillReminders } from './BillReminders';
import { SavingsGoals } from './SavingsGoals';
import { FinancialDashboard } from './FinancialDashboard';
import { ReceiptViewer } from './ReceiptViewer';
import { TransactionDetailModal } from './TransactionDetailModal';
import { useToast } from '@/hooks/use-toast';
import { loadCurrencySettings, formatCurrencyAmount } from '@/lib/currency';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  icon: string;
  color: string;
}

interface TransactionItem {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  date: string;
  categoryId?: string;
  accountId?: string;
  accountName?: string;
  fromAccount?: string;
  toAccount?: string;
  receiptUrl?: string;
  currency?: string;
  originalAmount?: number;
}

type FilterPeriod = 'daily' | 'weekly' | 'monthly';
type TransactionType = 'all' | 'income' | 'expense' | 'transfer';

export const ExpenseHomeView = () => {
  const { expenses, incomes, categories, getTotalExpenses, getTotalIncome, deleteExpense, deleteIncome } = useExpense();
  const { toast } = useToast();
  const [showSearch, setShowSearch] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string>('all');
  const [period, setPeriod] = useState<FilterPeriod>('monthly');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [showSpendingOverview, setShowSpendingOverview] = useState(false);
  const [showSpendingGoals, setShowSpendingGoals] = useState(false);
  const [showBillReminders, setShowBillReminders] = useState(false);
  const [showSavingsGoals, setShowSavingsGoals] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<{ url: string; description: string } | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionItem | null>(null);

  // Load accounts from localStorage
  useEffect(() => {
    const loadData = () => {
      const savedAccounts = localStorage.getItem('jarify_accounts');
      const savedTransfers = localStorage.getItem('jarify_transfers');
      if (savedAccounts) {
        setAccounts(JSON.parse(savedAccounts));
      }
      if (savedTransfers) {
        setTransfers(JSON.parse(savedTransfers));
      }
    };
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, []);

  // Calculate cash flow (income - expenses)
  const totalIncome = getTotalIncome(period);
  const totalExpenses = getTotalExpenses(period);
  const cashFlow = totalIncome - totalExpenses;

  // Format large currency values
  const formatLargeCurrency = (amount: number): string => {
    const absAmount = Math.abs(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(absAmount);
  };

  // Get chart data for the period
  const getChartData = () => {
    const now = new Date();
    if (period === 'monthly') {
      // Show last 6 months
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const start = startOfMonth(monthDate);
        const end = endOfMonth(monthDate);
        
        const monthExpenses = expenses.filter(exp => {
          const d = new Date(exp.date);
          return d >= start && d <= end;
        }).reduce((sum, exp) => sum + exp.amount, 0);
        
        const monthIncome = incomes.filter(inc => {
          const d = new Date(inc.date);
          return d >= start && d <= end;
        }).reduce((sum, inc) => sum + inc.amount, 0);
        
        months.push({
          label: format(monthDate, 'MMM yyyy'),
          income: monthIncome,
          expense: monthExpenses,
        });
      }
      return months;
    }
    return [];
  };

  const chartData = getChartData();
  const maxChartValue = Math.max(...chartData.map(d => Math.max(d.income, d.expense)), 1);

  // Group transactions by date
  const getAllTransactions = () => {
    const allTransactions: Array<{
      id: string;
      type: 'income' | 'expense' | 'transfer';
      amount: number;
      description: string;
      date: string;
      categoryId?: string;
      accountId?: string;
      accountName?: string;
      fromAccount?: string;
      toAccount?: string;
      receiptUrl?: string;
      currency?: string;
      originalAmount?: number;
    }> = [];

    // Add expenses
    expenses.forEach(exp => {
      const account = accounts.find(a => a.id === exp.accountId);
      allTransactions.push({
        id: exp.id,
        type: 'expense',
        amount: exp.amount,
        description: exp.description,
        date: exp.date,
        categoryId: exp.categoryId,
        accountId: exp.accountId,
        accountName: account?.name || 'Cash Wallet',
        receiptUrl: exp.receiptUrl,
        currency: exp.currency,
        originalAmount: exp.originalAmount,
      });
    });

    // Add incomes
    incomes.forEach(inc => {
      const account = accounts.find(a => a.id === inc.accountId);
      allTransactions.push({
        id: inc.id,
        type: 'income',
        amount: inc.amount,
        description: inc.description,
        date: inc.date,
        categoryId: inc.categoryId,
        accountId: inc.accountId,
        accountName: account?.name || 'Cash Wallet',
        receiptUrl: inc.receiptUrl,
        currency: inc.currency,
        originalAmount: inc.originalAmount,
      });
    });

    // Add transfers
    transfers.forEach(tr => {
      allTransactions.push({
        id: tr.id,
        type: 'transfer',
        amount: tr.amount,
        description: 'Transfer',
        date: tr.date,
        fromAccount: tr.fromAccountName,
        toAccount: tr.toAccountName,
      });
    });

    // Sort by date descending
    return allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const transactions = getAllTransactions();

  // Group by date
  const groupedTransactions: Record<string, typeof transactions> = {};
  transactions.forEach(tx => {
    const txDate = new Date(tx.date);
    let dateKey: string;
    if (isToday(txDate)) {
      dateKey = 'Today';
    } else if (isYesterday(txDate)) {
      dateKey = 'Yesterday';
    } else {
      dateKey = format(txDate, 'MMM d, yyyy');
    }
    if (!groupedTransactions[dateKey]) {
      groupedTransactions[dateKey] = [];
    }
    groupedTransactions[dateKey].push(tx);
  });

  // Calculate daily totals
  const getDayTotal = (txs: typeof transactions) => {
    return txs.reduce((sum, tx) => {
      if (tx.type === 'income' || tx.type === 'transfer') return sum + tx.amount;
      return sum - tx.amount;
    }, 0);
  };

  // Get category icon/color for transaction
  const getCategoryInfo = (categoryId?: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category || { icon: '📦', color: 'hsl(220, 15%, 50%)', name: 'Other' };
  };

  // Get icon based on transaction type
  const getTransactionIcon = (tx: typeof transactions[0]) => {
    if (tx.type === 'transfer') {
      return (
        <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
          <ArrowUpDown size={22} className="text-white" />
        </div>
      );
    }
    
    const category = getCategoryInfo(tx.categoryId);
    
    return (
      <div 
        className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0"
        style={{ backgroundColor: tx.type === 'expense' ? category.color : '#10b981' }}
      >
        <span>{category.icon}</span>
      </div>
    );
  };

  const periodLabels: Record<FilterPeriod, string> = {
    daily: 'By days',
    weekly: 'By weeks', 
    monthly: 'By months',
  };

  return (
    <div className="space-y-0 pb-20">
      {/* Header with Cash Flow - Reduced spacing */}
      <div className="text-center relative px-2 -mt-1">
        <button 
          onClick={() => setShowSearch(true)}
          className="absolute right-2 top-0 p-1.5 text-muted-foreground hover:text-foreground"
        >
          <Search size={20} />
        </button>
        
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {formatLargeCurrency(Math.abs(cashFlow))}
          </h1>
          <p className="text-muted-foreground text-xs -mt-0.5">Cash Flow</p>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-4 px-0 mt-2">
        {Object.entries(groupedTransactions).slice(0, 8).map(([dateKey, txs]) => {
          const dayTotal = getDayTotal(txs);
          
          return (
            <div key={dateKey}>
              {/* Date Header */}
              <div className="flex items-center justify-between mb-1.5 px-1">
                <h3 className="text-sm font-medium text-muted-foreground">{dateKey}</h3>
                <span className={`text-sm font-medium ${dayTotal >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {formatLargeCurrency(Math.abs(dayTotal))}
                </span>
              </div>
              
              {/* Transactions with swipe-to-delete and separators */}
              <div className="space-y-3">
                {txs.map((tx, index) => {
                  const category = getCategoryInfo(tx.categoryId);
                  
                  const handleDelete = () => {
                    if (tx.type === 'expense') {
                      deleteExpense(tx.id);
                      toast({ title: 'Expense deleted', description: 'Transaction removed' });
                    } else if (tx.type === 'income') {
                      deleteIncome(tx.id);
                      toast({ title: 'Income deleted', description: 'Transaction removed' });
                    } else if (tx.type === 'transfer') {
                      const savedTransfers = localStorage.getItem('jarify_transfers');
                      if (savedTransfers) {
                        const updatedTransfers = JSON.parse(savedTransfers).filter((t: any) => t.id !== tx.id);
                        localStorage.setItem('jarify_transfers', JSON.stringify(updatedTransfers));
                        setTransfers(updatedTransfers);
                      }
                      toast({ title: 'Transfer deleted', description: 'Transaction removed' });
                    }
                  };
                  
                  const handleTap = () => {
                    setSelectedTransaction(tx);
                  };
                  
                  return (
                    <div key={tx.id}>
                      <SwipeableTransaction id={tx.id} onDelete={handleDelete}>
                        <div
                          className="flex items-center gap-3 py-3 pl-0.5 pr-2 cursor-pointer active:bg-secondary/50"
                          onClick={handleTap}
                        >
                          {/* Icon */}
                          {getTransactionIcon(tx)}
                          
                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-foreground text-sm">
                                {tx.type === 'transfer' ? 'Transfer' : category.name}
                              </p>
                              {tx.receiptUrl && (
                                <Image size={12} className="text-muted-foreground" />
                              )}
                            </div>
                            {tx.type === 'transfer' ? (
                              <div className="text-xs text-muted-foreground">
                                <p className="flex items-center gap-1">
                                  <Wallet size={10} /> To {tx.toAccount}
                                </p>
                                <p className="flex items-center gap-1">
                                  <CreditCard size={10} /> From {tx.fromAccount}
                                </p>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Wallet size={10} />
                                {tx.accountName || 'Cash Wallet'}
                              </p>
                            )}
                          </div>
                          
                          {/* Amount */}
                          <div className="text-right">
                            <span className={`font-semibold text-base block ${
                              tx.type === 'income' ? 'text-emerald-500' : 
                              tx.type === 'transfer' ? 'text-foreground' : 
                              'text-red-500'
                            }`}>
                              {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                              {formatLargeCurrency(tx.amount)}
                            </span>
                            {tx.currency && tx.originalAmount && tx.currency !== loadCurrencySettings().baseCurrency && (
                              <span className="text-[10px] text-muted-foreground">
                                ({formatCurrencyAmount(tx.originalAmount, tx.currency)})
                              </span>
                            )}
                          </div>
                        </div>
                      </SwipeableTransaction>
                      {/* Separator line between transactions */}
                      {index < txs.length - 1 && (
                        <div className="h-px bg-border/50 ml-14 mr-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        
        {Object.keys(groupedTransactions).length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <span className="text-4xl mb-4 block">💸</span>
            <p>No transactions yet</p>
            <p className="text-sm mt-1">Add your first income or expense</p>
          </div>
        )}
      </div>

      {/* Search Modal */}
      {showSearch && <ExpenseSearch onClose={() => setShowSearch(false)} />}

      {/* Spending Overview Modal */}
      <SpendingOverviewModal 
        isOpen={showSpendingOverview} 
        onClose={() => setShowSpendingOverview(false)} 
      />

      {/* Spending Goals Modal */}
      {showSpendingGoals && <SpendingGoals onClose={() => setShowSpendingGoals(false)} />}

      {/* Bill Reminders Modal */}
      {showBillReminders && <BillReminders onClose={() => setShowBillReminders(false)} />}

      {/* Savings Goals Modal */}
      {showSavingsGoals && <SavingsGoals onClose={() => setShowSavingsGoals(false)} />}

      {/* Financial Dashboard */}
      <FinancialDashboard 
        isOpen={showDashboard} 
        onClose={() => setShowDashboard(false)} 
      />

      {/* Receipt Viewer */}
      <ReceiptViewer
        receiptUrl={selectedReceipt?.url || ''}
        description={selectedReceipt?.description}
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onDelete={(tx) => {
          if (tx.type === 'expense') {
            deleteExpense(tx.id);
            toast({ title: 'Expense deleted', description: 'Transaction removed' });
          } else if (tx.type === 'income') {
            deleteIncome(tx.id);
            toast({ title: 'Income deleted', description: 'Transaction removed' });
          }
        }}
      />
    </div>
  );
};