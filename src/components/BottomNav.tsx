import { Home, BarChart3, Wrench, Settings } from 'lucide-react';
import { hapticFeedback } from '@/lib/haptics';
import { NavLink } from 'react-router-dom';
import { useExpense } from '@/contexts/ExpenseContext';

const triggerHaptic = async () => {
  try {
    await hapticFeedback.heavy();
    // Double tap for extra strong feedback
    setTimeout(async () => {
      await hapticFeedback.heavy();
    }, 50);
  } catch (error) {
    // Haptics not available
  }
};

export const BottomNav = () => {
  const { isExpenseMode } = useExpense();

  // Hide when in expense mode - ExpenseMainView has its own bottom nav
  if (isExpenseMode) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border">
      <div className="max-w-screen-xl mx-auto px-2">
        <div className="grid grid-cols-4 gap-1 py-1">
          <NavLink
            to="/"
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
                <Home
                  size={20}
                  className="mb-0.5"
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="text-[9px] font-medium">Home</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/progress"
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
                <BarChart3
                  size={20}
                  className="mb-0.5"
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="text-[9px] font-medium">Progress</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/tools"
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
                <Wrench
                  size={20}
                  className="mb-0.5"
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="text-[9px] font-medium">Tools</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/settings"
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
                <Settings
                  size={20}
                  className="mb-0.5"
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="text-[9px] font-medium">Settings</span>
              </>
            )}
          </NavLink>
        </div>
      </div>
    </nav>
  );
};
