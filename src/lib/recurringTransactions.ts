import { storage } from './storage';
import { toast } from '@/hooks/use-toast';

interface RecurringTransaction {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  amount: number;
  nextDate: string;
  time?: string; // HH:MM format
  weekday?: number; // 0-6 (Sunday-Saturday)
  monthDay?: number; // 1-31
}

interface Jar {
  id: number;
  name: string;
  saved: number;
  target: number;
  streak: number;
  withdrawn: number;
  records?: any[];
  recurringTransaction?: RecurringTransaction;
  [key: string]: any;
}

export const checkAndProcessRecurringTransactions = (): boolean => {
  const jars = storage.loadJars();
  let hasUpdates = false;
  
  const updatedJars = jars.map((jar: Jar) => {
    if (!jar.recurringTransaction?.enabled) return jar;
    
    const nextDate = new Date(jar.recurringTransaction.nextDate);
    const now = new Date();
    
    // Check if it's time to process the recurring transaction
    if (now >= nextDate) {
      const newSaved = Math.min(jar.saved + jar.recurringTransaction.amount, jar.target);
      const newRecord = {
        id: Date.now() + Math.random(),
        type: 'saved' as const,
        amount: jar.recurringTransaction.amount,
        date: new Date(),
      };
      
      // Calculate next date
      const getNextDate = (freq: string, transaction: RecurringTransaction) => {
        const next = new Date();
        
        // Set time if specified
        if (transaction.time) {
          const [hours, minutes] = transaction.time.split(':').map(Number);
          next.setHours(hours, minutes, 0, 0);
        }
        
        switch (freq) {
          case 'daily':
            next.setDate(next.getDate() + 1);
            break;
          case 'weekly':
            // Set to next occurrence of the specified weekday
            if (transaction.weekday !== undefined) {
              const daysUntilNext = (transaction.weekday + 7 - next.getDay()) % 7 || 7;
              next.setDate(next.getDate() + daysUntilNext);
            } else {
              next.setDate(next.getDate() + 7);
            }
            break;
          case 'monthly':
            // Set to specified day of next month
            if (transaction.monthDay !== undefined) {
              next.setMonth(next.getMonth() + 1);
              next.setDate(Math.min(transaction.monthDay, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
            } else {
              next.setMonth(next.getMonth() + 1);
            }
            break;
        }
        return next.toISOString();
      };
      
      hasUpdates = true;
      
      // Show notification
      toast({
        title: "Recurring Transaction Processed",
        description: `Added €${jar.recurringTransaction.amount} to ${jar.name}`,
      });
      
      return {
        ...jar,
        saved: newSaved,
        streak: jar.streak + 1,
        records: [...(jar.records || []), newRecord],
        recurringTransaction: {
          ...jar.recurringTransaction,
          nextDate: getNextDate(jar.recurringTransaction.frequency, jar.recurringTransaction),
        },
      };
    }
    
    return jar;
  });
  
  if (hasUpdates) {
    storage.saveJars(updatedJars);
  }
  
  return hasUpdates;
};

export const checkUpcomingRecurringTransactions = (): void => {
  const jars = storage.loadJars();
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  jars.forEach((jar: Jar) => {
    if (!jar.recurringTransaction?.enabled) return;
    
    const nextDate = new Date(jar.recurringTransaction.nextDate);
    nextDate.setHours(0, 0, 0, 0);
    
    // Check if transaction is due tomorrow
    if (nextDate.getTime() === tomorrow.getTime()) {
      toast({
        title: "Recurring Transaction Reminder",
        description: `Tomorrow: €${jar.recurringTransaction.amount} will be added to ${jar.name}`,
      });
    }
  });
};
