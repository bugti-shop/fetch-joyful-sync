import { useState, useEffect, useRef } from 'react';
import { Plus, Target, TrendingUp, Moon, Sun, Trash2, Upload, Crown } from 'lucide-react';
import SavingsButton from '@/components/SavingsButton';
import JarVisualization from '@/components/JarVisualization';
import CircularJarVisualization from '@/components/CircularJarVisualization';
import SavingsChart from '@/components/SavingsChart';
import { BackupSync } from '@/components/BackupSync';
import { NotificationSettings } from '@/components/NotificationSettings';
import EmotionalInsights from '@/components/EmotionalInsights';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useExpense } from '@/contexts/ExpenseContext';
import { useToast } from '@/hooks/use-toast';
import { storage } from '@/lib/storage';
import { formatCurrency } from '@/lib/utils';
import { hapticFeedback } from '@/lib/haptics';
import logoImg from '@/assets/logo.png';
import { ExpenseToggleIcon, ExpenseMainView } from '@/components/expense';
import { App as CapacitorApp } from '@capacitor/app';
import { ProPaywall, ProBadge } from '@/components/ProPaywall';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { SortableJarCard } from '@/components/SortableJarCard';


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
  isPinned?: boolean;
  order?: number;
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

const Index = () => {
  const { toast } = useToast();
  const { isExpenseMode } = useExpense();
  const { canUseFeature } = useSubscription();
  const [showProPaywall, setShowProPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState('');
  const [jars, setJars] = useState<Jar[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedJar, setSelectedJar] = useState<Jar | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('light');
  const [newJar, setNewJar] = useState({ name: '', target: '', currency: '$', categoryId: 0, targetDate: '', jarType: 'flask' as 'flask' | 'circular', imageUrl: '', purposeType: 'saving' as 'saving' | 'debt' });
  const [customCurrency, setCustomCurrency] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', icon: '' });
  const [addAmount, setAddAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newNote, setNewNote] = useState({ text: '', color: 'yellow' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [jarToDelete, setJarToDelete] = useState<Jar | null>(null);
  const [showJarNoteModal, setShowJarNoteModal] = useState(false);
  const [newJarNote, setNewJarNote] = useState({ text: '', color: 'yellow' });
  const [showRecordsModal, setShowRecordsModal] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcTargetAmount, setCalcTargetAmount] = useState('');
  const [calcTargetDate, setCalcTargetDate] = useState('');
  const [dailySavings, setDailySavings] = useState<number | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [selectedJarNoteId, setSelectedJarNoteId] = useState<number | null>(null);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showDeleteCategoryConfirm, setShowDeleteCategoryConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // Drag and Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent, categoryId: number) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const categoryJars = getCategoryJars(categoryId);
      const oldIndex = categoryJars.findIndex((jar) => jar.id === active.id);
      const newIndex = categoryJars.findIndex((jar) => jar.id === over.id);

      const reorderedCategoryJars = arrayMove(categoryJars, oldIndex, newIndex);
      
      // Update order property
      const updatedCategoryJars = reorderedCategoryJars.map((jar, index) => ({
        ...jar,
        order: index
      }));
      
      // Update jars array with new order
      const otherJars = jars.filter(jar => jar.categoryId !== categoryId);
      setJars([...otherJars, ...updatedCategoryJars]);
    }
  };

  const togglePin = (jarId: number) => {
    const updatedJars = jars.map(jar => 
      jar.id === jarId ? { ...jar, isPinned: !jar.isPinned } : jar
    );
    
    // Re-sort after pinning
    updatedJars.sort((a, b) => {
      if (a.categoryId !== b.categoryId) return 0;
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (a.order || 0) - (b.order || 0);
    });

    setJars(updatedJars);
  };

  // Theme cycling: light -> ocean -> forest -> sunset -> midnight -> light
  const themes = ['light', 'ocean', 'forest', 'sunset', 'midnight'];
  
  const cycleTheme = () => {
    // Dark modes are a premium feature - only 'light' is free
    if (!canUseFeature('darkModes')) {
      setPaywallFeature('Dark Mode & Themes');
      setShowProPaywall(true);
      return;
    }
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    
    setCurrentTheme(nextTheme);
    applyTheme(nextTheme);
    localStorage.setItem('app_theme', nextTheme);
  };

  const applyTheme = (themeId: string) => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'ocean', 'forest', 'sunset', 'rose', 'midnight', 'minimal');
    root.classList.add(themeId);
  };

  // Load data from localStorage on mount
  useEffect(() => {
    const loadedJars = storage.loadJars();
    const loadedCategories = storage.loadCategories();
    const loadedNotes = storage.loadNotes();
    const savedTheme = localStorage.getItem('app_theme') || 'light';

    setJars(loadedJars);
    setCategories(loadedCategories);
    setNotes(loadedNotes);
    setCurrentTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  // Save jars to localStorage whenever they change - immediate sync
  useEffect(() => {
    storage.saveJars(jars);
  }, [jars]);

  // Save categories to localStorage whenever they change - immediate sync
  useEffect(() => {
    storage.saveCategories(categories);
  }, [categories]);

  // Save notes to localStorage whenever they change - immediate sync
  useEffect(() => {
    storage.saveNotes(notes);
  }, [notes]);

  // Handle Capacitor back button
  useEffect(() => {
    let backButtonListener: any = null;
    
    const setupBackButton = async () => {
      backButtonListener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (selectedJar) {
          // If viewing jar details, go back to home
          setSelectedJar(null);
        } else if (showCreateModal || showCategoryModal || showNoteModal || 
                   showJarNoteModal || showRecordsModal || showDeleteConfirm || showCalculator) {
          // If any modal is open, close it
          setShowCreateModal(false);
          setShowCategoryModal(false);
          setShowNoteModal(false);
          setShowJarNoteModal(false);
          setShowRecordsModal(false);
          setShowDeleteConfirm(false);
          setShowCalculator(false);
        } else if (!canGoBack) {
          // If nothing is open and can't go back, let the default behavior (exit app) happen
          CapacitorApp.exitApp();
        }
      });
    };
    
    setupBackButton();

    return () => {
      if (backButtonListener) {
        backButtonListener.remove();
      }
    };
  }, [selectedJar, showCreateModal, showCategoryModal, showNoteModal, 
      showJarNoteModal, showRecordsModal, showDeleteConfirm, showCalculator]);

  // Handle clicks outside notes to deselect
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-note-item]')) {
        setSelectedNoteId(null);
        setSelectedJarNoteId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const noteColors: Record<string, { bg: string; border: string }> = {
    yellow: { bg: '#FEFF9C', border: '#E5E67A' },
    pink: { bg: '#FFB3D9', border: '#FF8DC7' },
    skyblue: { bg: '#A8E6FF', border: '#7DD3FC' },
    red: { bg: '#FFA6A6', border: '#FF7979' },
    orange: { bg: '#FFD4A3', border: '#FFA94D' },
    lightgreen: { bg: '#B8F5CD', border: '#86EFAC' }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // Import compression utility dynamically
        const { compressImage, blobToFile, getSizeReduction } = await import('@/lib/imageCompression');
        
        // Compress image with WebP conversion
        const compressedBlob = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.85,
          convertToWebP: true
        });
        
        // Convert blob to base64 for storage
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewJar({ ...newJar, imageUrl: reader.result as string });
          
          // Show compression info
          const reduction = getSizeReduction(file.size, compressedBlob.size);
          toast({
            title: "Image Compressed",
            description: `Size reduced by ${reduction} (${(compressedBlob.size / 1024).toFixed(1)}KB)`,
          });
        };
        reader.readAsDataURL(compressedBlob);
      } catch (error) {
        console.error('Image compression failed:', error);
        // Fallback to original upload
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewJar({ ...newJar, imageUrl: reader.result as string });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const createJar = async () => {
    if (newJar.name && newJar.target && categories.length > 0) {
      // Free limit: max 2 jars
      if (!canUseFeature('unlimitedJars') && jars.length >= 2) {
        setPaywallFeature('Unlimited Jars');
        setShowProPaywall(true);
        return;
      }
      await hapticFeedback.jarCreated();
      const targetAmount = parseFloat(newJar.target);
      const jar: Jar = {
        id: Date.now(),
        name: newJar.name,
        target: targetAmount,
        saved: newJar.purposeType === 'debt' ? targetAmount : 0,
        streak: 0,
        withdrawn: 0,
        notes: [],
        records: [],
        currency: newJar.currency,
        categoryId: newJar.categoryId || categories[0].id,
        targetDate: newJar.targetDate || undefined,
        createdAt: new Date().toISOString(),
        jarType: newJar.jarType,
        imageUrl: newJar.imageUrl || undefined,
        purposeType: newJar.purposeType,
      };
      setJars([...jars, jar]);
      setNewJar({ name: '', target: '', currency: '$', categoryId: categories[0].id, targetDate: '', jarType: 'flask', imageUrl: '', purposeType: 'saving' });
      setShowCreateModal(false);
    }
  };

  const createCategory = () => {
    if (newCategory.name) {
      // Free limit: max 2 categories
      if (!canUseFeature('unlimitedCategories') && categories.length >= 2) {
        setPaywallFeature('Unlimited Categories');
        setShowProPaywall(true);
        return;
      }
      const category: Category = {
        id: Date.now(),
        name: newCategory.name,
        icon: ''
      };
      setCategories([...categories, category]);
      setNewCategory({ name: '', icon: '' });
      setShowCategoryModal(false);
    }
  };

  const updateCategory = () => {
    if (editingCategory && editingCategory.name.trim()) {
      const updatedCategories = categories.map(cat =>
        cat.id === editingCategory.id ? editingCategory : cat
      );
      setCategories(updatedCategories);
      setShowEditCategoryModal(false);
      setEditingCategory(null);
    }
  };

  const deleteCategory = (categoryId: number) => {
    // Delete all jars associated with this category
    const updatedJars = jars.filter(jar => jar.categoryId !== categoryId);
    setJars(updatedJars);
    
    // Delete the category
    const updatedCategories = categories.filter(cat => cat.id !== categoryId);
    setCategories(updatedCategories);
    
    setShowDeleteCategoryConfirm(false);
    setCategoryToDelete(null);
  };

  const getCategoryJars = (categoryId: number) => {
    const categoryJars = jars.filter(jar => jar.categoryId === categoryId);
    // Sort by pinned status and order
    return categoryJars.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (a.order || 0) - (b.order || 0);
    });
  };

  const getCategoryTotal = (categoryId: number) => {
    return getCategoryJars(categoryId).reduce((sum, jar) => sum + jar.saved, 0);
  };

  const getCategoryTarget = (categoryId: number) => {
    return getCategoryJars(categoryId).reduce((sum, jar) => sum + jar.target, 0);
  };

  const addJarNote = () => {
    if (newJarNote.text.trim() && selectedJar) {
      const updatedJars = jars.map(jar => {
        if (jar.id === selectedJar.id) {
          const updatedNotes = [...(jar.notes || []), { id: Date.now(), text: newJarNote.text, color: newJarNote.color }];
          return { ...jar, notes: updatedNotes };
        }
        return jar;
      });
      setJars(updatedJars);
      setSelectedJar(updatedJars.find(j => j.id === selectedJar.id) || null);
      setNewJarNote({ text: '', color: 'yellow' });
      setShowJarNoteModal(false);
    }
  };

  const deleteJarNote = (noteId: number) => {
    if (selectedJar) {
      const updatedJars = jars.map(jar => {
        if (jar.id === selectedJar.id) {
          const updatedNotes = (jar.notes || []).filter(n => n.id !== noteId);
          return { ...jar, notes: updatedNotes };
        }
        return jar;
      });
      setJars(updatedJars);
      setSelectedJar(updatedJars.find(j => j.id === selectedJar.id) || null);
    }
  };

  const addNote = () => {
    if (newNote.text.trim()) {
      // Free limit: max 2 sticky notes
      if (!canUseFeature('unlimitedNotes') && notes.length >= 2) {
        setPaywallFeature('Unlimited Sticky Notes');
        setShowProPaywall(true);
        return;
      }
      setNotes([...notes, { id: Date.now(), text: newNote.text, color: newNote.color }]);
      setNewNote({ text: '', color: 'yellow' });
      setShowNoteModal(false);
    }
  };

  const deleteNote = (noteId: number) => {
    setNotes(notes.filter(n => n.id !== noteId));
  };

  const deleteJar = (jarId: number) => {
    setJars(jars.filter(j => j.id !== jarId));
    setShowDeleteConfirm(false);
    setJarToDelete(null);
    if (selectedJar && selectedJar.id === jarId) {
      setSelectedJar(null);
    }
  };

  const addMoney = async () => {
    if (!addAmount || !selectedJar) return;
    const amount = parseFloat(addAmount);
    const updatedJars = jars.map(jar => {
      if (jar.id === selectedJar.id) {
        const newSaved = Math.min(jar.saved + amount, jar.target);
        if (newSaved >= jar.target && jar.saved < jar.target) {
          hapticFeedback.goalCompleted();
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        } else {
          hapticFeedback.moneyAdded();
        }
        const newRecord: TransactionRecord = {
          id: Date.now(),
          type: 'saved',
          amount: amount,
          date: new Date()
        };
        return { 
          ...jar, 
          saved: newSaved, 
          streak: jar.streak + 1,
          records: [...(jar.records || []), newRecord]
        };
      }
      return jar;
    });
    setJars(updatedJars);
    setSelectedJar(updatedJars.find(j => j.id === selectedJar.id) || null);
    setAddAmount('');
  };

  const withdrawMoney = async () => {
    if (!withdrawAmount || !selectedJar) return;
    await hapticFeedback.moneyWithdrawn();
    const amount = parseFloat(withdrawAmount);
    const updatedJars = jars.map(jar => {
      if (jar.id === selectedJar.id) {
        const newSaved = Math.max(jar.saved - amount, 0);
        const newWithdrawn = jar.withdrawn + amount;
        const newRecord: TransactionRecord = {
          id: Date.now(),
          type: 'withdrawn',
          amount: amount,
          date: new Date()
        };
        return { 
          ...jar, 
          saved: newSaved, 
          withdrawn: newWithdrawn,
          records: [...(jar.records || []), newRecord]
        };
      }
      return jar;
    });
    setJars(updatedJars);
    setSelectedJar(updatedJars.find(j => j.id === selectedJar.id) || null);
    setWithdrawAmount('');
  };

  const getProgress = (jar: Jar) => ((jar.saved / jar.target) * 100).toFixed(1);

  const darkMode = currentTheme !== 'light';
  // Use semantic tokens from design system
  const bgColor = 'bg-background';
  const cardBg = 'bg-card';
  const textColor = 'text-foreground';
  const textSecondary = 'text-muted-foreground';

  const chartData = jars.map(jar => ({
    name: jar.name.length > 10 ? jar.name.substring(0, 10) + '...' : jar.name,
    saved: jar.saved,
    withdrawn: jar.withdrawn
  }));

  const totalSaved = jars.reduce((sum, jar) => sum + jar.saved, 0);
  const totalTarget = jars.reduce((sum, jar) => sum + jar.target, 0);

  const calculateDailySavings = () => {
    if (calcTargetAmount && calcTargetDate) {
      const target = parseFloat(calcTargetAmount);
      const targetDate = new Date(calcTargetDate);
      const today = new Date();
      const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysRemaining > 0) {
        setDailySavings(target / daysRemaining);
      } else {
        setDailySavings(null);
      }
    }
  };

  const getInvestmentPlan = (jar: Jar) => {
    const remaining = jar.target - jar.saved;
    
    if (jar.targetDate) {
      const targetDate = new Date(jar.targetDate);
      const today = new Date();
      const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysRemaining > 0) {
        return {
          daily: remaining / daysRemaining,
          weekly: remaining / (daysRemaining / 7),
          monthly: remaining / (daysRemaining / 30)
        };
      }
    }
    
    // Default calculation if no target date
    return {
      daily: remaining / 30,
      weekly: remaining / 4,
      monthly: remaining
    };
  };

  return (
    <>
    <div className={`min-h-screen ${bgColor} transition-colors duration-300 overflow-y-auto`}>
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-6xl animate-bounce">🎉🎊✨💰🏆</div>
        </div>
      )}

      {/* Glassmorphism Header */}
      <div className="sticky top-0 z-30 mb-4 bg-background/90 backdrop-blur-md border-b border-border transform-gpu">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <img src={logoImg} alt="Jarify Logo" className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg" />
              <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold ${textColor} tracking-tight`}>
                Jarify
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <ExpenseToggleIcon />
              {canUseFeature('backupSync') ? (
                <BackupSync 
                  onExport={() => {
                    toast({
                      title: 'Backup Complete',
                      description: 'Your data has been backed up successfully.',
                    });
                  }} 
                  onImport={() => {
                    toast({
                      title: 'Data Restored',
                      description: 'Your backup has been restored.',
                    });
                  }} 
                />
              ) : (
                <button
                  onClick={() => {
                    setPaywallFeature('Backup & Restore');
                    setShowProPaywall(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-card border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  <Crown size={14} className="text-amber-500" />
                  Backup & Restore
                </button>
              )}
              <button
                onClick={cycleTheme}
                className={`p-2 sm:p-3 rounded-full ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-sm shadow-lg hover:shadow-xl transition-all border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
              >
                {darkMode ? <Moon className="text-indigo-400" size={20} /> : <Sun className="text-yellow-600" size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 pb-28">
        {isExpenseMode ? (
          <ExpenseMainView darkMode={darkMode} />
        ) : !selectedJar ? (
          <>
            {jars.length > 0 && (
              <div className="space-y-6 mb-6">
                <EmotionalInsights 
                  totalSaved={totalSaved}
                  totalTarget={totalTarget}
                  jarsCount={jars.length}
                  darkMode={darkMode}
                  currency={jars[0]?.currency || '$'}
                />
              </div>
            )}

            <div className={`${cardBg} rounded-3xl p-4 sm:p-6 mb-6 shadow-lg`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-xl sm:text-2xl md:text-3xl">📝</span>
                  <h2 className={`text-lg sm:text-xl md:text-2xl font-bold ${textColor}`}>Notes</h2>
                </div>
                <div className="flex gap-2 sm:gap-3 -ml-[2.4%]">
                  <SavingsButton 
                    onClick={() => {
                      if (!canUseFeature('advancedCalculator')) {
                        setPaywallFeature('Savings Calculator');
                        setShowProPaywall(true);
                        return;
                      }
                      setShowCalculator(true);
                    }} 
                    variant="secondary" 
                    size="default" 
                    className="text-sm sm:text-base w-auto whitespace-nowrap gap-1.5"
                  >
                    {!canUseFeature('advancedCalculator') && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                    📊 Calculator
                  </SavingsButton>
                  <SavingsButton onClick={() => setShowNoteModal(true)} size="default" className="text-sm sm:text-base w-auto whitespace-nowrap">
                    Add Note
                  </SavingsButton>
                </div>
              </div>
              <div className="flex lg:grid lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
                {notes.map(note => (
                  <div
                    key={note.id}
                    data-note-item
                    onClick={() => setSelectedNoteId(note.id)}
                    className="relative min-w-[220px] w-[220px] lg:w-full lg:max-w-[220px] h-[180px] p-4 rounded shadow-md flex-shrink-0 cursor-pointer"
                    style={{
                      backgroundColor: noteColors[note.color].bg,
                      border: `2px solid ${noteColors[note.color].border}`
                    }}
                  >
                    {selectedNoteId === note.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(note.id);
                          setSelectedNoteId(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full hover:bg-red-600 transition-all flex items-center justify-center text-lg font-bold"
                      >
                        ×
                      </button>
                    )}
                    <p className="text-gray-800 text-sm break-words whitespace-pre-wrap overflow-hidden">
                      {note.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${cardBg} rounded-3xl p-3 sm:p-4 md:p-6 shadow-lg`}>
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <TrendingUp className="text-green-600" size={24} />
                  <h2 className={`text-lg sm:text-xl md:text-2xl font-bold ${textColor}`}>Savings</h2>
                </div>
                <SavingsButton onClick={() => setShowCategoryModal(true)} variant="secondary" size="default" className="text-sm sm:text-base md:text-lg whitespace-nowrap">
                  Create Category
                </SavingsButton>
              </div>

              {/* Categories with Subcategories */}
              <div className="space-y-6">
                {categories.filter(cat => getCategoryJars(cat.id).length > 0).map(category => {
                  const categoryJars = getCategoryJars(category.id);
                  const categoryTotal = getCategoryTotal(category.id);
                  const categoryTarget = getCategoryTarget(category.id);
                  const categoryProgress = categoryTarget > 0 ? ((categoryTotal / categoryTarget) * 100).toFixed(1) : '0.0';

                  return (
                    <div 
                      key={category.id} 
                      className={`${darkMode ? 'bg-gray-700/50' : 'bg-gradient-to-br from-blue-50/50 to-purple-50/50'} rounded-2xl p-4 sm:p-5 cursor-pointer`}
                      onClick={() => setSelectedCategoryId(selectedCategoryId === category.id ? null : category.id)}
                    >
                      {/* Category Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <h3 className={`text-lg sm:text-xl font-bold ${textColor}`}>{category.name}</h3>
                            <p className={`text-xs sm:text-sm ${textSecondary}`}>
                              {categoryJars.length} {categoryJars.length === 1 ? 'goal' : 'goals'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedCategoryId === category.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCategory(category);
                                setShowEditCategoryModal(true);
                              }}
                              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-white hover:bg-gray-100'} transition-colors`}
                              title="Edit Category"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${textColor}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                              </svg>
                            </button>
                          )}
                          <div className="text-right ml-2">
                            <p className={`text-base sm:text-lg font-bold text-green-600`}>
                              {categoryJars.length > 0 ? categoryJars[0].currency : '$'}{formatCurrency(categoryTotal)}
                            </p>
                            <p className={`text-xs ${textSecondary}`}>
                              of {categoryJars.length > 0 ? categoryJars[0].currency : '$'}{formatCurrency(categoryTarget)}
                            </p>
                            <p className={`text-xs font-bold ${
                              parseFloat(categoryProgress) >= 75 ? 'text-green-600' :
                              parseFloat(categoryProgress) >= 50 ? 'text-blue-600' :
                              parseFloat(categoryProgress) >= 25 ? 'text-orange-600' : 'text-red-600'
                            }`}>
                              {categoryProgress}%
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Subcategories (Jars) - Horizontal Scrollable with Drag & Drop */}
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(event) => handleDragEnd(event, category.id)}
                      >
                        <SortableContext
                          items={categoryJars.map(jar => jar.id)}
                          strategy={horizontalListSortingStrategy}
                        >
                          <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin scrollbar-thumb-primary scrollbar-track-transparent">
                            {categoryJars.map(jar => {
                              const progress = parseFloat(getProgress(jar));
                              return (
                                <SortableJarCard
                                  key={jar.id}
                                  jar={jar}
                                  progress={progress}
                                  darkMode={darkMode}
                                  textColor={textColor}
                                  textSecondary={textSecondary}
                                  cardBg={cardBg}
                                  onSelect={setSelectedJar}
                                  onDelete={(jar) => {
                                    setJarToDelete(jar);
                                    setShowDeleteConfirm(true);
                                  }}
                                  onPin={togglePin}
                                />
                              );
                            })}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>
                  );
                })}

                {/* Add New Jar Button */}
                <div className="flex items-center justify-center py-8">
                  <SavingsButton onClick={() => {
                    if (categories.length > 0) {
                      setNewJar({ name: '', target: '', currency: '$', categoryId: categories[0].id, targetDate: '', jarType: 'flask', imageUrl: '', purposeType: 'saving' });
                    }
                    setShowCreateModal(true);
                  }} size="default" className="whitespace-nowrap text-sm sm:text-base w-auto">
                    <Plus size={16} className="inline mr-1 sm:hidden" />
                    <Plus size={18} className="hidden sm:inline mr-1" />
                    Create New Jar
                  </SavingsButton>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className={`${cardBg} rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <button onClick={() => setSelectedJar(null)} className={`${textSecondary} hover:underline text-sm sm:text-base`}>
                ← Back
              </button>
              <SavingsButton
                variant="danger"
                size="sm"
                onClick={() => {
                  setJarToDelete(selectedJar);
                  setShowDeleteConfirm(true);
                }}
                className="text-sm"
              >
                Delete
              </SavingsButton>
            </div>
            <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold mb-2 ${textColor}`}>{selectedJar.name}</h2>
            {selectedJar.createdAt && (
              <p className={`text-xs sm:text-sm ${textSecondary} mb-4 sm:mb-6 text-center`}>
                Created on {new Date(selectedJar.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
            <div className="relative h-56 sm:h-72 md:h-96 mb-4 sm:mb-6 flex items-center justify-center">
              {selectedJar.jarType === 'circular' ? (
                <CircularJarVisualization 
                  progress={parseFloat(getProgress(selectedJar))} 
                  jarId={selectedJar.id} 
                  isLarge={true} 
                  imageUrl={selectedJar.imageUrl}
                  isDebtJar={selectedJar.purposeType === 'debt'}
                />
              ) : (
                <JarVisualization 
                  progress={parseFloat(getProgress(selectedJar))} 
                  jarId={selectedJar.id} 
                  isLarge={true}
                  isDebtJar={selectedJar.purposeType === 'debt'}
                />
              )}
            </div>
            <div className="text-center mb-4 sm:mb-6">
              <div
                className={`text-3xl sm:text-4xl md:text-5xl font-bold ${(() => {
                  const p = parseFloat(getProgress(selectedJar));
                  // For debt jars, reverse colors: red for high debt (high %), green for low debt (low %)
                  if (selectedJar.purposeType === 'debt') {
                    return p >= 75 ? 'text-red-600' : p >= 50 ? 'text-orange-600' : p >= 25 ? 'text-blue-600' : 'text-green-600';
                  }
                  // For saving jars, normal colors: green for high savings, red for low
                  return p >= 75 ? 'text-green-600' : p >= 50 ? 'text-blue-600' : p >= 25 ? 'text-orange-600' : 'text-red-600';
                })()}`}
              >
                {getProgress(selectedJar)}%
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-muted'} rounded-xl sm:rounded-2xl p-3 sm:p-4`}>
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                  <TrendingUp className="text-green-600" size={16} />
                  <span className={`text-xs sm:text-sm ${textSecondary}`}>Saved</span>
                </div>
                <p className={`text-base sm:text-xl md:text-2xl font-bold text-green-600 break-words`}>{selectedJar.currency || '$'}{formatCurrency(selectedJar.saved)}</p>
              </div>
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-purple-50'} rounded-xl sm:rounded-2xl p-3 sm:p-4`}>
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                  <Target className="text-purple-500" size={16} />
                  <span className={`text-xs sm:text-sm ${textSecondary}`}>Target</span>
                </div>
                <p className={`text-base sm:text-xl md:text-2xl font-bold ${textColor} break-words`}>{selectedJar.currency || '$'}{formatCurrency(selectedJar.target)}</p>
              </div>
            </div>
            <div className="space-y-3 mb-6">
              {selectedJar.purposeType === 'debt' ? (
                // Debt jar: Withdraw (Pay Off) first, Add Debt second
                <>
                  <div className="flex gap-3 items-stretch">
                    <input
                      type="number"
                      placeholder={`Amount (${selectedJar.currency || '$'})`}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className={`w-[140px] px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border-2 border-gray-300 focus:border-primary focus:outline-none ${
                        darkMode ? 'bg-gray-700 text-white' : ''
                      }`}
                    />
                    <SavingsButton onClick={withdrawMoney} size="default" className="text-sm sm:text-base flex-1 whitespace-nowrap bg-black hover:bg-black/90 text-white">
                      Pay Off
                    </SavingsButton>
                  </div>
                  <div className="flex gap-3 items-stretch">
                    <input
                      type="number"
                      placeholder={`Amount (${selectedJar.currency || '$'})`}
                      value={addAmount}
                      onChange={(e) => setAddAmount(e.target.value)}
                      className={`w-[140px] px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border-2 border-gray-300 focus:border-primary focus:outline-none ${
                        darkMode ? 'bg-gray-700 text-white' : ''
                      }`}
                    />
                    <SavingsButton onClick={addMoney} size="default" className="text-sm sm:text-base flex-1 whitespace-nowrap bg-red-500 hover:bg-red-600 text-white shadow-[0_4px_0_#b91c1c] active:shadow-[0_2px_0_#991b1b]">
                      Add Debt
                    </SavingsButton>
                  </div>
                </>
              ) : (
                // Saving jar: Add first, Withdraw second
                <>
                  <div className="flex gap-3 items-stretch">
                    <input
                      type="number"
                      placeholder={`Amount (${selectedJar.currency || '$'})`}
                      value={addAmount}
                      onChange={(e) => setAddAmount(e.target.value)}
                      className={`w-[140px] px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border-2 border-gray-300 focus:border-primary focus:outline-none ${
                        darkMode ? 'bg-gray-700 text-white' : ''
                      }`}
                    />
                    <SavingsButton onClick={addMoney} size="default" className="text-sm sm:text-base flex-1 whitespace-nowrap">
                      Add
                    </SavingsButton>
                  </div>
                  <div className="flex gap-3 items-stretch">
                    <input
                      type="number"
                      placeholder={`Amount (${selectedJar.currency || '$'})`}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className={`w-[140px] px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border-2 border-gray-300 focus:border-primary focus:outline-none ${
                        darkMode ? 'bg-gray-700 text-white' : ''
                      }`}
                    />
                    <SavingsButton onClick={withdrawMoney} variant="danger" size="default" className="text-sm sm:text-base flex-1 whitespace-nowrap">
                      Withdraw
                    </SavingsButton>
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <SavingsButton onClick={() => setShowJarNoteModal(true)} size="default" className="text-sm sm:text-base whitespace-nowrap">
                Add Notes
              </SavingsButton>
              <SavingsButton onClick={() => setShowRecordsModal(true)} variant="secondary" size="default" className="text-sm sm:text-base whitespace-nowrap">
                📊 Records
              </SavingsButton>
            </div>

            {/* Investment Projections - Pro Feature */}
            {canUseFeature('investment_plan') ? (
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-gradient-to-br from-blue-50 to-purple-50'} rounded-2xl p-4 mb-6`}>
                <h3 className={`text-lg font-bold ${textColor} mb-2 flex items-center gap-2`}>
                  📈 Investment Plan
                  {selectedJar.targetDate && (
                    <span className={`text-xs ${textSecondary} font-normal`}>
                      (Target: {new Date(selectedJar.targetDate).toLocaleDateString()})
                    </span>
                  )}
                </h3>
                {selectedJar.targetDate && (
                  <p className={`text-xs ${textSecondary} mb-4`}>
                    Based on your target date
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-3 text-center`}>
                    <p className={`text-xs ${textSecondary} mb-1`}>Daily</p>
                    <p className={`text-xl font-bold ${textColor}`}>
                      {selectedJar.currency || '€'}{formatCurrency(getInvestmentPlan(selectedJar).daily)}
                    </p>
                  </div>
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-3 text-center`}>
                    <p className={`text-xs ${textSecondary} mb-1`}>Weekly</p>
                    <p className={`text-xl font-bold ${textColor}`}>
                      {selectedJar.currency || '€'}{formatCurrency(getInvestmentPlan(selectedJar).weekly)}
                    </p>
                  </div>
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-3 text-center`}>
                    <p className={`text-xs ${textSecondary} mb-1`}>Monthly</p>
                    <p className={`text-xl font-bold ${textColor}`}>
                      {selectedJar.currency || '€'}{formatCurrency(getInvestmentPlan(selectedJar).monthly)}
                    </p>
                  </div>
                </div>
                <p className={`text-xs ${textSecondary} text-center mt-3`}>
                  {selectedJar.targetDate 
                    ? `Save these amounts to reach your ${selectedJar.currency || '€'}${formatCurrency(selectedJar.target)} goal by your target date`
                    : `Projected amounts to reach your ${selectedJar.currency || '€'}${formatCurrency(selectedJar.target)} goal`
                  }
                </p>
              </div>
            ) : (
              <button
                onClick={() => {
                  setPaywallFeature('Investment Plan');
                  setShowProPaywall(true);
                }}
                className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-gradient-to-br from-blue-50 to-purple-50'} rounded-2xl p-4 mb-6 text-left relative overflow-hidden`}
              >
                <div className="flex items-center justify-between">
                  <h3 className={`text-lg font-bold ${textColor} flex items-center gap-2`}>
                    📈 Investment Plan
                  </h3>
                  <ProBadge />
                </div>
                <p className={`text-sm ${textSecondary} mt-2`}>
                  Unlock daily, weekly & monthly saving targets
                </p>
                <div className="mt-3 grid grid-cols-3 gap-3 opacity-40 blur-[2px]">
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-3 text-center`}>
                    <p className={`text-xs ${textSecondary}`}>Daily</p>
                    <p className={`text-xl font-bold ${textColor}`}>$--</p>
                  </div>
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-3 text-center`}>
                    <p className={`text-xs ${textSecondary}`}>Weekly</p>
                    <p className={`text-xl font-bold ${textColor}`}>$--</p>
                  </div>
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-3 text-center`}>
                    <p className={`text-xs ${textSecondary}`}>Monthly</p>
                    <p className={`text-xl font-bold ${textColor}`}>$--</p>
                  </div>
                </div>
              </button>
            )}

            {selectedJar.notes && selectedJar.notes.length > 0 && (
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-2xl p-4 mb-6`}>
                <h3 className={`text-lg font-bold ${textColor} mb-3`}>Sticky Notes</h3>
                <div className="flex lg:grid lg:grid-cols-2 gap-4 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
                  {selectedJar.notes.map(note => (
                    <div
                      key={note.id}
                      data-note-item
                      onClick={() => setSelectedJarNoteId(note.id)}
                      className="relative min-w-[220px] w-[220px] lg:w-full h-[180px] p-4 rounded shadow-md flex-shrink-0 cursor-pointer"
                      style={{
                        backgroundColor: noteColors[note.color].bg,
                        border: `2px solid ${noteColors[note.color].border}`
                      }}
                    >
                      {selectedJarNoteId === note.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteJarNote(note.id);
                            setSelectedJarNoteId(null);
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full hover:bg-red-600 transition-all flex items-center justify-center text-lg font-bold"
                        >
                          ×
                        </button>
                      )}
                      <p className="text-gray-800 text-sm break-words whitespace-pre-wrap overflow-hidden">
                        {note.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Jar Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center p-4 z-40 overflow-y-auto">
          <div className={`${cardBg} rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl my-8 max-h-[90vh] overflow-y-auto`}>
            <h3 className={`text-xl sm:text-2xl font-bold mb-6 ${textColor}`}>Create New Jar</h3>
            {categories.length === 0 ? (
              <>
                <p className={`mb-6 ${textSecondary}`}>
                  You need to create a category first before creating a jar!
                </p>
                <div className="flex gap-3">
                  <SavingsButton variant="secondary" onClick={() => setShowCreateModal(false)} className="flex-1 whitespace-nowrap">
                    Cancel
                  </SavingsButton>
                  <SavingsButton onClick={() => {
                    setShowCreateModal(false);
                    setShowCategoryModal(true);
                  }} className="flex-1 whitespace-nowrap">
                    Create Category
                  </SavingsButton>
                </div>
              </>
            ) : (
              <>
                {/* Purpose Type Selection */}
                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-3 ${textColor}`}>Jar Purpose</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setNewJar({ ...newJar, purposeType: 'saving' })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        newJar.purposeType === 'saving'
                          ? 'border-primary bg-primary/10'
                          : darkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-3xl mb-2">💰</div>
                      <p className={`text-sm font-medium text-center ${textColor}`}>Saving</p>
                      <p className={`text-xs ${textSecondary} text-center mt-1`}>Goal-based savings</p>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        if (!canUseFeature('debt_jar')) {
                          setPaywallFeature('Debt/Loan Jar');
                          setShowProPaywall(true);
                          return;
                        }
                        setNewJar({ ...newJar, purposeType: 'debt' });
                      }}
                      className={`p-4 rounded-xl border-2 transition-all relative ${
                        newJar.purposeType === 'debt'
                          ? 'border-primary bg-primary/10'
                          : darkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {!canUseFeature('debt_jar') && (
                        <div className="absolute top-2 right-2">
                          <ProBadge />
                        </div>
                      )}
                      <div className="text-3xl mb-2">📉</div>
                      <p className={`text-sm font-medium text-center ${textColor}`}>Debt/Loan</p>
                      <p className={`text-xs ${textSecondary} text-center mt-1`}>Track payoff progress</p>
                    </button>
                  </div>
                </div>

                {/* Jar Type Selection */}
                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-3 ${textColor}`}>Choose Jar Style</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setNewJar({ ...newJar, jarType: 'flask' })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        newJar.jarType === 'flask'
                          ? 'border-primary bg-primary/10'
                          : darkMode ? 'border-gray-600 bg-gray-700 hover:border-gray-500' : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                    >
                      <div className="h-24 mb-2 flex items-center justify-center">
                        <JarVisualization progress={50} jarId={9999} isLarge={false} />
                      </div>
                      <p className={`text-sm font-medium text-center ${textColor}`}>Classic Jar</p>
                      <p className={`text-xs ${textSecondary} text-center mt-1`}>Default style</p>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        if (!canUseFeature('image_jar')) {
                          setPaywallFeature('Image Jar (Photo Circle)');
                          setShowProPaywall(true);
                          return;
                        }
                        setNewJar({ ...newJar, jarType: 'circular' });
                      }}
                      className={`p-4 rounded-xl border-2 transition-all relative ${
                        newJar.jarType === 'circular'
                          ? 'border-primary bg-primary/10'
                          : darkMode ? 'border-gray-600 bg-gray-700 hover:border-gray-500' : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                    >
                      {!canUseFeature('image_jar') && (
                        <div className="absolute top-2 right-2">
                          <ProBadge />
                        </div>
                      )}
                      <div className="h-24 mb-2 flex items-center justify-center">
                        <CircularJarVisualization progress={50} jarId={9998} isLarge={false} />
                      </div>
                      <p className={`text-sm font-medium text-center ${textColor}`}>Photo Circle</p>
                      <p className={`text-xs ${textSecondary} text-center mt-1`}>With custom image</p>
                    </button>
                  </div>
                </div>

                {/* Image Upload for Circular Jar */}
                {newJar.jarType === 'circular' && (
                  <div className="mb-4">
                    <label className={`block text-sm font-medium mb-2 ${textColor}`}>Upload Image (Optional)</label>
                    <div className="flex gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex-1 px-4 py-3 rounded-xl border-2 border-primary focus:outline-none flex items-center justify-center gap-2 ${
                          darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'hover:bg-gray-50'
                        }`}
                      >
                        <Upload size={18} />
                        {newJar.imageUrl ? 'Change Image' : 'Choose Image'}
                      </button>
                      {newJar.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setNewJar({ ...newJar, imageUrl: '' })}
                          className="px-4 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {newJar.imageUrl && (
                      <div className="mt-3 flex justify-center">
                        <img src={newJar.imageUrl} alt="Preview" className="w-24 h-24 object-cover rounded-full" />
                      </div>
                    )}
                  </div>
                )}

                <input
                  type="text"
                  placeholder="Jar Name"
                  value={newJar.name}
                  onChange={(e) => setNewJar({ ...newJar, name: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border-2 border-primary focus:outline-none mb-4 ${
                    darkMode ? 'bg-gray-700 text-white' : ''
                  }`}
                />
                <input
                  type="number"
                  placeholder={`Target (${newJar.currency})`}
                  value={newJar.target}
                  onChange={(e) => setNewJar({ ...newJar, target: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border-2 border-primary focus:outline-none mb-4 ${
                    darkMode ? 'bg-gray-700 text-white' : ''
                  }`}
                />
                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-2 ${textColor}`}>Category</label>
                  <select
                    value={newJar.categoryId}
                    onChange={(e) => setNewJar({ ...newJar, categoryId: parseInt(e.target.value) })}
                    className={`w-full px-4 py-3 rounded-xl border-2 border-primary focus:outline-none ${
                      darkMode ? 'bg-gray-700 text-white' : ''
                    }`}
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-2 ${textColor}`}>
                    Currency Symbol
                    {!canUseFeature('currency_symbols') && (
                      <ProBadge onClick={() => {
                        setPaywallFeature('Custom Currency Symbols');
                        setShowProPaywall(true);
                      }} className="ml-2" />
                    )}
                  </label>
                  <select
                    value={newJar.currency === customCurrency && customCurrency ? 'custom' : newJar.currency}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Only $ is free
                      if (val !== '$' && !canUseFeature('currency_symbols')) {
                        setPaywallFeature('Custom Currency Symbols');
                        setShowProPaywall(true);
                        e.target.value = '$';
                        return;
                      }
                      if (val === 'custom') {
                        setNewJar({ ...newJar, currency: customCurrency || '$' });
                      } else {
                        setNewJar({ ...newJar, currency: val });
                        setCustomCurrency('');
                      }
                    }}
                    className={`w-full px-4 py-3 rounded-xl border-2 border-primary focus:outline-none ${
                      darkMode ? 'bg-gray-700 text-white' : ''
                    }`}
                    >
                      <option value="$">$ (USD - Dollar)</option>
                      <option value="€">€ (EUR - Euro) 👑</option>
                      <option value="£">£ (GBP - Pound) 👑</option>
                      <option value="¥">¥ (JPY/CNY - Yen/Yuan) 👑</option>
                      <option value="₹">₹ (INR - Rupee) 👑</option>
                      <option value="₽">₽ (RUB - Ruble) 👑</option>
                      <option value="₩">₩ (KRW - Won) 👑</option>
                      <option value="PKR">PKR (Pakistani Rupee) 👑</option>
                      <option value="AED">AED (UAE Dirham) 👑</option>
                      <option value="SAR">SAR (Saudi Riyal) 👑</option>
                      <option value="CHF">CHF (Swiss Franc) 👑</option>
                      <option value="CAD">CAD (Canadian Dollar) 👑</option>
                      <option value="AUD">AUD (Australian Dollar) 👑</option>
                      <option value="custom">Custom Currency 👑</option>
                    </select>
                    {(newJar.currency === customCurrency || newJar.currency === 'custom') && (
                      <input
                        type="text"
                        placeholder="Enter custom currency (e.g., BTC, PKR, etc.)"
                        value={customCurrency}
                        onChange={(e) => {
                          setCustomCurrency(e.target.value);
                          setNewJar({ ...newJar, currency: e.target.value });
                        }}
                        className={`w-full px-4 py-3 rounded-xl border-2 border-primary focus:outline-none mt-2 ${
                          darkMode ? 'bg-gray-700 text-white' : ''
                        }`}
                      />
                    )}
                </div>
                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-2 ${textColor}`}>Target Date (Optional)</label>
                  <input
                    type="date"
                    value={newJar.targetDate}
                    onChange={(e) => setNewJar({ ...newJar, targetDate: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border-2 border-primary focus:outline-none ${
                      darkMode ? 'bg-gray-700 text-white' : ''
                    }`}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <p className={`text-xs ${textSecondary} mt-1`}>
                    Set a deadline to calculate daily/weekly/monthly savings needed
                  </p>
                </div>
                <div className="flex gap-3">
                  <SavingsButton variant="secondary" onClick={() => setShowCreateModal(false)} className="flex-1 whitespace-nowrap">
                    Cancel
                  </SavingsButton>
                  <SavingsButton onClick={createJar} className="flex-1 whitespace-nowrap">
                    Create
                  </SavingsButton>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center p-4 z-40 overflow-y-auto">
          <div className={`${cardBg} rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl my-8 max-h-[90vh] overflow-y-auto`}>
            <h3 className={`text-xl sm:text-2xl font-bold mb-6 ${textColor}`}>Add Note</h3>
            <textarea
              placeholder="Write your note..."
              value={newNote.text}
              onChange={(e) => setNewNote({ ...newNote, text: e.target.value })}
              rows={6}
              className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none mb-4 resize-none ${
                darkMode ? 'bg-gray-700 text-white' : ''
              }`}
              style={{ borderColor: '#000000', backgroundColor: noteColors[newNote.color].bg }}
            />
            <div className="mb-6">
              <label className={`block text-sm font-semibold mb-3 ${textColor}`}>Choose Color</label>
              <div className="grid grid-cols-6 gap-2">
                {Object.keys(noteColors).map(color => (
                  <button
                    key={color}
                    onClick={() => setNewNote({ ...newNote, color })}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 ${
                      newNote.color === color ? 'ring-4 ring-blue-400' : ''
                    }`}
                    style={{ backgroundColor: noteColors[color].bg, borderColor: noteColors[color].border }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <SavingsButton
                variant="secondary"
                onClick={() => {
                  setShowNoteModal(false);
                  setNewNote({ text: '', color: 'yellow' });
                }}
                className="flex-1"
              >
                Cancel
              </SavingsButton>
              <SavingsButton onClick={addNote} className="flex-1">
                Add
              </SavingsButton>
            </div>
          </div>
        </div>
      )}

      {/* Jar Note Modal */}
      {showJarNoteModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center p-4 z-40 overflow-y-auto">
          <div className={`${cardBg} rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl my-8 max-h-[90vh] overflow-y-auto`}>
            <h3 className={`text-xl sm:text-2xl font-bold mb-6 ${textColor}`}>Add Sticky Note</h3>
            <textarea
              placeholder="Write your note..."
              value={newJarNote.text}
              onChange={(e) => setNewJarNote({ ...newJarNote, text: e.target.value })}
              rows={6}
              className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none mb-4 resize-none ${
                darkMode ? 'bg-gray-700 text-white' : ''
              }`}
              style={{ borderColor: '#000000', backgroundColor: noteColors[newJarNote.color].bg }}
            />
            <div className="mb-6">
              <label className={`block text-sm font-semibold mb-3 ${textColor}`}>Choose Color</label>
              <div className="grid grid-cols-6 gap-2">
                {Object.keys(noteColors).map(color => (
                  <button
                    key={color}
                    onClick={() => setNewJarNote({ ...newJarNote, color })}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 ${
                      newJarNote.color === color ? 'ring-4 ring-blue-400' : ''
                    }`}
                    style={{ backgroundColor: noteColors[color].bg, borderColor: noteColors[color].border }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <SavingsButton
                variant="secondary"
                onClick={() => {
                  setShowJarNoteModal(false);
                  setNewJarNote({ text: '', color: 'yellow' });
                }}
                className="flex-1"
              >
                Cancel
              </SavingsButton>
              <SavingsButton onClick={addJarNote} className="flex-1">
                Add
              </SavingsButton>
            </div>
          </div>
        </div>
      )}

      {/* Records Modal */}
      {showRecordsModal && selectedJar && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center p-4 z-40 overflow-y-auto">
          <div className={`${cardBg} rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl my-8 max-h-[90vh] overflow-y-auto`}>
            <h3 className={`text-xl sm:text-2xl font-bold mb-6 ${textColor}`}>Transaction Records - {selectedJar.name}</h3>
            {selectedJar.records && selectedJar.records.length > 0 ? (
              <div className="space-y-3">
                {selectedJar.records
                  .map(record => {
                  const recordDate = new Date(record.date);
                  const isDebtJar = selectedJar.purposeType === 'debt';
                  
                  // For debt jars: saved (adding debt) is bad (red), withdrawn (paying off) is good (green)
                  // For saving jars: saved (adding money) is good (green), withdrawn is bad (red)
                  const isSaved = record.type === 'saved';
                  const isPositive = isDebtJar ? !isSaved : isSaved;
                  const bgColor = isPositive 
                    ? (darkMode ? 'bg-green-900/20' : 'bg-green-50')
                    : (darkMode ? 'bg-red-900/20' : 'bg-red-50');
                  const textColor = isPositive ? 'text-green-600' : 'text-red-600';
                  const badgeColor = isPositive ? 'bg-green-600 text-white' : 'bg-red-600 text-white';
                  const sign = isDebtJar 
                    ? (isSaved ? '+ ' : '- ')
                    : (isSaved ? '+ ' : '- ');
                  
                  return (
                    <div
                      key={record.id}
                      className={`p-4 rounded-xl ${bgColor}`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className={`font-bold ${textColor}`}>
                            {sign}{selectedJar.currency || '€'}{formatCurrency(record.amount)}
                          </p>
                          <p className={`text-sm ${textSecondary}`}>
                            {recordDate.toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeColor}`}>
                          {record.type === 'saved' ? (isDebtJar ? 'Added Debt' : 'Saved') : (isDebtJar ? 'Paid Off' : 'Withdrawn')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={`text-center ${textSecondary} py-8`}>No records yet. Start saving or withdrawing to see your history!</p>
            )}
            <div className="mt-6">
              <SavingsButton onClick={() => setShowRecordsModal(false)} className="w-full">
                Close
              </SavingsButton>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && jarToDelete && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center p-4 z-40 overflow-y-auto">
          <div className={`${cardBg} rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl my-8`}>
            <h3 className={`text-xl sm:text-2xl font-bold mb-4 ${textColor}`}>Delete Jar?</h3>
            <p className={`mb-6 ${textSecondary}`}>
              Delete "{jarToDelete.name}"? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <SavingsButton
                variant="secondary"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setJarToDelete(null);
                }}
                className="flex-1"
              >
                Cancel
              </SavingsButton>
              <SavingsButton variant="danger" onClick={() => deleteJar(jarToDelete.id)} className="flex-1">
                Delete
              </SavingsButton>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center p-4 z-40 overflow-y-auto">
          <div className={`${cardBg} rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl my-8`}>
            <h3 className={`text-xl sm:text-2xl font-bold mb-6 ${textColor}`}>Create New Category</h3>
            <input
              type="text"
              placeholder="Category Name"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl border-2 border-primary focus:outline-none mb-4 ${
                darkMode ? 'bg-gray-700 text-white' : ''
              }`}
            />
            <div className="flex gap-3">
              <SavingsButton variant="secondary" onClick={() => setShowCategoryModal(false)} className="flex-1 whitespace-nowrap">
                Cancel
              </SavingsButton>
              <SavingsButton onClick={createCategory} className="flex-1 whitespace-nowrap">
                Create
              </SavingsButton>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditCategoryModal && editingCategory && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center p-4 z-40 overflow-y-auto">
          <div className={`${cardBg} rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl my-8`}>
            <h3 className={`text-xl sm:text-2xl font-bold mb-6 ${textColor}`}>Edit Category</h3>
            <input
              type="text"
              placeholder="Category Name"
              value={editingCategory.name}
              onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl border-2 border-primary focus:outline-none mb-4 ${
                darkMode ? 'bg-gray-700 text-white' : ''
              }`}
            />
            <div className="flex gap-3">
              <SavingsButton 
                variant="secondary" 
                onClick={() => {
                  setShowEditCategoryModal(false);
                  setEditingCategory(null);
                }} 
                className="flex-1 whitespace-nowrap"
              >
                Cancel
              </SavingsButton>
              <SavingsButton onClick={updateCategory} className="flex-1 whitespace-nowrap">
                Save
              </SavingsButton>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      {showDeleteCategoryConfirm && categoryToDelete && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className={`${cardBg} rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl my-8`}>
            <h3 className={`text-xl sm:text-2xl font-bold mb-4 ${textColor}`}>Delete Category?</h3>
            <p className={`mb-6 ${textSecondary}`}>
              Delete category "{categoryToDelete.name}"? This will also delete all jars in this category. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <SavingsButton
                variant="secondary"
                onClick={() => {
                  setShowDeleteCategoryConfirm(false);
                  setCategoryToDelete(null);
                }}
                className="flex-1"
              >
                Cancel
              </SavingsButton>
              <SavingsButton variant="danger" onClick={() => deleteCategory(categoryToDelete.id)} className="flex-1">
                Delete
              </SavingsButton>
            </div>
          </div>
        </div>
      )}

      {/* Calculator Modal */}
      {showCalculator && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center p-4 z-40 overflow-y-auto">
          <div className={`${cardBg} rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl my-8 max-h-[90vh] overflow-y-auto`}>
            <h3 className={`text-xl sm:text-2xl font-bold mb-6 ${textColor} flex items-center gap-2`}>
              📊 Savings Calculator
            </h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${textColor}`}>Target Amount ($)</label>
                <input
                  type="number"
                  placeholder="Enter target amount"
                  value={calcTargetAmount}
                  onChange={(e) => setCalcTargetAmount(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border-2 border-primary focus:outline-none ${
                    darkMode ? 'bg-gray-700 text-white' : ''
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${textColor}`}>Target Date</label>
                <input
                  type="date"
                  value={calcTargetDate}
                  onChange={(e) => setCalcTargetDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-3 rounded-xl border-2 border-primary focus:outline-none ${
                    darkMode ? 'bg-gray-700 text-white' : ''
                  }`}
                />
              </div>
              <SavingsButton onClick={calculateDailySavings} className="w-full">
                Calculate
              </SavingsButton>
            </div>
            
            {dailySavings !== null && (
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-gradient-to-br from-blue-50 to-purple-50'} rounded-2xl p-6 mb-6`}>
                <h4 className={`text-lg font-bold ${textColor} mb-4 text-center`}>
                  Daily Savings Plan
                </h4>
                <>
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 text-center mb-3`}>
                    <p className={`text-sm ${textSecondary} mb-1`}>Save Daily</p>
                    <p className={`text-3xl font-bold ${textColor}`}>${formatCurrency(dailySavings)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-3 text-center`}>
                      <p className={`text-xs ${textSecondary} mb-1`}>Weekly</p>
                      <p className={`text-lg font-bold ${textColor}`}>${formatCurrency(dailySavings * 7)}</p>
                    </div>
                    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-3 text-center`}>
                      <p className={`text-xs ${textSecondary} mb-1`}>Monthly</p>
                      <p className={`text-lg font-bold ${textColor}`}>${formatCurrency(dailySavings * 30)}</p>
                    </div>
                  </div>
                </>
                <p className={`text-xs ${textSecondary} text-center mt-3`}>
                  To reach ${formatCurrency(parseFloat(calcTargetAmount))} by {new Date(calcTargetDate).toLocaleDateString()}
                </p>
              </div>
            )}

            <SavingsButton 
              variant="secondary" 
              onClick={() => {
                setShowCalculator(false);
                setCalcTargetAmount('');
                setCalcTargetDate('');
                setDailySavings(null);
              }} 
              className="w-full"
            >
              Close
            </SavingsButton>
          </div>
        </div>
      )}
    </div>

      <ProPaywall
        isOpen={showProPaywall}
        onClose={() => setShowProPaywall(false)}
        featureName={paywallFeature}
      />
    </>
  );
};

export default Index;
