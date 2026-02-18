import { useState, useEffect, useRef } from 'react';
import { X, ArrowUpDown, Camera, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { hapticFeedback } from '@/lib/haptics';
import { format } from 'date-fns';

interface Account {
  id: string;
  name: string;
  icon: string;
  balance?: number;
}

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ACCOUNTS_STORAGE_KEY = 'jarify_accounts';
const TRANSFERS_STORAGE_KEY = 'jarify_transfers';

interface Transfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  fees: number;
  note: string;
  description: string;
  date: string;
  createdAt: string;
  receiptImage?: string;
}

export const TransferModal = ({ isOpen, onClose }: TransferModalProps) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fromAccountId, setFromAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [fees, setFees] = useState<string>('');
  const [showFees, setShowFees] = useState(false);
  const [note, setNote] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const savedAccounts = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (savedAccounts) {
      setAccounts(JSON.parse(savedAccounts));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setFromAccountId('');
      setToAccountId('');
      setAmount('');
      setFees('');
      setShowFees(false);
      setNote('');
      setDescription('');
      setDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      setReceiptImage('');
      setIsRecurring(false);
    }
  }, [isOpen]);

  const swapAccounts = () => {
    hapticFeedback.light();
    const temp = fromAccountId;
    setFromAccountId(toAccountId);
    setToAccountId(temp);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        toast({
          title: "Image too large",
          description: "Please select an image under 500KB",
          variant: "destructive"
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setReceiptImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!fromAccountId || !toAccountId) {
      toast({
        title: "Select accounts",
        description: "Please select both From and To accounts",
        variant: "destructive"
      });
      return;
    }

    if (fromAccountId === toAccountId) {
      toast({
        title: "Invalid transfer",
        description: "From and To accounts must be different",
        variant: "destructive"
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    const feesNum = showFees && fees ? parseFloat(fees) : 0;

    const transfer: Transfer = {
      id: Date.now().toString(),
      fromAccountId,
      toAccountId,
      amount: amountNum,
      fees: feesNum,
      note,
      description,
      date,
      createdAt: new Date().toISOString(),
      receiptImage: receiptImage || undefined
    };

    const savedTransfers = localStorage.getItem(TRANSFERS_STORAGE_KEY);
    const transfers = savedTransfers ? JSON.parse(savedTransfers) : [];
    transfers.push(transfer);
    localStorage.setItem(TRANSFERS_STORAGE_KEY, JSON.stringify(transfers));

    const totalDeduction = amountNum + feesNum;
    const updatedAccounts = accounts.map(acc => {
      if (acc.id === fromAccountId) {
        return { ...acc, balance: (acc.balance || 0) - totalDeduction };
      }
      if (acc.id === toAccountId) {
        return { ...acc, balance: (acc.balance || 0) + amountNum };
      }
      return acc;
    });
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updatedAccounts));
    setAccounts(updatedAccounts);

    hapticFeedback.success();
    toast({
      title: "Transfer successful",
      description: `Transferred ${amountNum.toLocaleString()}${feesNum > 0 ? ` (+ ${feesNum} fees)` : ''}`
    });
    onClose();
  };

  const fromAccount = accounts.find(a => a.id === fromAccountId);
  const toAccount = accounts.find(a => a.id === toAccountId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-background rounded-t-3xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-background z-10 px-4 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold">Transfer Money</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {accounts.length < 2 ? (
          <div className="p-6 text-center">
            <p className="text-muted-foreground mb-2">You need at least 2 accounts to transfer money.</p>
            <p className="text-sm text-muted-foreground">Add accounts in the Accounts tab.</p>
          </div>
        ) : (
          <>
            {/* Form Content */}
            <div className="p-4 space-y-1">
              {/* Date Row */}
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <span className="text-muted-foreground text-base">Date</span>
                <div className="flex items-center gap-3">
                  <input
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-transparent text-foreground font-medium text-right border-none outline-none"
                  />
                  <button 
                    onClick={() => setIsRecurring(!isRecurring)}
                    className={`p-2 rounded-lg transition-colors ${isRecurring ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                    title="Repeat/Installment"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>
              </div>

              {/* Amount Row */}
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <span className="text-muted-foreground text-base">Amount</span>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="bg-transparent text-foreground font-medium text-right border-none outline-none w-32 text-lg"
                  />
                  <button 
                    onClick={() => setShowFees(!showFees)}
                    className={`px-3 py-1.5 rounded-lg border transition-colors text-sm font-medium ${showFees ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                  >
                    Fees
                  </button>
                </div>
              </div>

              {/* Fees Row (conditional) */}
              {showFees && (
                <div className="flex items-center justify-between py-3 border-b border-border/50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <span className="text-muted-foreground text-base">Transfer Fees</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={fees}
                    onChange={(e) => setFees(e.target.value)}
                    placeholder="0"
                    className="bg-transparent text-foreground font-medium text-right border-none outline-none w-32"
                  />
                </div>
              )}

              {/* From Account Row */}
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <span className="text-muted-foreground text-base">From</span>
                <div className="flex items-center gap-3 flex-1 justify-end">
                  <select
                    value={fromAccountId}
                    onChange={(e) => {
                      setFromAccountId(e.target.value);
                      if (toAccountId === e.target.value) setToAccountId('');
                    }}
                    className="bg-transparent text-foreground font-medium text-right border-none outline-none appearance-none cursor-pointer min-w-[120px]"
                  >
                    <option value="">Select account</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.icon} {acc.name}
                      </option>
                    ))}
                  </select>
                  <button 
                    onClick={swapAccounts}
                    className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                    title="Swap accounts"
                  >
                    <ArrowUpDown size={18} />
                  </button>
                </div>
              </div>

              {/* To Account Row */}
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <span className="text-muted-foreground text-base">To</span>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="bg-transparent text-foreground font-medium text-right border-none outline-none appearance-none cursor-pointer min-w-[120px]"
                >
                  <option value="">Select account</option>
                  {accounts.filter(a => a.id !== fromAccountId).map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.icon} {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Note Row */}
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <span className="text-muted-foreground text-base">Note</span>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note"
                  className="bg-transparent text-foreground font-medium text-right border-none outline-none flex-1 ml-4"
                />
              </div>

              {/* Separator */}
              <div className="h-3 bg-muted/50 -mx-4" />

              {/* Description Row */}
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <span className="text-muted-foreground text-base">Description</span>
                <div className="flex items-center gap-3 flex-1 justify-end">
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add description"
                    className="bg-transparent text-foreground font-medium text-right border-none outline-none flex-1"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-2 rounded-lg transition-colors ${receiptImage ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                  >
                    <Camera size={20} />
                  </button>
                </div>
              </div>

              {/* Receipt Preview */}
              {receiptImage && (
                <div className="py-2">
                  <div className="relative inline-block">
                    <img 
                      src={receiptImage} 
                      alt="Receipt" 
                      className="h-20 w-20 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => setReceiptImage('')}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-background border-t border-border p-4">
              <button
                onClick={handleSubmit}
                className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform"
              >
                Transfer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
