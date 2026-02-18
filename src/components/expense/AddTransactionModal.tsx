import { useState, useEffect, useRef } from 'react';
import { X, Calendar, DollarSign, FileText, StickyNote, Wallet, TrendingUp, TrendingDown, Camera, Image as ImageIcon, Mic, MicOff, MapPin, Sparkles, Layers, Upload, Circle, Square, Play, Pause, Trash2 } from 'lucide-react';
import { useExpense } from '@/contexts/ExpenseContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { hapticFeedback } from '@/lib/haptics';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { FREE_LIMITS } from '@/lib/freeLimits';
import { ProPaywall } from '@/components/ProPaywall';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { currencies, loadCurrencySettings, convertCurrency, formatCurrencyAmount, getCurrencyByCode } from '@/lib/currency';
import { useSmartSuggestions } from '@/hooks/useSmartSuggestions';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { BatchEntryModal } from './BatchEntryModal';
import { motion, AnimatePresence } from 'framer-motion';
import { requestPermission } from '@/lib/permissions';

interface Account {
  id: string;
  name: string;
  icon: string;
}

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'expense' | 'income' | null;
}

const ACCOUNTS_STORAGE_KEY = 'jarify_accounts';

export const AddTransactionModal = ({ isOpen, onClose, initialType = null }: AddTransactionModalProps) => {
  const { categories, expenses, incomes, addExpense, addIncome } = useExpense();
  const { toast } = useToast();
  const { canUseFeature } = useSubscription();
  const isPremium = canUseFeature('unlimited_transactions');
  const [showPaywall, setShowPaywall] = useState(false);
  const [step, setStep] = useState<'select' | 'form'>(initialType ? 'form' : 'select');
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>(initialType || 'expense');
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  // Form fields
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [note, setNote] = useState('');
  const [description, setDescription] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Voice memo state
  const [voiceMemoUrl, setVoiceMemoUrl] = useState<string | null>(null);

  // Smart features state
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationSuggestion, setLocationSuggestion] = useState<string | null>(null);
  const [smartSuggestion, setSmartSuggestion] = useState<{ category: string | null; amount: number | null } | null>(null);
  const [showImageOptions, setShowImageOptions] = useState(false);

  // Smart suggestions hook
  const { suggestCategory, suggestAmount, suggestFromLocation, parseVoiceInput, getFrequentAmounts } = useSmartSuggestions();

  // Voice input hook (speech-to-text)
  const { 
    isListening, 
    isSupported: voiceSupported, 
    transcript, 
    interimTranscript,
    error: voiceError,
    startListening, 
    stopListening,
    resetTranscript 
  } = useVoiceInput({
    language: 'en-US',
    onResult: (result) => {
      if (result.isFinal) {
        handleVoiceResult(result.transcript);
      }
    },
    onError: (error) => {
      toast({ title: 'Voice Error', description: error, variant: 'destructive' });
    }
  });

  // Voice recorder hook (audio recording)
  const {
    isRecording: isRecordingMemo,
    isPaused: isMemoPaused,
    formattedDuration: memoDuration,
    audioUrl: memoAudioUrl,
    isSupported: recorderSupported,
    startRecording: startMemoRecording,
    stopRecording: stopMemoRecording,
    pauseRecording: pauseMemoRecording,
    resumeRecording: resumeMemoRecording,
    discardRecording: discardMemoRecording
  } = useVoiceRecorder({
    maxDuration: 120,
    onRecordingComplete: (blob, url) => {
      setVoiceMemoUrl(url);
      toast({ title: 'Voice memo recorded', description: 'Audio attached to transaction' });
    },
    onError: (error) => {
      toast({ title: 'Recording Error', description: error, variant: 'destructive' });
    }
  });

  // Load currency settings
  useEffect(() => {
    const settings = loadCurrencySettings();
    setSelectedCurrency(settings.baseCurrency);
  }, [isOpen]);

  // Load accounts
  useEffect(() => {
    const saved = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (saved) {
      setAccounts(JSON.parse(saved));
    }
  }, [isOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(initialType ? 'form' : 'select');
      setTransactionType(initialType || 'expense');
      setDate(new Date().toISOString().split('T')[0]);
      setAmount('');
      setCategoryId('');
      setAccountId('');
      setNote('');
      setDescription('');
      setReceiptUrl('');
      setReceiptPreview(null);
      setSmartSuggestion(null);
      setLocationSuggestion(null);
      setVoiceMemoUrl(null);
      setShowImageOptions(false);
      resetTranscript();
      discardMemoRecording();
      const settings = loadCurrencySettings();
      setSelectedCurrency(settings.baseCurrency);
    }
  }, [isOpen, initialType, resetTranscript, discardMemoRecording]);

  // Smart suggestion when description changes
  useEffect(() => {
    if (description.length >= 3) {
      const suggestedCat = suggestCategory(description, transactionType);
      const suggestedAmt = suggestAmount(description);
      
      if (suggestedCat || suggestedAmt) {
        setSmartSuggestion({ category: suggestedCat, amount: suggestedAmt });
      } else {
        setSmartSuggestion(null);
      }
    } else {
      setSmartSuggestion(null);
    }
  }, [description, transactionType, suggestCategory, suggestAmount]);

  // Handle voice result
  const handleVoiceResult = (voiceText: string) => {
    const parsed = parseVoiceInput(voiceText);
    
    if (parsed.amount) {
      setAmount(parsed.amount.toString());
    }
    if (parsed.description) {
      setDescription(parsed.description);
      setNote(parsed.description);
    }
    if (parsed.categoryId) {
      setCategoryId(parsed.categoryId);
    }
    if (parsed.type !== transactionType) {
      setTransactionType(parsed.type);
    }

    toast({ 
      title: 'Voice captured ✓', 
      description: `"${voiceText}"` 
    });
  };

  // Handle location-based suggestion
  const handleLocationSuggest = async () => {
    setIsLoadingLocation(true);
    try {
      const suggestion = await suggestFromLocation();
      
      if (suggestion.categoryId) {
        setCategoryId(suggestion.categoryId);
        setLocationSuggestion(suggestion.placeName || 'Current location');
        toast({ 
          title: 'Location detected ✓', 
          description: `Category set based on ${suggestion.placeName || 'your location'}` 
        });
      } else if (suggestion.placeName) {
        setDescription(prev => prev || suggestion.placeName || '');
        setLocationSuggestion(suggestion.placeName);
        toast({ title: 'Location added', description: suggestion.placeName });
      } else {
        toast({ 
          title: 'No suggestion', 
          description: 'Could not determine category from location', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      toast({ 
        title: 'Location error', 
        description: 'Could not get your location', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Apply smart suggestion
  const applySmartSuggestion = () => {
    if (smartSuggestion?.category) {
      setCategoryId(smartSuggestion.category);
    }
    if (smartSuggestion?.amount && !amount) {
      setAmount(smartSuggestion.amount.toString());
    }
    setSmartSuggestion(null);
    toast({ title: 'Smart suggestion applied ✓' });
  };

  // Handle receipt image upload from gallery
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'File too large', description: 'Please select an image under 5MB', variant: 'destructive' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setReceiptUrl(base64);
        setReceiptPreview(base64);
        setShowImageOptions(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle camera capture
  const handleCameraCapture = async () => {
    const granted = await requestPermission('camera');
    if (!granted) {
      toast({ title: 'Camera access needed', description: 'Please allow camera access to capture receipts', variant: 'destructive' });
      return;
    }
    cameraInputRef.current?.click();
    setShowImageOptions(false);
  };

  const removeReceipt = () => {
    setReceiptUrl('');
    setReceiptPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const removeVoiceMemo = () => {
    setVoiceMemoUrl(null);
    discardMemoRecording();
  };

  // Filter categories based on transaction type
  const expenseCategories = categories.filter(c => c.budget > 0);
  const incomeCategories = categories.filter(c => c.budget === 0);
  const filteredCategories = transactionType === 'expense' ? expenseCategories : incomeCategories;

  const handleTypeSelect = (type: 'expense' | 'income') => {
    hapticFeedback.medium();
    setTransactionType(type);
    setStep('form');
    const cats = type === 'expense' ? expenseCategories : incomeCategories;
    if (cats.length > 0) {
      setCategoryId(cats[0].id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: 'Invalid amount', description: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }

    if (!categoryId) {
      toast({ title: 'Select category', description: 'Please select a category', variant: 'destructive' });
      return;
    }

    // Check free tier limits
    if (!isPremium) {
      if (transactionType === 'expense' && expenses.length >= FREE_LIMITS.maxExpenses) {
        setShowPaywall(true);
        return;
      }
      if (transactionType === 'income' && incomes.length >= FREE_LIMITS.maxIncomes) {
        setShowPaywall(true);
        return;
      }
    }

    const settings = loadCurrencySettings();
    const originalAmount = parseFloat(amount);
    const convertedAmount = convertCurrency(originalAmount, selectedCurrency, settings.baseCurrency);

    const transactionData = {
      categoryId,
      amount: convertedAmount,
      originalAmount: originalAmount,
      currency: selectedCurrency,
      description: description || note || (transactionType === 'expense' ? 'Expense' : 'Income'),
      date,
      accountId: accountId || undefined,
      receiptUrl: receiptUrl || undefined,
      voiceMemoUrl: voiceMemoUrl || undefined,
    };

    if (transactionType === 'expense') {
      addExpense(transactionData);
      hapticFeedback.success();
      toast({ 
        title: 'Expense added', 
        description: `${formatCurrencyAmount(originalAmount, selectedCurrency)} expense recorded` 
      });
    } else {
      addIncome(transactionData);
      hapticFeedback.success();
      toast({ 
        title: 'Income added', 
        description: `${formatCurrencyAmount(originalAmount, selectedCurrency)} income recorded` 
      });
    }

    onClose();
  };

  const handleBack = () => {
    if (step === 'form' && !initialType) {
      setStep('select');
    } else {
      onClose();
    }
  };

  // Get frequent amounts for quick selection
  const frequentAmounts = categoryId ? getFrequentAmounts(categoryId) : [];

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          onClick={e => e.stopPropagation()}
          className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
            <button onClick={handleBack} className="p-2 rounded-full hover:bg-secondary">
              <X size={20} className="text-muted-foreground" />
            </button>
            <h2 className="text-xl font-bold text-foreground">
              {step === 'select' ? 'Add Transaction' : `Add ${transactionType === 'expense' ? 'Expense' : 'Income'}`}
            </h2>
            <div className="w-9" />
          </div>

          {/* Step: Select Type */}
          {step === 'select' && (
            <div className="p-6 space-y-4">
              <p className="text-center text-muted-foreground mb-6">What would you like to add?</p>
              
              <button
                onClick={() => handleTypeSelect('expense')}
                className="w-full p-6 bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 rounded-2xl flex items-center gap-4"
              >
                <div className="w-14 h-14 bg-destructive/20 rounded-2xl flex items-center justify-center">
                  <TrendingDown size={28} className="text-destructive" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground text-lg">Expense</p>
                  <p className="text-sm text-muted-foreground">Track money you spent</p>
                </div>
              </button>

              <button
                onClick={() => handleTypeSelect('income')}
                className="w-full p-6 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-2xl flex items-center gap-4"
              >
                <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center">
                  <TrendingUp size={28} className="text-green-500" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground text-lg">Income</p>
                  <p className="text-sm text-muted-foreground">Record money you earned</p>
                </div>
              </button>

              {/* Batch Entry Button */}
              <button
                onClick={() => {
                  hapticFeedback.medium();
                  onClose();
                  setTimeout(() => setShowBatchModal(true), 100);
                }}
                className="w-full p-6 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-2xl flex items-center gap-4"
              >
                <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center">
                  <Layers size={28} className="text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground text-lg">Batch Entry</p>
                  <p className="text-sm text-muted-foreground">Add multiple transactions quickly</p>
                </div>
              </button>
            </div>
          )}

          {/* Step: Form */}
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Smart Actions Bar */}
              <div className="flex gap-2 mb-2">
                {/* Voice Input */}
                {voiceSupported && (
                  <button
                    type="button"
                    onClick={() => {
                      hapticFeedback.light();
                      isListening ? stopListening() : startListening();
                    }}
                    className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                      isListening 
                        ? 'bg-destructive text-destructive-foreground animate-pulse' 
                        : 'bg-secondary hover:bg-secondary/80 text-foreground'
                    }`}
                  >
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                    {isListening ? 'Stop' : 'Voice'}
                  </button>
                )}

                {/* Location Suggest */}
                <button
                  type="button"
                  onClick={() => {
                    hapticFeedback.light();
                    handleLocationSuggest();
                  }}
                  disabled={isLoadingLocation}
                  className="flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium bg-secondary hover:bg-secondary/80 text-foreground disabled:opacity-50"
                >
                  <MapPin size={18} className={isLoadingLocation ? 'animate-bounce' : ''} />
                  {isLoadingLocation ? 'Finding...' : 'Location'}
                </button>
              </div>

              {/* Voice Transcript Display */}
              <AnimatePresence>
                {(isListening || interimTranscript) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-primary/10 border border-primary/30 rounded-xl p-3"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      <span className="text-primary font-medium">Listening...</span>
                    </div>
                    {interimTranscript && (
                      <p className="text-sm text-muted-foreground mt-1 italic">"{interimTranscript}"</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Smart Suggestion Banner */}
              <AnimatePresence>
                {smartSuggestion && (smartSuggestion.category || smartSuggestion.amount) && (
                  <motion.button
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    type="button"
                    onClick={applySmartSuggestion}
                    className="w-full bg-gradient-to-r from-teal-500/20 to-teal-400/20 border border-teal-500/30 rounded-xl p-3 flex items-center gap-3"
                  >
                    <Sparkles size={20} className="text-teal-500" />
                    <div className="text-left flex-1">
                      <p className="text-sm font-medium text-foreground">Smart Suggestion</p>
                      <p className="text-xs text-muted-foreground">
                        {smartSuggestion.category && `Category: ${categories.find(c => c.id === smartSuggestion.category)?.name}`}
                        {smartSuggestion.category && smartSuggestion.amount && ' • '}
                        {smartSuggestion.amount && `Amount: ${formatCurrencyAmount(smartSuggestion.amount, selectedCurrency)}`}
                      </p>
                    </div>
                    <span className="text-xs text-primary font-medium">Tap to apply</span>
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Location Suggestion */}
              {locationSuggestion && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-2 flex items-center gap-2">
                  <MapPin size={14} className="text-blue-500" />
                  <span className="text-xs text-blue-600">{locationSuggestion}</span>
                </div>
              )}

              {/* Date */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar size={16} />
                  Date
                </Label>
                <Input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>

              {/* Amount with Currency */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign size={16} />
                  Amount
                </Label>
                <div className="flex gap-2">
                  <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                    <SelectTrigger className="w-24 flex-shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {currencies.map(curr => (
                        <SelectItem key={curr.code} value={curr.code}>
                          <span className="flex items-center gap-1">
                            <span className="font-medium">{curr.symbol}</span>
                            <span className="text-muted-foreground text-xs">{curr.code}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="text-2xl font-bold h-14 flex-1"
                  />
                </div>

                {/* Frequent Amounts Quick Select */}
                {frequentAmounts.length > 0 && !amount && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    <span className="text-xs text-muted-foreground">Quick:</span>
                    {frequentAmounts.slice(0, 4).map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmount(amt.toString())}
                        className="px-2 py-1 text-xs bg-secondary hover:bg-secondary/80 rounded-md font-medium"
                      >
                        {formatCurrencyAmount(amt, selectedCurrency)}
                      </button>
                    ))}
                  </div>
                )}

                {selectedCurrency !== loadCurrencySettings().baseCurrency && amount && (
                  <p className="text-xs text-muted-foreground">
                    ≈ {formatCurrencyAmount(convertCurrency(parseFloat(amount) || 0, selectedCurrency, loadCurrencySettings().baseCurrency), loadCurrencySettings().baseCurrency)} in base currency
                  </p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Category</Label>
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                  {filteredCategories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all ${
                        categoryId === cat.id 
                          ? 'bg-primary text-primary-foreground scale-105 shadow-lg ring-2 ring-primary/50' 
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      <span className="text-xl">{cat.icon}</span>
                      <span className="text-[8px] leading-tight truncate w-full text-center font-medium">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Account */}
              {accounts.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Wallet size={16} />
                    Account
                  </Label>
                  <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>
                          <span className="flex items-center gap-2">
                            <span>{acc.icon}</span>
                            <span>{acc.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Note */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <StickyNote size={16} />
                  Note
                </Label>
                <Input
                  type="text"
                  placeholder="Quick note (optional)"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>

              {/* Description - Smart Suggest enabled */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText size={16} />
                  Description
                  <span className="text-xs text-primary ml-1">(Smart suggest)</span>
                </Label>
                <Textarea
                  placeholder="Type merchant name for smart suggestions..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Receipt Photo - Camera or Upload */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Camera size={16} />
                  Receipt Photo
                </Label>
                {/* Hidden file inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptUpload}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleReceiptUpload}
                  className="hidden"
                />
                
                {receiptPreview ? (
                  <div className="relative">
                    <img 
                      src={receiptPreview} 
                      alt="Receipt" 
                      className="w-full h-32 object-cover rounded-xl border border-border"
                    />
                    <button
                      type="button"
                      onClick={removeReceipt}
                      className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowImageOptions(!showImageOptions)}
                      className="w-full h-20 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary"
                    >
                      <ImageIcon size={20} />
                      <span className="text-xs">Tap to add receipt photo</span>
                    </button>
                    
                    {/* Image Options Popup */}
                    <AnimatePresence>
                      {showImageOptions && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-10"
                        >
                          <button
                            type="button"
                            onClick={handleCameraCapture}
                            className="w-full p-3 flex items-center gap-3 hover:bg-secondary transition-colors border-b border-border"
                          >
                            <Camera size={18} className="text-primary" />
                            <span className="text-sm font-medium">Take Photo</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              fileInputRef.current?.click();
                              setShowImageOptions(false);
                            }}
                            className="w-full p-3 flex items-center gap-3 hover:bg-secondary transition-colors"
                          >
                            <Upload size={18} className="text-primary" />
                            <span className="text-sm font-medium">Upload from Gallery</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Voice Memo Recording */}
              {recorderSupported && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mic size={16} />
                    Voice Memo
                  </Label>
                  
                  {voiceMemoUrl || memoAudioUrl ? (
                    <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-xl">
                      <audio src={voiceMemoUrl || memoAudioUrl || ''} controls className="flex-1 h-10" />
                      <button
                        type="button"
                        onClick={removeVoiceMemo}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : isRecordingMemo ? (
                    <div className="flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/30 rounded-xl">
                      <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
                      <span className="text-sm font-mono font-medium text-destructive flex-1">{memoDuration}</span>
                      
                      {isMemoPaused ? (
                        <button
                          type="button"
                          onClick={resumeMemoRecording}
                          className="p-2 bg-primary text-primary-foreground rounded-full"
                        >
                          <Play size={14} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={pauseMemoRecording}
                          className="p-2 bg-amber-500 text-white rounded-full"
                        >
                          <Pause size={14} />
                        </button>
                      )}
                      
                      <button
                        type="button"
                        onClick={stopMemoRecording}
                        className="p-2 bg-destructive text-destructive-foreground rounded-full"
                      >
                        <Square size={14} />
                      </button>
                      
                      <button
                        type="button"
                        onClick={discardMemoRecording}
                        className="p-2 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={startMemoRecording}
                      className="w-full h-14 border-2 border-dashed border-border rounded-xl flex items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      <Circle size={18} className="text-destructive" />
                      <span className="text-sm">Tap to record voice memo</span>
                    </button>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className={`w-full h-12 text-lg font-semibold ${
                  transactionType === 'income' 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : ''
                }`}
              >
                Save {transactionType === 'expense' ? 'Expense' : 'Income'}
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Batch Entry Modal */}
      <BatchEntryModal 
        isOpen={showBatchModal} 
        onClose={() => setShowBatchModal(false)} 
      />

      {/* Pro Paywall */}
      <ProPaywall
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        featureName={`You've reached the free limit of ${transactionType === 'expense' ? `${FREE_LIMITS.maxExpenses} expenses` : `${FREE_LIMITS.maxIncomes} incomes`}. Upgrade to Pro for unlimited transactions!`}
      />
    </>
  );
};
