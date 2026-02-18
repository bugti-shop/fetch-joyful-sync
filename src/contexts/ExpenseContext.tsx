import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage } from '@/lib/storage';

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  budget: number;
  weeklyBudget?: number;
  customIcon?: string; // For custom uploaded icons (base64 or URL)
}

export interface Expense {
  id: string;
  categoryId: string;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
  accountId?: string;
  receiptUrl?: string;
  currency?: string;
  originalAmount?: number;
  starred?: boolean;
}

export interface Income {
  id: string;
  categoryId: string;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
  accountId?: string;
  receiptUrl?: string;
  currency?: string;
  originalAmount?: number;
  starred?: boolean;
}

export interface ExpenseContextType {
  expenses: Expense[];
  incomes: Income[];
  categories: ExpenseCategory[];
  starredIds: string[];
  isExpenseMode: boolean;
  setIsExpenseMode: (mode: boolean) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  addIncome: (income: Omit<Income, 'id' | 'createdAt'>) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  updateIncome: (id: string, income: Partial<Income>) => void;
  deleteExpense: (id: string) => void;
  deleteIncome: (id: string) => void;
  addCategory: (category: Omit<ExpenseCategory, 'id'>) => void;
  updateCategory: (id: string, category: Partial<ExpenseCategory>) => void;
  deleteCategory: (id: string) => void;
  updateCategoryBudget: (categoryId: string, budget: number, weeklyBudget?: number) => void;
  toggleStarred: (id: string, type: 'expense' | 'income') => void;
  getStarredTransactions: () => (Expense | Income & { type: 'expense' | 'income' })[];
  getTotalExpenses: (period?: 'daily' | 'weekly' | 'monthly' | 'all') => number;
  getTotalIncome: (period?: 'daily' | 'weekly' | 'monthly' | 'all') => number;
  getCategoryTotal: (categoryId: string, period?: 'daily' | 'weekly' | 'monthly' | 'all') => number;
  getWeeklyBudgetProgress: () => { spent: number; budget: number; percentage: number };
  getExpensesByCategory: (categoryId: string) => Expense[];
  getRecentExpenses: (limit?: number) => Expense[];
}

