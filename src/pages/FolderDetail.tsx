import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pin, Settings, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage';
import { formatCurrency } from '@/lib/utils';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { SortableJarCard } from '@/components/SortableJarCard';
import SavingsButton from '@/components/SavingsButton';
import JarVisualization from '@/components/JarVisualization';
import CircularJarVisualization from '@/components/CircularJarVisualization';
import { RecurringTransactions } from '@/components/RecurringTransactions';

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
  notes?: any[];
  records?: any[];
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

const FolderDetail = () => {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const [folderName, setFolderName] = useState('');
  const [goals, setGoals] = useState<Jar[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedJar, setSelectedJar] = useState<Jar | null>(null);
  const [addAmount, setAddAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showJarNoteModal, setShowJarNoteModal] = useState(false);
  const [newJarNote, setNewJarNote] = useState({ text: '', color: 'yellow' });
  const [showRecordsModal, setShowRecordsModal] = useState(false);
  const [selectedJarNoteId, setSelectedJarNoteId] = useState<number | null>(null);

  // Drag and Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadFolderData();
  }, [folderId]);

  const loadFolderData = () => {
    const folders = storage.loadFolders();
    const jars = storage.loadJars();
    const loadedCategories = storage.loadCategories();
    const id = parseInt(folderId || '0');
    
    const folder = folders.find(f => f.id === id);
    setFolderName(folder?.name || 'Unknown Folder');
    setCategories(loadedCategories);

    // Filter goals based on folder type
    let filteredGoals: Jar[] = [];
    if (id === 1) {
      // Jars folder - show goals without images
      filteredGoals = jars.filter(jar => !jar.imageUrl);
    } else if (id === 2) {
      // Image-Based Goals - show goals with images
      filteredGoals = jars.filter(jar => jar.imageUrl);
    } else if (id === 3) {
      // All Goals - show goals with progress
      filteredGoals = jars.filter(jar => jar.saved > 0 || jar.target > 0);
    } else {
      // Custom folder
      filteredGoals = jars.filter(jar => jar.folderId === id);
    }

    // Sort by pinned status and order
    filteredGoals.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (a.order || 0) - (b.order || 0);
    });

    setGoals(filteredGoals);
  };

  const handleDragEnd = (event: DragEndEvent, categoryId: number) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const categoryGoals = goals.filter(g => g.categoryId === categoryId);
      const oldIndex = categoryGoals.findIndex((goal) => goal.id === active.id);
      const newIndex = categoryGoals.findIndex((goal) => goal.id === over.id);

      const reorderedCategoryGoals = arrayMove(categoryGoals, oldIndex, newIndex);
      
      // Update order property for category goals
      const updatedCategoryGoals = reorderedCategoryGoals.map((goal, index) => ({
        ...goal,
        order: index
      }));

      // Merge with other goals
      const otherGoals = goals.filter(g => g.categoryId !== categoryId);
      const allUpdatedGoals = [...otherGoals, ...updatedCategoryGoals];
      setGoals(allUpdatedGoals);
      
      // Save to storage
      const allJars = storage.loadJars();
      const updatedAllJars = allJars.map(jar => {
        const updatedGoal = allUpdatedGoals.find(g => g.id === jar.id);
        return updatedGoal || jar;
      });
      storage.saveJars(updatedAllJars);
    }
  };

  const togglePin = (jarId: number) => {
    const updatedGoals = goals.map(goal => 
      goal.id === jarId ? { ...goal, isPinned: !goal.isPinned } : goal
    );
    
    // Re-sort after pinning
    updatedGoals.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (a.order || 0) - (b.order || 0);
    });

    setGoals(updatedGoals);
    
    // Save to storage
    const allJars = storage.loadJars();
    const updatedAllJars = allJars.map(jar => {
      const updatedGoal = updatedGoals.find(g => g.id === jar.id);
      return updatedGoal || jar;
    });
    storage.saveJars(updatedAllJars);
  };

  const handleJarDelete = (jar: Jar) => {
    const allJars = storage.loadJars();
    const updatedJars = allJars.filter(j => j.id !== jar.id);
    storage.saveJars(updatedJars);
    loadFolderData();
  };

  const getTotalSaved = () => {
    return goals.reduce((sum, goal) => sum + goal.saved, 0);
  };

  const getTotalTarget = () => {
    return goals.reduce((sum, goal) => sum + goal.target, 0);
  };

  const getOverallProgress = () => {
    const total = getTotalTarget();
    return total > 0 ? (getTotalSaved() / total) * 100 : 0;
  };

  const getCategoryGoals = (categoryId: number) => {
    return goals.filter(goal => goal.categoryId === categoryId);
  };

  const addMoney = () => {
    if (!addAmount || !selectedJar) return;
    const amount = parseFloat(addAmount);
    const allJars = storage.loadJars();
    const updatedJars = allJars.map(jar => {
      if (jar.id === selectedJar.id) {
        const newSaved = Math.min(jar.saved + amount, jar.target);
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
    storage.saveJars(updatedJars);
    setSelectedJar(updatedJars.find(j => j.id === selectedJar.id) || null);
    loadFolderData();
    setAddAmount('');
  };

  const withdrawMoney = () => {
    if (!withdrawAmount || !selectedJar) return;
    const amount = parseFloat(withdrawAmount);
    const allJars = storage.loadJars();
    const updatedJars = allJars.map(jar => {
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
    storage.saveJars(updatedJars);
    setSelectedJar(updatedJars.find(j => j.id === selectedJar.id) || null);
    loadFolderData();
    setWithdrawAmount('');
  };

  const addJarNote = () => {
    if (newJarNote.text.trim() && selectedJar) {
      const allJars = storage.loadJars();
      const updatedJars = allJars.map(jar => {
        if (jar.id === selectedJar.id) {
          const updatedNotes = [...(jar.notes || []), { id: Date.now(), text: newJarNote.text, color: newJarNote.color }];
          return { ...jar, notes: updatedNotes };
        }
        return jar;
      });
      storage.saveJars(updatedJars);
      setSelectedJar(updatedJars.find(j => j.id === selectedJar.id) || null);
      loadFolderData();
      setNewJarNote({ text: '', color: 'yellow' });
      setShowJarNoteModal(false);
    }
  };

  const deleteJarNote = (noteId: number) => {
    if (selectedJar) {
      const allJars = storage.loadJars();
      const updatedJars = allJars.map(jar => {
        if (jar.id === selectedJar.id) {
          const updatedNotes = (jar.notes || []).filter(n => n.id !== noteId);
          return { ...jar, notes: updatedNotes };
        }
        return jar;
      });
      storage.saveJars(updatedJars);
      setSelectedJar(updatedJars.find(j => j.id === selectedJar.id) || null);
      loadFolderData();
    }
  };

  const handleSaveRecurringTransaction = (jarId: number, transaction: any) => {
    const allJars = storage.loadJars();
    const updatedJars = allJars.map(jar => 
      jar.id === jarId ? { ...jar, recurringTransaction: transaction } : jar
    );
    storage.saveJars(updatedJars);
    if (selectedJar && selectedJar.id === jarId) {
      setSelectedJar({ ...selectedJar, recurringTransaction: transaction });
    }
    loadFolderData();
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
    
    return {
      daily: remaining / 30,
      weekly: remaining / 4,
      monthly: remaining
    };
  };

  const noteColors: Record<string, { bg: string; border: string }> = {
    yellow: { bg: '#FEFF9C', border: '#E5E67A' },
    pink: { bg: '#FFB3D9', border: '#FF8DC7' },
    skyblue: { bg: '#A8E6FF', border: '#7DD3FC' },
    red: { bg: '#FFA6A6', border: '#FF7979' },
    orange: { bg: '#FFD4A3', border: '#FFA94D' },
    lightgreen: { bg: '#B8F5CD', border: '#86EFAC' }
  };

  const darkMode = false; // Will be determined by theme
  const textColor = 'text-foreground';
  const textSecondary = 'text-muted-foreground';
  const cardBg = 'bg-card';
  const bgColor = 'bg-background';

  return (
    <div className={`min-h-screen ${bgColor} pb-20`}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-screen-xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/folders')}
              variant="ghost"
              size="icon"
            >
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">{folderName}</h1>
          </div>
          <Button
            onClick={() => navigate('/settings')}
            variant="ghost"
            size="icon"
          >
            <Settings size={20} />
          </Button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-4 sm:p-6">
        {!selectedJar ? (
          <>
            {/* Summary Card */}
            <div className={`${cardBg} rounded-2xl p-4 mb-6 shadow-lg`}>
              <h2 className={`text-xl font-bold ${textColor} mb-4`}>Overview</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className={`text-xs ${textSecondary} mb-1`}>Total Saved</p>
                  <p className={`text-lg font-bold text-green-600`}>
                    €{formatCurrency(getTotalSaved())}
                  </p>
                </div>
                <div>
                  <p className={`text-xs ${textSecondary} mb-1`}>Target</p>
                  <p className={`text-lg font-bold ${textColor}`}>
                    €{formatCurrency(getTotalTarget())}
                  </p>
                </div>
                <div>
                  <p className={`text-xs ${textSecondary} mb-1`}>Progress</p>
                  <p className={`text-lg font-bold ${
                    getOverallProgress() >= 75 ? 'text-green-600' :
                    getOverallProgress() >= 50 ? 'text-blue-600' :
                    getOverallProgress() >= 25 ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {getOverallProgress().toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Categories with Goals */}
            <div className={`${cardBg} rounded-2xl p-4 shadow-lg`}>
              <div className="space-y-6">
                {categories.filter(cat => getCategoryGoals(cat.id).length > 0).map(category => {
                  const categoryGoals = getCategoryGoals(category.id);
                  
                  return (
                    <div 
                      key={category.id} 
                      className={`${darkMode ? 'bg-gray-700/50' : 'bg-gradient-to-br from-blue-50/50 to-purple-50/50'} rounded-2xl p-4`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-lg font-bold ${textColor}`}>{category.name}</h3>
                        <p className={`text-sm ${textSecondary}`}>
                          {categoryGoals.length} {categoryGoals.length === 1 ? 'goal' : 'goals'}
                        </p>
                      </div>

                      {/* Goals - Horizontal Scrollable with Drag & Drop */}
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(event) => handleDragEnd(event, category.id)}
                      >
                        <SortableContext
                          items={categoryGoals.map(goal => goal.id)}
                          strategy={horizontalListSortingStrategy}
                        >
                          <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
                            {categoryGoals.map(goal => {
                              const progress = goal.target > 0 ? ((goal.saved / goal.target) * 100).toFixed(1) : '0.0';
                              return (
                                <SortableJarCard
                                  key={goal.id}
                                  jar={goal}
                                  progress={parseFloat(progress)}
                                  darkMode={darkMode}
                                  textColor={textColor}
                                  textSecondary={textSecondary}
                                  cardBg={cardBg}
                                  onSelect={setSelectedJar}
                                  onDelete={handleJarDelete}
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
              </div>
            </div>
          </>
        ) : (
          <div className={`${cardBg} rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl`}>
            <div className="flex justify-between items-center gap-4 mb-6">
              <button onClick={() => setSelectedJar(null)} className={`${textSecondary} hover:underline text-sm sm:text-base`}>
                ← Back
              </button>
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
                  progress={selectedJar.target > 0 ? (selectedJar.saved / selectedJar.target) * 100 : 0} 
                  jarId={selectedJar.id} 
                  isLarge={true} 
                  imageUrl={selectedJar.imageUrl}
                  isDebtJar={selectedJar.purposeType === 'debt'}
                />
              ) : (
                <JarVisualization 
                  progress={selectedJar.target > 0 ? (selectedJar.saved / selectedJar.target) * 100 : 0} 
                  jarId={selectedJar.id} 
                  isLarge={true}
                  isDebtJar={selectedJar.purposeType === 'debt'}
                />
              )}
            </div>
            <div className="text-center mb-4 sm:mb-6">
              <div
                className={`text-3xl sm:text-4xl md:text-5xl font-bold ${(() => {
                  const p = selectedJar.target > 0 ? (selectedJar.saved / selectedJar.target) * 100 : 0;
                  if (selectedJar.purposeType === 'debt') {
                    return p >= 75 ? 'text-red-600' : p >= 50 ? 'text-orange-600' : p >= 25 ? 'text-blue-600' : 'text-green-600';
                  }
                  return p >= 75 ? 'text-green-600' : p >= 50 ? 'text-blue-600' : p >= 25 ? 'text-orange-600' : 'text-red-600';
                })()}`}
              >
                {selectedJar.target > 0 ? ((selectedJar.saved / selectedJar.target) * 100).toFixed(1) : '0.0'}%
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-muted'} rounded-xl sm:rounded-2xl p-3 sm:p-4`}>
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                  <span className={`text-xs sm:text-sm ${textSecondary}`}>Saved</span>
                </div>
                <p className={`text-base sm:text-xl md:text-2xl font-bold text-green-600 break-words`}>
                  {selectedJar.currency || '€'}{formatCurrency(selectedJar.saved)}
                </p>
              </div>
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-purple-50'} rounded-xl sm:rounded-2xl p-3 sm:p-4`}>
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                  <span className={`text-xs sm:text-sm ${textSecondary}`}>Target</span>
                </div>
                <p className={`text-base sm:text-xl md:text-2xl font-bold ${textColor} break-words`}>
                  {selectedJar.currency || '€'}{formatCurrency(selectedJar.target)}
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {selectedJar.purposeType === 'debt' ? (
                <>
                  <div className="flex gap-3 items-stretch">
                    <input
                      type="number"
                      placeholder={`Amount (${selectedJar.currency || '€'})`}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className={`w-[140px] px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border-2 border-gray-300 focus:border-primary focus:outline-none ${darkMode ? 'bg-gray-700 text-white' : ''}`}
                    />
                    <SavingsButton onClick={withdrawMoney} size="default" className="text-sm sm:text-base flex-1 whitespace-nowrap bg-black hover:bg-black/90 text-white">
                      Pay Off
                    </SavingsButton>
                  </div>
                  <div className="flex gap-3 items-stretch">
                    <input
                      type="number"
                      placeholder={`Amount (${selectedJar.currency || '€'})`}
                      value={addAmount}
                      onChange={(e) => setAddAmount(e.target.value)}
                      className={`w-[140px] px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border-2 border-gray-300 focus:border-primary focus:outline-none ${darkMode ? 'bg-gray-700 text-white' : ''}`}
                    />
                    <SavingsButton onClick={addMoney} size="default" className="text-sm sm:text-base flex-1 whitespace-nowrap bg-red-500 hover:bg-red-600 text-white">
                      Add Debt
                    </SavingsButton>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex gap-3 items-stretch">
                    <input
                      type="number"
                      placeholder={`Amount (${selectedJar.currency || '€'})`}
                      value={addAmount}
                      onChange={(e) => setAddAmount(e.target.value)}
                      className={`w-[140px] px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border-2 border-gray-300 focus:border-primary focus:outline-none ${darkMode ? 'bg-gray-700 text-white' : ''}`}
                    />
                    <SavingsButton onClick={addMoney} size="default" className="text-sm sm:text-base flex-1 whitespace-nowrap">
                      Add
                    </SavingsButton>
                  </div>
                  <div className="flex gap-3 items-stretch">
                    <input
                      type="number"
                      placeholder={`Amount (${selectedJar.currency || '€'})`}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className={`w-[140px] px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border-2 border-gray-300 focus:border-primary focus:outline-none ${darkMode ? 'bg-gray-700 text-white' : ''}`}
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

            {/* Recurring Transactions */}
            <div className="mb-6">
              <RecurringTransactions
                jarId={selectedJar.id}
                jarName={selectedJar.name}
                recurringTransaction={selectedJar.recurringTransaction}
                onSave={handleSaveRecurringTransaction}
              />
            </div>

            {/* Investment Projections */}
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-gradient-to-br from-blue-50 to-purple-50'} rounded-2xl p-4 mb-6`}>
              <h3 className={`text-lg font-bold ${textColor} mb-2 flex items-center gap-2`}>
                📈 Investment Plan
                {selectedJar.targetDate && (
                  <span className={`text-xs ${textSecondary} font-normal`}>
                    (Target: {new Date(selectedJar.targetDate).toLocaleDateString()})
                  </span>
                )}
              </h3>
              <div className="grid grid-cols-3 gap-3">
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
            </div>

            {selectedJar.notes && selectedJar.notes.length > 0 && (
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-2xl p-4 mb-6`}>
                <h3 className={`text-lg font-bold ${textColor} mb-3`}>Sticky Notes</h3>
                <div className="flex lg:grid lg:grid-cols-2 gap-4 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
                  {selectedJar.notes.map(note => (
                    <div
                      key={note.id}
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
                      <p className="text-gray-800 text-sm break-words whitespace-pre-wrap overflow-hidden">{note.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Note Modal */}
      {showJarNoteModal && selectedJar && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
          <div className={`${cardBg} rounded-3xl p-6 max-w-md w-full shadow-2xl`}>
            <h3 className={`text-xl font-bold mb-4 ${textColor}`}>Add Sticky Note</h3>
            <textarea
              placeholder="Write your note here..."
              value={newJarNote.text}
              onChange={(e) => setNewJarNote({ ...newJarNote, text: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl border-2 border-primary focus:outline-none mb-4 min-h-[120px] ${darkMode ? 'bg-gray-700 text-white' : ''}`}
            />
            <div className="grid grid-cols-6 gap-2 mb-4">
              {Object.keys(noteColors).map(color => (
                <button
                  key={color}
                  onClick={() => setNewJarNote({ ...newJarNote, color })}
                  className={`w-full aspect-square rounded-lg border-2 ${newJarNote.color === color ? 'border-black scale-110' : 'border-transparent'} transition-all`}
                  style={{ backgroundColor: noteColors[color].bg }}
                />
              ))}
            </div>
            <div className="flex gap-3">
              <SavingsButton variant="secondary" onClick={() => setShowJarNoteModal(false)} className="flex-1">
                Cancel
              </SavingsButton>
              <SavingsButton onClick={addJarNote} className="flex-1">
                Add Note
              </SavingsButton>
            </div>
          </div>
        </div>
      )}

      {/* Records Modal */}
      {showRecordsModal && selectedJar && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
          <div className={`${cardBg} rounded-3xl p-6 max-w-2xl w-full shadow-2xl max-h-[80vh] overflow-y-auto`}>
            <h3 className={`text-xl font-bold mb-4 ${textColor}`}>Transaction Records</h3>
            {selectedJar.records && selectedJar.records.length > 0 ? (
              <div className="space-y-2">
                {selectedJar.records.slice().reverse().map(record => (
                  <div key={record.id} className={`flex justify-between items-center p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div>
                      <p className={`font-semibold ${record.type === 'saved' ? 'text-green-600' : 'text-red-600'}`}>
                        {record.type === 'saved' ? '+ ' : '- '}{selectedJar.currency || '€'}{formatCurrency(record.amount)}
                      </p>
                      <p className={`text-xs ${textSecondary}`}>
                        {new Date(record.date).toLocaleDateString()} {new Date(record.date).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${record.type === 'saved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {record.type === 'saved' ? 'Added' : 'Withdrawn'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={textSecondary}>No transactions yet</p>
            )}
            <SavingsButton variant="secondary" onClick={() => setShowRecordsModal(false)} className="w-full mt-4">
              Close
            </SavingsButton>
          </div>
        </div>
      )}

      {/* Custom scrollbar styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default FolderDetail;
