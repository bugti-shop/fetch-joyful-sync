import { Home, BarChart3, Wrench, Settings, User } from 'lucide-react';
import { hapticFeedback } from '@/lib/haptics';
import { NavLink } from 'react-router-dom';
import { useExpense } from '@/contexts/ExpenseContext';

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

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/progress', label: 'Progress', icon: BarChart3 },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/tools', label: 'Tools', icon: Wrench },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export const BottomNav = () => {
  const { isExpenseMode } = useExpense();

  if (isExpenseMode) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border">
      <div className="max-w-screen-xl mx-auto px-2">
        <div className="grid grid-cols-5 gap-1 py-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={triggerHaptic}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 transition-all ${
                  isActive
                    ? 'text-[#000000] dark:text-white'
                    : 'text-muted-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={20}
                    className="mb-0.5"
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className="text-[9px] font-medium">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};