const defaultCategories: ExpenseCategory[] = [
  // Expense Categories
  { id: 'food', name: 'Food & Dining', icon: '🍔', color: 'hsl(25, 95%, 53%)', budget: 500, weeklyBudget: 125 },
  { id: 'groceries', name: 'Groceries', icon: '🛒', color: 'hsl(120, 50%, 45%)', budget: 400, weeklyBudget: 100 },
  { id: 'coffee', name: 'Coffee & Drinks', icon: '☕', color: 'hsl(30, 80%, 40%)', budget: 100, weeklyBudget: 25 },
  { id: 'transport', name: 'Transport', icon: '🚗', color: 'hsl(210, 85%, 55%)', budget: 300, weeklyBudget: 75 },
  { id: 'fuel', name: 'Fuel', icon: '⛽', color: 'hsl(0, 70%, 50%)', budget: 200, weeklyBudget: 50 },
  { id: 'parking', name: 'Parking', icon: '🅿️', color: 'hsl(220, 60%, 50%)', budget: 50, weeklyBudget: 12 },
  { id: 'rent', name: 'Rent', icon: '🏠', color: 'hsl(280, 70%, 50%)', budget: 1500 },
  { id: 'mortgage', name: 'Mortgage', icon: '🏡', color: 'hsl(270, 60%, 45%)', budget: 2000 },
  { id: 'utilities', name: 'Utilities', icon: '💡', color: 'hsl(45, 90%, 50%)', budget: 200 },
  { id: 'electricity', name: 'Electricity', icon: '⚡', color: 'hsl(50, 100%, 50%)', budget: 150 },
  { id: 'water', name: 'Water', icon: '💧', color: 'hsl(200, 80%, 50%)', budget: 50 },
  { id: 'internet', name: 'Internet', icon: '📡', color: 'hsl(190, 70%, 45%)', budget: 80 },
  { id: 'phone', name: 'Phone Bill', icon: '📱', color: 'hsl(260, 75%, 60%)', budget: 100 },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: 'hsl(340, 80%, 55%)', budget: 400, weeklyBudget: 100 },
  { id: 'clothing', name: 'Clothing', icon: '👕', color: 'hsl(320, 70%, 50%)', budget: 200, weeklyBudget: 50 },
  { id: 'electronics', name: 'Electronics', icon: '💻', color: 'hsl(230, 70%, 50%)', budget: 300 },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: 'hsl(160, 70%, 45%)', budget: 200, weeklyBudget: 50 },
  { id: 'movies', name: 'Movies', icon: '🎥', color: 'hsl(350, 60%, 45%)', budget: 50 },
  { id: 'games', name: 'Games', icon: '🎮', color: 'hsl(270, 80%, 55%)', budget: 100 },
  { id: 'music', name: 'Music', icon: '🎵', color: 'hsl(300, 70%, 50%)', budget: 30 },
  { id: 'health', name: 'Health', icon: '💊', color: 'hsl(0, 85%, 55%)', budget: 150 },
  { id: 'gym', name: 'Gym & Fitness', icon: '🏋️', color: 'hsl(15, 90%, 50%)', budget: 100 },
  { id: 'medical', name: 'Medical', icon: '🏥', color: 'hsl(0, 70%, 45%)', budget: 200 },
  { id: 'insurance', name: 'Insurance', icon: '🛡️', color: 'hsl(210, 50%, 40%)', budget: 300 },
  { id: 'education', name: 'Education', icon: '📚', color: 'hsl(190, 80%, 45%)', budget: 300 },
  { id: 'books', name: 'Books', icon: '📖', color: 'hsl(35, 60%, 45%)', budget: 50 },
  { id: 'courses', name: 'Courses', icon: '🎓', color: 'hsl(180, 60%, 40%)', budget: 200 },
  { id: 'subscriptions', name: 'Subscriptions', icon: '📺', color: 'hsl(260, 75%, 60%)', budget: 100 },
  { id: 'pets', name: 'Pets', icon: '🐕', color: 'hsl(25, 70%, 50%)', budget: 150 },
  { id: 'gifts', name: 'Gifts', icon: '🎁', color: 'hsl(350, 80%, 55%)', budget: 100 },
  { id: 'travel', name: 'Travel', icon: '✈️', color: 'hsl(200, 90%, 50%)', budget: 500 },
  { id: 'vacation', name: 'Vacation', icon: '🏖️', color: 'hsl(40, 85%, 55%)', budget: 1000 },
  { id: 'restaurant', name: 'Restaurants', icon: '🍽️', color: 'hsl(10, 75%, 50%)', budget: 300, weeklyBudget: 75 },
  { id: 'beauty', name: 'Beauty & Care', icon: '💄', color: 'hsl(330, 70%, 55%)', budget: 100 },
  { id: 'laundry', name: 'Laundry', icon: '🧺', color: 'hsl(200, 40%, 50%)', budget: 50 },
  { id: 'home', name: 'Home & Garden', icon: '🏡', color: 'hsl(100, 50%, 45%)', budget: 200 },
  { id: 'furniture', name: 'Furniture', icon: '🪑', color: 'hsl(30, 50%, 40%)', budget: 300 },
  { id: 'maintenance', name: 'Maintenance', icon: '🔧', color: 'hsl(40, 60%, 45%)', budget: 150 },
  { id: 'charity', name: 'Charity', icon: '❤️', color: 'hsl(0, 80%, 60%)', budget: 100 },
  { id: 'taxes', name: 'Taxes', icon: '📋', color: 'hsl(0, 0%, 40%)', budget: 500 },
  { id: 'misc', name: 'Other', icon: '📦', color: 'hsl(220, 15%, 50%)', budget: 200 },
  // Income Categories
  { id: 'salary', name: 'Salary', icon: '💰', color: 'hsl(120, 60%, 45%)', budget: 0 },
  { id: 'freelance', name: 'Freelance', icon: '💼', color: 'hsl(200, 70%, 50%)', budget: 0 },
  { id: 'bonus', name: 'Bonus', icon: '🎉', color: 'hsl(50, 90%, 50%)', budget: 0 },
  { id: 'investment', name: 'Investment', icon: '📈', color: 'hsl(140, 70%, 45%)', budget: 0 },
  { id: 'rental', name: 'Rental Income', icon: '🏢', color: 'hsl(180, 50%, 45%)', budget: 0 },
  { id: 'dividends', name: 'Dividends', icon: '💵', color: 'hsl(130, 60%, 40%)', budget: 0 },
  { id: 'refund', name: 'Refund', icon: '↩️', color: 'hsl(160, 55%, 45%)', budget: 0 },
  { id: 'other_income', name: 'Other Income', icon: '💸', color: 'hsl(110, 50%, 50%)', budget: 0 },
];

