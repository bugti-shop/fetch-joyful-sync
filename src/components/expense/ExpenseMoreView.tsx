import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Tag, 
  RefreshCw, 
  Download, 
  Bell, 
  ChevronRight,
  Users,
  Split,
  Star,
  MapPin
} from 'lucide-react';
import { CustomCategoryManager } from './CustomCategoryManager';
import { RecurringExpenses } from './RecurringExpenses';
import { ExpenseExport } from './ExpenseExport';
import { BudgetNotifications } from './BudgetNotifications';
import { FamilyManager } from './FamilyManager';
import { SplitExpensesView } from './SplitExpensesView';
import { StarredTransactions } from './StarredTransactions';
import { LocationReminderSettings } from './LocationReminderSettings';

type SettingSection = 'categories' | 'recurring' | 'export' | 'notifications' | 'family' | 'split' | 'starred' | 'location' | null;

export const ExpenseMoreView = () => {
  const [activeSection, setActiveSection] = useState<SettingSection>(null);

  const menuItems = [
    {
      id: 'starred' as const,
      icon: Star,
      label: 'Starred Transactions',
      description: 'Quick access to important transactions',
    },
    {
      id: 'categories' as const,
      icon: Tag,
      label: 'Category Settings',
      description: 'Manage expense & income categories',
    },
    {
      id: 'recurring' as const,
      icon: RefreshCw,
      label: 'Recurring Transactions',
      description: 'Set up recurring expenses & bills',
    },
    {
      id: 'family' as const,
      icon: Users,
      label: 'Family & Allowances',
      description: 'Manage family members & allowances',
    },
    {
      id: 'split' as const,
      icon: Split,
      label: 'Split Expenses',
      description: 'Split bills with roommates/partners',
    },
    {
      id: 'notifications' as const,
      icon: Bell,
      label: 'Budget Notifications',
      description: 'Alerts for approaching budget limits',
    },
    {
      id: 'location' as const,
      icon: MapPin,
      label: 'Location Reminders',
      description: 'Remind to log at frequent stores',
    },
    {
      id: 'export' as const,
      icon: Download,
      label: 'Export Data',
      description: 'Download transactions as CSV or PDF',
    },
  ];

  const configItems = [
    { label: 'Main Currency Setting', value: 'USD ($)' },
    { label: 'Sub Currency Setting', value: '' },
    { label: 'Start Screen (Daily/Calendar)', value: 'Daily' },
    { label: 'Monthly Start Date', value: 'Every 1' },
    { label: 'Weekly Start Day', value: 'Sunday' },
  ];

  return (
    <div className="space-y-4 pb-24">
      {/* Category/Repeat Section */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="bg-secondary/50 px-4 py-2">
          <p className="text-sm text-muted-foreground">Category/Repeat</p>
        </div>
        
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors ${
                index !== menuItems.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={20} className="text-muted-foreground" />
                <div className="text-left">
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-muted-foreground" />
            </motion.button>
          );
        })}
      </div>

      {/* Configuration Section */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="bg-secondary/50 px-4 py-2">
          <p className="text-sm text-muted-foreground">Configuration</p>
        </div>
        
        {configItems.map((item, index) => (
          <div
            key={item.label}
            className={`flex items-center justify-between p-4 ${
              index !== configItems.length - 1 ? 'border-b border-border' : ''
            }`}
          >
            <p className="text-foreground">{item.label}</p>
            <p className="text-primary font-medium">{item.value || 'OFF'}</p>
          </div>
        ))}
      </div>

      {/* Modals */}
      <CustomCategoryManager 
        isOpen={activeSection === 'categories'} 
        onClose={() => setActiveSection(null)} 
      />

      {activeSection === 'recurring' && (
        <RecurringExpenses onClose={() => setActiveSection(null)} />
      )}

      {activeSection === 'export' && (
        <ExpenseExport onClose={() => setActiveSection(null)} />
      )}

      {activeSection === 'notifications' && (
        <BudgetNotifications onClose={() => setActiveSection(null)} />
      )}

      {activeSection === 'family' && (
        <FamilyManager isOpen={true} onClose={() => setActiveSection(null)} />
      )}

      {activeSection === 'split' && (
        <SplitExpensesView onClose={() => setActiveSection(null)} />
      )}

      {activeSection === 'starred' && (
        <StarredTransactions onClose={() => setActiveSection(null)} />
      )}

      {activeSection === 'location' && (
        <LocationReminderSettings onClose={() => setActiveSection(null)} />
      )}
    </div>
  );
};
