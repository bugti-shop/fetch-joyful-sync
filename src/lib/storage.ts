/**
 * Local Storage utility for persisting app data
 * Provides a simple API for saving and loading data with automatic serialization
 */

interface RecurringTransaction {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  amount: number;
  nextDate: string;
}

interface Jar {
  id: number;
  name: string;
  target: number;
  saved: number;
  streak: number;
  withdrawn: number;
  notes?: JarNote[];
  records?: TransactionRecord[];
  currency?: string;
  categoryId?: number;
  targetDate?: string;
  createdAt?: string;
  jarType?: 'flask' | 'circular';
  imageUrl?: string;
  purposeType?: 'saving' | 'debt';
  folderId?: number;
  isPinned?: boolean;
  order?: number;
  recurringTransaction?: RecurringTransaction;
}

interface Category {
  id: number;
  name: string;
  icon: string;
}

interface Note {
  id: number;
  text: string;
  color: string;
}

interface JarNote {
  id: number;
  text: string;
  color: string;
}

interface TransactionRecord {
  id: number;
  type: 'saved' | 'withdrawn';
  amount: number;
  date: Date;
}

interface Folder {
  id: number;
  name: string;
  isDefault: boolean;
}

const STORAGE_KEYS = {
  JARS: 'jarify_jars',
  CATEGORIES: 'jarify_categories',
  NOTES: 'jarify_notes',
  DARK_MODE: 'jarify_darkMode',
  LAST_NOTIFICATION: 'jarify_lastNotification',
  FOLDERS: 'jarify_folders',
  EXPENSES: 'jarify_expenses',
  EXPENSE_CATEGORIES: 'jarify_expense_categories',
} as const;

interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  budget: number;
}

interface Expense {
  id: string;
  categoryId: string;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
}

const DEFAULT_FOLDERS: Folder[] = [
  { id: 1, name: 'Jars', isDefault: true },
  { id: 2, name: 'Image-Based Goals', isDefault: true },
  { id: 3, name: 'All Goals', isDefault: true }
];

/**
 * Save data to localStorage with JSON serialization
 */
const saveToStorage = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
  }
};

/**
 * Load data from localStorage with JSON parsing
 */
const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (item) {
      return JSON.parse(item);
    }
  } catch (error) {
    console.error(`Error loading from localStorage (${key}):`, error);
  }
  return defaultValue;
};

/**
 * Storage API for the Jarify app
 */
export const storage = {
  // Jars
  saveJars: (jars: Jar[]) => {
    saveToStorage(STORAGE_KEYS.JARS, jars);
  },
  
  loadJars: (): Jar[] => {
    const jars = loadFromStorage<Jar[]>(STORAGE_KEYS.JARS, []);
    // Convert date strings back to Date objects for records
    return jars.map(jar => ({
      ...jar,
      records: jar.records?.map(record => ({
        ...record,
        date: new Date(record.date),
      })) || [],
    }));
  },

  // Categories
  saveCategories: (categories: Category[]) => {
    saveToStorage(STORAGE_KEYS.CATEGORIES, categories);
  },
  
  loadCategories: (): Category[] => {
    return loadFromStorage<Category[]>(STORAGE_KEYS.CATEGORIES, []);
  },

  // Notes
  saveNotes: (notes: Note[]) => {
    saveToStorage(STORAGE_KEYS.NOTES, notes);
  },
  
  loadNotes: (): Note[] => {
    return loadFromStorage<Note[]>(STORAGE_KEYS.NOTES, []);
  },

  // Dark Mode
  saveDarkMode: (darkMode: boolean) => {
    saveToStorage(STORAGE_KEYS.DARK_MODE, darkMode);
  },
  
  loadDarkMode: (): boolean => {
    return loadFromStorage<boolean>(STORAGE_KEYS.DARK_MODE, false);
  },

  // Last Notification Date
  saveLastNotification: (date: string) => {
    saveToStorage(STORAGE_KEYS.LAST_NOTIFICATION, date);
  },
  
  loadLastNotification: (): string | null => {
    return loadFromStorage<string | null>(STORAGE_KEYS.LAST_NOTIFICATION, null);
  },

  // Folders
  saveFolders: (folders: Folder[]) => {
    saveToStorage(STORAGE_KEYS.FOLDERS, folders);
  },
  
  loadFolders: (): Folder[] => {
    const folders = loadFromStorage<Folder[]>(STORAGE_KEYS.FOLDERS, []);
    if (folders.length === 0) {
      // Initialize with default folders
      saveToStorage(STORAGE_KEYS.FOLDERS, DEFAULT_FOLDERS);
      return DEFAULT_FOLDERS;
    }
    return folders;
  },

  // Expenses
  saveExpenses: (expenses: Expense[]) => {
    saveToStorage(STORAGE_KEYS.EXPENSES, expenses);
  },
  
  loadExpenses: (): Expense[] => {
    return loadFromStorage<Expense[]>(STORAGE_KEYS.EXPENSES, []);
  },

  // Expense Categories
  saveExpenseCategories: (categories: ExpenseCategory[]) => {
    saveToStorage(STORAGE_KEYS.EXPENSE_CATEGORIES, categories);
  },
  
  loadExpenseCategories: (): ExpenseCategory[] => {
    return loadFromStorage<ExpenseCategory[]>(STORAGE_KEYS.EXPENSE_CATEGORIES, []);
  },

  // Clear all data (useful for reset functionality)
  clearAll: () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },
};
