import { useState, useEffect, useCallback } from 'react';
import { Plus, Wallet, Trash2, Edit2, ArrowLeftRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TransferHistory } from './TransferHistory';

export interface Account {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'savings' | 'account';
  balance: number;
  icon: string;
  color: string;
}

const accountIcons = [
  { id: 'wallet', icon: '💵', label: 'Cash' },
  { id: 'card', icon: '💳', label: 'Card' },
  { id: 'piggy', icon: '🐷', label: 'Savings' },
  { id: 'bank', icon: '🏦', label: 'Bank' },
  { id: 'crypto', icon: '₿', label: 'Crypto' },
  { id: 'investment', icon: '📈', label: 'Investment' },
];

const STORAGE_KEY = 'jarify_accounts';

const formatCurrency = (amount: number): string => {
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
  return `$${amount.toFixed(2)}`;
};

export const AccountsManager = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [activeTab, setActiveTab] = useState('accounts');
  const [newAccount, setNewAccount] = useState({
    name: '',
    type: 'cash' as Account['type'],
    balance: '',
    icon: '💵',
  });

  const loadAccounts = useCallback(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setAccounts(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    loadAccounts();
    const interval = setInterval(loadAccounts, 2000);
    return () => clearInterval(interval);
  }, [loadAccounts]);

  useEffect(() => {
    if (accounts.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    }
  }, [accounts]);

  const totalAssets = accounts
    .filter(a => a.balance > 0)
    .reduce((sum, a) => sum + a.balance, 0);

  const totalLiabilities = accounts
    .filter(a => a.balance < 0)
    .reduce((sum, a) => sum + Math.abs(a.balance), 0);

  const netTotal = totalAssets - totalLiabilities;

  const addAccount = () => {
    if (!newAccount.name.trim()) return;
    
    const account: Account = {
      id: `acc_${Date.now()}`,
      name: newAccount.name,
      type: newAccount.type,
      balance: parseFloat(newAccount.balance) || 0,
      icon: newAccount.icon,
      color: 'hsl(210, 85%, 55%)',
    };
    
    setAccounts(prev => [...prev, account]);
    setNewAccount({ name: '', type: 'cash', balance: '', icon: '💵' });
    setShowAddModal(false);
  };

  const updateAccount = () => {
    if (!editingAccount) return;
    setAccounts(prev => prev.map(acc => 
      acc.id === editingAccount.id ? editingAccount : acc
    ));
    setEditingAccount(null);
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(acc => acc.id !== id));
  };

  return (
    <div className="space-y-4 pb-24">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <Wallet size={16} />
            Accounts
          </TabsTrigger>
          <TabsTrigger value="transfers" className="flex items-center gap-2">
            <ArrowLeftRight size={16} />
            Transfers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4 mt-4">
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Assets</p>
                <p className="text-lg font-bold text-green-500">
                  {formatCurrency(totalAssets)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Liabilities</p>
                <p className="text-lg font-bold text-destructive">
                  {formatCurrency(totalLiabilities)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Net Worth</p>
                <p className={`text-lg font-bold ${netTotal >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                  {formatCurrency(netTotal)}
                </p>
              </div>
            </div>
          </div>

          <Button onClick={() => setShowAddModal(true)} className="w-full" variant="outline">
            <Plus size={18} className="mr-2" />
            Add Account
          </Button>

          <div className="space-y-3">
            {accounts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Wallet size={48} className="mx-auto mb-4 opacity-50" />
                <p>No accounts yet</p>
                <p className="text-sm">Add your first account to track balances</p>
              </div>
            ) : (
              accounts.map((account) => (
                <div
                  key={account.id}
                  className="bg-card border border-border rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{account.icon}</span>
                      <div>
                        <p className="font-medium text-foreground">{account.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{account.type}</p>
                      </div>
                    </div>
                    <p className={`font-bold text-lg ${account.balance >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                      {account.balance >= 0 ? '+' : '-'}{formatCurrency(Math.abs(account.balance))}
                    </p>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-border">
                    <button
                      onClick={() => setEditingAccount(account)}
                      className="p-2 hover:bg-secondary rounded-lg text-xs flex items-center gap-1 text-muted-foreground"
                    >
                      <Edit2 size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => deleteAccount(account.id)}
                      className="p-2 hover:bg-destructive/10 rounded-lg text-xs flex items-center gap-1 text-destructive"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="transfers" className="mt-4">
          <TransferHistory />
        </TabsContent>
      </Tabs>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Account Name</Label>
              <Input
                value={newAccount.name}
                onChange={(e) => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Cash, Bank Account"
              />
            </div>
            <div>
              <Label>Initial Balance</Label>
              <Input
                type="number"
                value={newAccount.balance}
                onChange={(e) => setNewAccount(prev => ({ ...prev, balance: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Icon</Label>
              <div className="grid grid-cols-6 gap-2 mt-2">
                {accountIcons.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setNewAccount(prev => ({ ...prev, icon: item.icon }))}
                    className={`p-3 rounded-lg text-2xl ${
                      newAccount.icon === item.icon
                        ? 'bg-primary/20 ring-2 ring-primary'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    {item.icon}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={addAccount} className="w-full">
              Add Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingAccount} onOpenChange={() => setEditingAccount(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
          </DialogHeader>
          {editingAccount && (
            <div className="space-y-4">
              <div>
                <Label>Account Name</Label>
                <Input
                  value={editingAccount.name}
                  onChange={(e) => setEditingAccount(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              <div>
                <Label>Balance</Label>
                <Input
                  type="number"
                  value={editingAccount.balance}
                  onChange={(e) => setEditingAccount(prev => prev ? { ...prev, balance: parseFloat(e.target.value) || 0 } : null)}
                />
              </div>
              <div>
                <Label>Icon</Label>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {accountIcons.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setEditingAccount(prev => prev ? { ...prev, icon: item.icon } : null)}
                      className={`p-3 rounded-lg text-2xl ${
                        editingAccount.icon === item.icon
                          ? 'bg-primary/20 ring-2 ring-primary'
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      {item.icon}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={updateAccount} className="w-full">
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};