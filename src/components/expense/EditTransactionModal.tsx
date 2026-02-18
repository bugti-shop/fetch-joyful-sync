import { useState, useEffect, useRef } from 'react';
import { X, Calendar, DollarSign, FileText, StickyNote, Wallet, Camera, Image as ImageIcon } from 'lucide-react';
import { useExpense } from '@/contexts/ExpenseContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { hapticFeedback } from '@/lib/haptics';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { currencies, loadCurrencySettings, convertCurrency, formatCurrencyAmount } from '@/lib/currency';

interface Account {
  id: string;
  name: string;
  icon: string;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  date: string;
  categoryId?: string;
  accountId?: string;
  accountName?: string;
  receiptUrl?: string;
  currency?: string;
  originalAmount?: number;
}

interface EditTransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

const ACCOUNTS_STORAGE_KEY = 'jarify_accounts';

export const EditTransactionModal = ({ transaction, isOpen, onClose, onSave }: EditTransactionModalProps) => {
  const { categories, updateExpense, updateIncome } = useExpense();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  // Form fields
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [note, setNote] = useState('');
  const [description, setDescription] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load accounts
  useEffect(() => {
    const saved = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (saved) {
      setAccounts(JSON.parse(saved));
    }
  }, [isOpen]);

  // Populate form when transaction changes
  useEffect(() => {
    if (isOpen && transaction) {
      setDate(transaction.date.split('T')[0]);
      setAmount(String(transaction.originalAmount || transaction.amount));
      setCategoryId(transaction.categoryId || '');
      // Find matching account or set to 'none'
      const matchingAccount = accounts.find(a => a.id === transaction.accountId);
      setAccountId(matchingAccount ? transaction.accountId! : 'none');
      setDescription(transaction.description || '');
      setNote('');
      setReceiptUrl(transaction.receiptUrl || '');
      setReceiptPreview(transaction.receiptUrl || null);
      setSelectedCurrency(transaction.currency || loadCurrencySettings().baseCurrency);
    }
  }, [isOpen, transaction, accounts]);

  // Handle receipt image upload
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
      };
      reader.readAsDataURL(file);
    }
  };

  const removeReceipt = () => {
    setReceiptUrl('');
    setReceiptPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Filter categories based on transaction type
  const expenseCategories = categories.filter(c => c.budget > 0);
  const incomeCategories = categories.filter(c => c.budget === 0);
  const filteredCategories = transaction?.type === 'expense' ? expenseCategories : incomeCategories;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transaction) return;

    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: 'Invalid amount', description: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }

    if (!categoryId) {
      toast({ title: 'Select category', description: 'Please select a category', variant: 'destructive' });
      return;
    }

    const settings = loadCurrencySettings();
    const originalAmount = parseFloat(amount);
    const convertedAmount = convertCurrency(originalAmount, selectedCurrency, settings.baseCurrency);

    const updates = {
      categoryId,
      amount: convertedAmount,
      originalAmount: originalAmount,
      currency: selectedCurrency,
      description: description || note || (transaction.type === 'expense' ? 'Expense' : 'Income'),
      date: date + 'T00:00:00',
      accountId: accountId && accountId !== 'none' ? accountId : undefined,
      receiptUrl: receiptUrl || undefined,
    };

    if (transaction.type === 'expense') {
      updateExpense(transaction.id, updates);
      hapticFeedback.success();
      hapticFeedback.success();
      toast({ 
        title: 'Expense updated', 
        description: `${formatCurrencyAmount(originalAmount, selectedCurrency)} expense saved` 
      });
    } else if (transaction.type === 'income') {
      updateIncome(transaction.id, updates);
      hapticFeedback.success();
      toast({ 
        title: 'Income updated', 
        description: `${formatCurrencyAmount(originalAmount, selectedCurrency)} income saved` 
      });
    }

    if (onSave) onSave();
    onClose();
  };

  if (!isOpen || !transaction) return null;

  return (
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
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary">
            <X size={20} className="text-muted-foreground" />
          </button>
          <h2 className="text-xl font-bold text-foreground">
            Edit {transaction.type === 'expense' ? 'Expense' : 'Income'}
          </h2>
          <div className="w-9" />
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
                  onClick={() => {
                    hapticFeedback.light();
                    setCategoryId(cat.id);
                  }}
                  className={`p-2 rounded-xl flex flex-col items-center gap-1 ${
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
              <Select value={accountId || 'none'} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">No account</span>
                  </SelectItem>
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

          {/* Description */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText size={16} />
              Description
            </Label>
            <Textarea
              placeholder="Additional details (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Receipt Photo */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Camera size={16} />
              Receipt Photo
            </Label>
            <input
              ref={fileInputRef}
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
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-20 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary"
              >
                <ImageIcon size={20} />
                <span className="text-xs">Tap to add receipt photo</span>
              </button>
            )}
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className={`w-full h-12 text-lg font-semibold ${
              transaction.type === 'income' 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : ''
            }`}
          >
            Save Changes
          </Button>
        </form>
      </div>
    </div>
  );
};
