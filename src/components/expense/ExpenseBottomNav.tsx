import { Home, BarChart3, Wallet, Settings, User } from 'lucide-react';
import { hapticFeedback } from '@/lib/haptics';

const triggerHaptic = async () => {
  try {
    await hapticFeedback.heavy();
    setTimeout(async () => {
      await hapticFeedback.heavy();
    }, 50);
  } catch (error) {
    // Haptics not available
  }
};

export type ExpenseTab = 'home' | 'stats' | 'accounts' | 'profile' | 'settings';

interface ExpenseBottomNavProps {
  activeTab: ExpenseTab;
  onTabChange: (tab: ExpenseTab) => void;
}

export const ExpenseBottomNav = ({ activeTab, onTabChange }: ExpenseBottomNavProps) => {
  const tabs = [
    { id: 'home' as ExpenseTab, label: 'Home', icon: Home },
    { id: 'stats' as ExpenseTab, label: 'Stats', icon: BarChart3 },
    { id: 'profile' as ExpenseTab, label: 'Profile', icon: User },
    { id: 'accounts' as ExpenseTab, label: 'Account', icon: Wallet },
    { id: 'settings' as ExpenseTab, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around py-1 px-4 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic();
                onTabChange(tab.id);
              }}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-5 rounded-xl transition-colors ${
                isActive ? 'bg-card border border-border shadow-sm' : ''
              }`}
            >
              <Icon 
                size={20} 
                className={isActive ? 'text-primary' : 'text-muted-foreground'} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-[9px] font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};