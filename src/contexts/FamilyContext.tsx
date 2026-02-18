import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface FamilyMember {
  id: string;
  name: string;
  avatar: string;
  role: 'parent' | 'child' | 'partner' | 'other';
  color: string;
  allowance?: {
    amount: number;
    frequency: 'daily' | 'weekly' | 'monthly';
    lastPaid: string;
    balance: number;
  };
  createdAt: string;
}

export interface SplitExpense {
  id: string;
  expenseId?: string;
  description: string;
  totalAmount: number;
  date: string;
  paidBy: string; // member id or 'me'
  splits: {
    memberId: string;
    amount: number;
    settled: boolean;
    settledAt?: string;
  }[];
  createdAt: string;
}

export interface FamilyContextType {
  members: FamilyMember[];
  splitExpenses: SplitExpense[];
  addMember: (member: Omit<FamilyMember, 'id' | 'createdAt'>) => void;
  updateMember: (id: string, updates: Partial<FamilyMember>) => void;
  deleteMember: (id: string) => void;
  addSplitExpense: (split: Omit<SplitExpense, 'id' | 'createdAt'>) => void;
  updateSplitExpense: (id: string, updates: Partial<SplitExpense>) => void;
  deleteSplitExpense: (id: string) => void;
  settleSplit: (splitId: string, memberId: string) => void;
  payAllowance: (memberId: string) => void;
  deductAllowance: (memberId: string, amount: number, reason: string) => void;
  getMemberBalance: (memberId: string) => number;
  getOwedToMe: () => number;
  getIOwe: () => number;
}

const FAMILY_STORAGE_KEY = 'jarify_family_members';
const SPLITS_STORAGE_KEY = 'jarify_split_expenses';

const defaultAvatars = ['👤', '👨', '👩', '👦', '👧', '👴', '👵', '🧑', '👱', '🧔'];
const memberColors = [
  'hsl(340, 80%, 55%)',
  'hsl(200, 80%, 50%)',
  'hsl(120, 60%, 45%)',
  'hsl(280, 70%, 55%)',
  'hsl(40, 90%, 50%)',
  'hsl(180, 70%, 45%)',
];

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const FamilyProvider = ({ children }: { children: ReactNode }) => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [splitExpenses, setSplitExpenses] = useState<SplitExpense[]>([]);

  // Load from storage
  useEffect(() => {
    const savedMembers = localStorage.getItem(FAMILY_STORAGE_KEY);
    const savedSplits = localStorage.getItem(SPLITS_STORAGE_KEY);
    
    if (savedMembers) {
      setMembers(JSON.parse(savedMembers));
    }
    if (savedSplits) {
      setSplitExpenses(JSON.parse(savedSplits));
    }
  }, []);

  // Save to storage
  useEffect(() => {
    localStorage.setItem(FAMILY_STORAGE_KEY, JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem(SPLITS_STORAGE_KEY, JSON.stringify(splitExpenses));
  }, [splitExpenses]);

  const addMember = (member: Omit<FamilyMember, 'id' | 'createdAt'>) => {
    const newMember: FamilyMember = {
      ...member,
      id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    setMembers(prev => [...prev, newMember]);
  };

  const updateMember = (id: string, updates: Partial<FamilyMember>) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const addSplitExpense = (split: Omit<SplitExpense, 'id' | 'createdAt'>) => {
    const newSplit: SplitExpense = {
      ...split,
      id: `split_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    setSplitExpenses(prev => [...prev, newSplit]);
  };

  const updateSplitExpense = (id: string, updates: Partial<SplitExpense>) => {
    setSplitExpenses(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteSplitExpense = (id: string) => {
    setSplitExpenses(prev => prev.filter(s => s.id !== id));
  };

  const settleSplit = (splitId: string, memberId: string) => {
    setSplitExpenses(prev => prev.map(split => {
      if (split.id !== splitId) return split;
      return {
        ...split,
        splits: split.splits.map(s => 
          s.memberId === memberId 
            ? { ...s, settled: true, settledAt: new Date().toISOString() }
            : s
        ),
      };
    }));
  };

  const payAllowance = (memberId: string) => {
    setMembers(prev => prev.map(m => {
      if (m.id !== memberId || !m.allowance) return m;
      return {
        ...m,
        allowance: {
          ...m.allowance,
          balance: m.allowance.balance + m.allowance.amount,
          lastPaid: new Date().toISOString(),
        },
      };
    }));
  };

  const deductAllowance = (memberId: string, amount: number, reason: string) => {
    setMembers(prev => prev.map(m => {
      if (m.id !== memberId || !m.allowance) return m;
      return {
        ...m,
        allowance: {
          ...m.allowance,
          balance: Math.max(0, m.allowance.balance - amount),
        },
      };
    }));
  };

  const getMemberBalance = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    return member?.allowance?.balance || 0;
  };

  // Calculate what others owe me (I paid, they owe)
  const getOwedToMe = () => {
    return splitExpenses.reduce((total, split) => {
      if (split.paidBy === 'me') {
        const unsettled = split.splits
          .filter(s => !s.settled && s.memberId !== 'me')
          .reduce((sum, s) => sum + s.amount, 0);
        return total + unsettled;
      }
      return total;
    }, 0);
  };

  // Calculate what I owe others
  const getIOwe = () => {
    return splitExpenses.reduce((total, split) => {
      if (split.paidBy !== 'me') {
        const mySplit = split.splits.find(s => s.memberId === 'me' && !s.settled);
        return total + (mySplit?.amount || 0);
      }
      return total;
    }, 0);
  };

  return (
    <FamilyContext.Provider value={{
      members,
      splitExpenses,
      addMember,
      updateMember,
      deleteMember,
      addSplitExpense,
      updateSplitExpense,
      deleteSplitExpense,
      settleSplit,
      payAllowance,
      deductAllowance,
      getMemberBalance,
      getOwedToMe,
      getIOwe,
    }}>
      {children}
    </FamilyContext.Provider>
  );
};

export const useFamily = () => {
  const context = useContext(FamilyContext);
  if (!context) throw new Error('useFamily must be used within FamilyProvider');
  return context;
};

export { defaultAvatars, memberColors };
