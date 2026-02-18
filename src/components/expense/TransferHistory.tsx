import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, Calendar, Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Account {
  id: string;
  name: string;
  icon: string;
}

interface Transfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  note: string;
  date: string;
  createdAt: string;
}

const ACCOUNTS_STORAGE_KEY = 'jarify_accounts';
const TRANSFERS_STORAGE_KEY = 'jarify_transfers';

const formatCurrency = (amount: number): string => {
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
  return `$${amount.toFixed(2)}`;
};

export const TransferHistory = () => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'week' | 'month' | 'year'>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const savedTransfers = localStorage.getItem(TRANSFERS_STORAGE_KEY);
    const savedAccounts = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    
    if (savedTransfers) {
      setTransfers(JSON.parse(savedTransfers));
    }
    if (savedAccounts) {
      setAccounts(JSON.parse(savedAccounts));
    }
  }, []);

  const getAccountById = (id: string) => accounts.find(a => a.id === id);

  const filteredTransfers = transfers.filter(transfer => {
    // Search filter
    if (searchQuery) {
      const fromAccount = getAccountById(transfer.fromAccountId);
      const toAccount = getAccountById(transfer.toAccountId);
      const searchLower = searchQuery.toLowerCase();
      
      if (
        !fromAccount?.name.toLowerCase().includes(searchLower) &&
        !toAccount?.name.toLowerCase().includes(searchLower) &&
        !transfer.note.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }

    // Account filter
    if (filterAccount !== 'all') {
      if (transfer.fromAccountId !== filterAccount && transfer.toAccountId !== filterAccount) {
        return false;
      }
    }

    // Date range filter
    if (dateRange !== 'all') {
      const transferDate = new Date(transfer.date);
      const now = new Date();
      
      if (dateRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (transferDate < weekAgo) return false;
      } else if (dateRange === 'month') {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        if (transferDate < monthAgo) return false;
      } else if (dateRange === 'year') {
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        if (transferDate < yearAgo) return false;
      }
    }

    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalTransferred = filteredTransfers.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Transfer History</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} className="mr-1" />
          Filters
        </Button>
      </div>

      {/* Summary */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Transfers</p>
            <p className="text-lg font-bold text-foreground">{filteredTransfers.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Amount Moved</p>
            <p className="text-lg font-bold text-foreground">{formatCurrency(totalTransferred)}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search transfers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Account</label>
                <Select value={filterAccount} onValueChange={setFilterAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="All accounts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Accounts</SelectItem>
                    {accounts.map(acc => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.icon} {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Date Range</label>
                <Select value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transfers List */}
      <div className="space-y-2">
        {filteredTransfers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ArrowLeftRight size={48} className="mx-auto mb-4 opacity-50" />
            <p>No transfers yet</p>
            <p className="text-sm">Your transfer history will appear here</p>
          </div>
        ) : (
          filteredTransfers.map((transfer) => {
            const fromAccount = getAccountById(transfer.fromAccountId);
            const toAccount = getAccountById(transfer.toAccountId);
            
            return (
              <motion.div
                key={transfer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="flex items-center gap-1">
                      <span>{fromAccount?.icon || '❓'}</span>
                      <span className="font-medium">{fromAccount?.name || 'Unknown'}</span>
                    </span>
                    <ArrowLeftRight size={14} className="text-muted-foreground" />
                    <span className="flex items-center gap-1">
                      <span>{toAccount?.icon || '❓'}</span>
                      <span className="font-medium">{toAccount?.name || 'Unknown'}</span>
                    </span>
                  </div>
                  <p className="font-bold text-foreground">{formatCurrency(transfer.amount)}</p>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(transfer.date).toLocaleDateString()}
                  </span>
                  {transfer.note && (
                    <span className="truncate max-w-[150px]">{transfer.note}</span>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
