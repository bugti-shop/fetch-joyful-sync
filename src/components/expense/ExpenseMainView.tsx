import { useState } from 'react';
import { Plus, ArrowLeftRight } from 'lucide-react';
import { ExpenseBottomNav, ExpenseTab } from './ExpenseBottomNav';
import { ExpenseHomeView } from './ExpenseHomeView';
import { ExpenseStatsView } from './ExpenseStatsView';
import { AccountsManager } from './AccountsManager';
import { ExpenseSettingsView } from './ExpenseSettingsView';
import { AddTransactionModal } from './AddTransactionModal';
import { TransferModal } from './TransferModal';
import { hapticFeedback } from '@/lib/haptics';

interface ExpenseMainViewProps {
  darkMode: boolean;
}

export const ExpenseMainView = ({ darkMode }: ExpenseMainViewProps) => {
  const [activeTab, setActiveTab] = useState<ExpenseTab>('home');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [initialTransactionType, setInitialTransactionType] = useState<'income' | 'expense'>('expense');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return <ExpenseHomeView />;
      case 'stats':
        return <ExpenseStatsView />;
      case 'accounts':
        return <AccountsManager />;
      case 'settings':
        return <ExpenseSettingsView />;
      default:
        return <ExpenseHomeView />;
    }
  };

  // Only show action buttons on home tab
  const showActionButtons = activeTab === 'home';

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Main Content */}
      <div className="px-2 pt-2">
        {renderTabContent()}
      </div>

      {/* Action Buttons - Fixed at bottom - Only show on Home tab */}
      {showActionButtons && (
        <div className="fixed bottom-[72px] left-0 right-0 z-40 px-3 space-y-2">
          {/* First Row - Add Income & Add Expense */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                hapticFeedback.medium();
                setInitialTransactionType('income');
                setShowAddModal(true);
              }}
              className="flex-1 py-3.5 bg-emerald-500 text-white rounded-xl flex items-center justify-start gap-2 font-semibold text-sm active:scale-95 px-4"
            >
              <Plus size={18} />
              <span>Add Income</span>
            </button>
            <button
              onClick={() => {
                hapticFeedback.medium();
                setInitialTransactionType('expense');
                setShowAddModal(true);
              }}
              className="flex-1 py-3.5 bg-orange-500 text-white rounded-xl flex items-center justify-start gap-2 font-semibold text-sm active:scale-95 px-4"
            >
              <Plus size={18} />
              <span>Add Expense</span>
            </button>
          </div>
          {/* Second Row - Transfer Money */}
          <button
            onClick={() => {
              hapticFeedback.medium();
              setShowTransferModal(true);
            }}
            className="w-full py-3.5 bg-gray-900 text-white rounded-xl flex items-center justify-center gap-2 font-semibold text-sm active:scale-95"
          >
            <ArrowLeftRight size={18} />
            <span>Transfer Money into Account</span>
          </button>
        </div>
      )}

      {/* Bottom Navigation */}
      <ExpenseBottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Add Transaction Modal */}
      <AddTransactionModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        initialType={initialTransactionType}
      />

      {/* Transfer Modal */}
      <TransferModal 
        isOpen={showTransferModal} 
        onClose={() => setShowTransferModal(false)}
      />
    </div>
  );
};