const STARRED_STORAGE_KEY = 'jarify_starred_transactions';

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider = ({ children }: { children: ReactNode }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>(defaultCategories);
  const [starredIds, setStarredIds] = useState<string[]>([]);
  const [isExpenseMode, setIsExpenseMode] = useState(false);

  useEffect(() => {
    const loadedExpenses = storage.loadExpenses();
    const loadedCategories = storage.loadExpenseCategories();
    const savedMode = localStorage.getItem('jarify_expense_mode');
    const savedIncomes = localStorage.getItem('jarify_incomes');
    const savedStarred = localStorage.getItem(STARRED_STORAGE_KEY);
    
    setExpenses(loadedExpenses);
    if (loadedCategories.length > 0) {
      setCategories(loadedCategories);
    }
    if (savedMode !== null) {
      setIsExpenseMode(savedMode === 'true');
    }
    if (savedIncomes) {
      setIncomes(JSON.parse(savedIncomes));
    }
    if (savedStarred) {
      setStarredIds(JSON.parse(savedStarred));
    }
  }, []);

  useEffect(() => { storage.saveExpenses(expenses); }, [expenses]);
  useEffect(() => { storage.saveExpenseCategories(categories); }, [categories]);
  useEffect(() => { localStorage.setItem('jarify_expense_mode', String(isExpenseMode)); }, [isExpenseMode]);
  useEffect(() => { localStorage.setItem('jarify_incomes', JSON.stringify(incomes)); }, [incomes]);
  useEffect(() => { localStorage.setItem(STARRED_STORAGE_KEY, JSON.stringify(starredIds)); }, [starredIds]);

  const addExpense = (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...expense,
      id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    setExpenses(prev => [newExpense, ...prev]);
  };

  const addIncome = (income: Omit<Income, 'id' | 'createdAt'>) => {
    const newIncome: Income = {
      ...income,
      id: `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    setIncomes(prev => [newIncome, ...prev]);
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    setExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, ...updates } : exp));
  };

  const updateIncome = (id: string, updates: Partial<Income>) => {
    setIncomes(prev => prev.map(inc => inc.id === id ? { ...inc, ...updates } : inc));
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(exp => exp.id !== id));
    setStarredIds(prev => prev.filter(sid => sid !== id));
  };

  const deleteIncome = (id: string) => {
    setIncomes(prev => prev.filter(inc => inc.id !== id));
    setStarredIds(prev => prev.filter(sid => sid !== id));
  };

  const addCategory = (category: Omit<ExpenseCategory, 'id'>) => {
    const newCategory: ExpenseCategory = {
      ...category,
      id: `cat_${Date.now()}`,
    };
    setCategories(prev => [...prev, newCategory]);
  };

  const updateCategory = (id: string, updates: Partial<ExpenseCategory>) => {
    setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, ...updates } : cat));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== id));
  };

  const updateCategoryBudget = (categoryId: string, budget: number, weeklyBudget?: number) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? { ...cat, budget, weeklyBudget: weeklyBudget ?? cat.weeklyBudget } 
        : cat
    ));
  };

  const toggleStarred = (id: string, type: 'expense' | 'income') => {
    setStarredIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(sid => sid !== id);
      }
      return [...prev, id];
    });
  };

  const getStarredTransactions = () => {
    const starredExpenses = expenses
      .filter(e => starredIds.includes(e.id))
      .map(e => ({ ...e, type: 'expense' as const }));
    const starredIncomes = incomes
      .filter(i => starredIds.includes(i.id))
      .map(i => ({ ...i, type: 'income' as const }));
    return [...starredExpenses, ...starredIncomes].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const getDateRange = (period: 'daily' | 'weekly' | 'monthly' | 'all') => {
    const now = new Date();
    let start: Date;
    switch (period) {
      case 'daily': start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
      case 'weekly': start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()); break;
      case 'monthly': start = new Date(now.getFullYear(), now.getMonth(), 1); break;
      default: return { start: new Date(0), end: now };
    }
    return { start, end: now };
  };

  const getTotalExpenses = (period: 'daily' | 'weekly' | 'monthly' | 'all' = 'monthly') => {
    const { start, end } = getDateRange(period);
    return expenses.filter(exp => {
      const d = new Date(exp.date);
      return d >= start && d <= end;
    }).reduce((sum, exp) => sum + exp.amount, 0);
  };

  const getTotalIncome = (period: 'daily' | 'weekly' | 'monthly' | 'all' = 'monthly') => {
    const { start, end } = getDateRange(period);
    return incomes.filter(inc => {
      const d = new Date(inc.date);
      return d >= start && d <= end;
    }).reduce((sum, inc) => sum + inc.amount, 0);
  };

  const getCategoryTotal = (categoryId: string, period: 'daily' | 'weekly' | 'monthly' | 'all' = 'monthly') => {
    const { start, end } = getDateRange(period);
    return expenses.filter(exp => {
      const d = new Date(exp.date);
      return exp.categoryId === categoryId && d >= start && d <= end;
    }).reduce((sum, exp) => sum + exp.amount, 0);
  };

  const getWeeklyBudgetProgress = () => {
    const weeklySpent = getTotalExpenses('weekly');
    const totalWeeklyBudget = categories
      .filter(c => c.budget > 0 && c.weeklyBudget)
      .reduce((sum, c) => sum + (c.weeklyBudget || 0), 0);
    
    // Fallback: calculate weekly budget as monthly / 4 for categories without explicit weekly budget
    const fallbackBudget = categories
      .filter(c => c.budget > 0 && !c.weeklyBudget)
      .reduce((sum, c) => sum + (c.budget / 4), 0);
    
    const totalBudget = totalWeeklyBudget + fallbackBudget;
    const percentage = totalBudget > 0 ? (weeklySpent / totalBudget) * 100 : 0;
    
    return { spent: weeklySpent, budget: totalBudget, percentage };
  };

  const getExpensesByCategory = (categoryId: string) => expenses.filter(exp => exp.categoryId === categoryId);
  const getRecentExpenses = (limit: number = 10) => [...expenses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);

  return (
    <ExpenseContext.Provider value={{
      expenses, incomes, categories, starredIds, isExpenseMode, setIsExpenseMode,
      addExpense, addIncome, updateExpense, updateIncome, deleteExpense, deleteIncome,
      addCategory, updateCategory, deleteCategory, updateCategoryBudget,
      toggleStarred, getStarredTransactions, getWeeklyBudgetProgress,
      getTotalExpenses, getTotalIncome, getCategoryTotal, getExpensesByCategory, getRecentExpenses,
    }}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (!context) throw new Error('useExpense must be used within ExpenseProvider');
  return context;
};
