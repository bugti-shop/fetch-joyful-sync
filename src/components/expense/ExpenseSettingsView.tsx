import { Settings, Tag, Bell, Download, Trash2, Wand2, History, Lightbulb, Repeat, Globe, Crown } from 'lucide-react';
import { useState } from 'react';
import { CustomCategoryManager } from './CustomCategoryManager';
import { BudgetNotifications } from './BudgetNotifications';
import { ExpenseExport } from './ExpenseExport';
import { BudgetWizard } from './BudgetWizard';
import { TransactionHistory } from './TransactionHistory';
import { SpendingInsights } from './SpendingInsights';
import { RecurringTransactionsManager } from './RecurringTransactionsManager';
import { CurrencySettings } from './CurrencySettings';
import { useExpense } from '@/contexts/ExpenseContext';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { ProPaywall } from '@/components/ProPaywall';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export const ExpenseSettingsView = () => {
  const [showCategories, setShowCategories] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showBudgetWizard, setShowBudgetWizard] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [showCurrency, setShowCurrency] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState('');
  const { toast } = useToast();
  const { canUseFeature } = useSubscription();

  const isPremium = canUseFeature('spending_insights');

  const handlePremiumAction = (feature: string, action: () => void) => {
    if (isPremium) {
      action();
    } else {
      setPaywallFeature(feature);
      setShowPaywall(true);
    }
  };

  const handleClearData = () => {
    localStorage.removeItem('jarify_expenses');
    localStorage.removeItem('jarify_incomes');
    toast({
      title: 'Data cleared',
      description: 'All expense and income data has been cleared.',
    });
    setShowClearConfirm(false);
    window.location.reload();
  };

  const premiumIds = ['insights', 'recurring', 'currency', 'wizard', 'history', 'notifications', 'export'];

  const settingsItems = [
    {
      id: 'insights',
      label: 'Spending Insights',
      description: 'Charts, trends, and money-saving tips',
      icon: Lightbulb,
      onClick: () => handlePremiumAction('Spending Insights', () => setShowInsights(true)),
      highlight: true,
    },
    {
      id: 'recurring',
      label: 'Recurring Transactions',
      description: 'Auto-track weekly, monthly, yearly payments',
      icon: Repeat,
      onClick: () => handlePremiumAction('Recurring Transactions', () => setShowRecurring(true)),
      highlight: true,
    },
    {
      id: 'currency',
      label: 'Currency Settings',
      description: 'Set base currency and exchange rates',
      icon: Globe,
      onClick: () => handlePremiumAction('Currency Settings', () => setShowCurrency(true)),
      highlight: true,
    },
    {
      id: 'wizard',
      label: 'Budget Wizard',
      description: 'Smart budget recommendations based on income',
      icon: Wand2,
      onClick: () => handlePremiumAction('Budget Wizard', () => setShowBudgetWizard(true)),
    },
    {
      id: 'history',
      label: 'Transaction History',
      description: 'View all transactions with filters & export',
      icon: History,
      onClick: () => handlePremiumAction('Transaction History', () => setShowHistory(true)),
    },
    {
      id: 'categories',
      label: 'Manage Categories',
      description: 'Add, edit, or remove expense categories',
      icon: Tag,
      onClick: () => setShowCategories(true),
    },
    {
      id: 'notifications',
      label: 'Budget Alerts',
      description: 'Configure budget warning thresholds',
      icon: Bell,
      onClick: () => handlePremiumAction('Budget Alerts', () => setShowNotifications(true)),
    },
    {
      id: 'export',
      label: 'Export Data',
      description: 'Download your expense data as CSV',
      icon: Download,
      onClick: () => handlePremiumAction('Export Data', () => setShowExport(true)),
    },
    {
      id: 'clear',
      label: 'Clear All Data',
      description: 'Delete all expenses and income records',
      icon: Trash2,
      onClick: () => setShowClearConfirm(true),
      destructive: true,
    },
  ];

  return (
    <div className="space-y-4 pb-32">
      <div className="flex items-center gap-3 mb-6">
        <Settings size={24} className="text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      </div>

      <div className="space-y-3">
        {settingsItems.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className={`w-full p-4 bg-card border rounded-2xl flex items-center gap-4 text-left ${
              item.destructive 
                ? 'border-destructive/30 hover:bg-destructive/10' 
                : item.highlight
                  ? 'border-primary/50 hover:bg-primary/10 ring-1 ring-primary/20'
                  : 'border-border hover:bg-secondary'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              item.destructive 
                ? 'bg-destructive/20' 
                : item.highlight
                  ? 'bg-primary/20'
                  : 'bg-primary/10'
            }`}>
              <item.icon 
                size={20} 
                className={item.destructive ? 'text-destructive' : 'text-primary'} 
              />
            </div>
            <div className="flex-1">
              <p className={`font-medium ${item.destructive ? 'text-destructive' : 'text-foreground'}`}>
                {item.label}
                {!isPremium && premiumIds.includes(item.id) && (
                  <Crown className="inline-block ml-1.5 h-3.5 w-3.5 text-amber-500" />
                )}
                {item.highlight && (
                  <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                    New
                  </span>
                )}
              </p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Modals */}
      <CustomCategoryManager isOpen={showCategories} onClose={() => setShowCategories(false)} />
      {showNotifications && <BudgetNotifications onClose={() => setShowNotifications(false)} />}
      {showExport && <ExpenseExport onClose={() => setShowExport(false)} />}
      <BudgetWizard isOpen={showBudgetWizard} onClose={() => setShowBudgetWizard(false)} />
      <TransactionHistory isOpen={showHistory} onClose={() => setShowHistory(false)} />
      <SpendingInsights isOpen={showInsights} onClose={() => setShowInsights(false)} />
      <RecurringTransactionsManager isOpen={showRecurring} onClose={() => setShowRecurring(false)} />
      <CurrencySettings isOpen={showCurrency} onClose={() => setShowCurrency(false)} />
      {/* Clear Data Confirmation */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your expenses and income records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClearData}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ProPaywall isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  );
};