import { motion } from 'framer-motion';
import { Receipt, Wallet } from 'lucide-react';
import { useExpense } from '@/contexts/ExpenseContext';
import { hapticFeedback } from '@/lib/haptics';

export const ExpenseToggleIcon = () => {
  const { isExpenseMode, setIsExpenseMode } = useExpense();

  const handleToggle = () => {
    hapticFeedback.light();
    setIsExpenseMode(!isExpenseMode);
  };

  return (
    <motion.button
      onClick={handleToggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative p-1.5 sm:p-2 rounded-full bg-secondary/50 hover:bg-secondary transition-all border border-border"
    >
      <motion.div
        initial={false}
        animate={{ 
          rotate: isExpenseMode ? 360 : 0,
        }}
        transition={{ 
          duration: 0.3, 
          ease: 'easeInOut',
        }}
      >
        {isExpenseMode ? (
          <Receipt size={16} className="text-foreground" />
        ) : (
          <Wallet size={16} className="text-foreground" />
        )}
      </motion.div>
    </motion.button>
  );
};
