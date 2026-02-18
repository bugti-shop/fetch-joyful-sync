import { useState } from 'react';
import { X, Plus, Users, DollarSign, Check, Divide, UserPlus } from 'lucide-react';
import { useFamily, FamilyMember } from '@/contexts/FamilyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { loadCurrencySettings, formatCurrencyAmount } from '@/lib/currency';
import { motion, AnimatePresence } from 'framer-motion';

interface SplitExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SplitParticipant {
  memberId: string;
  amount: number;
  included: boolean;
}

export const SplitExpenseModal = ({ isOpen, onClose }: SplitExpenseModalProps) => {
  const { members, addSplitExpense, addMember } = useFamily();
  const { toast } = useToast();
  
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidBy, setPaidBy] = useState<string>('me');
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [participants, setParticipants] = useState<SplitParticipant[]>([
    { memberId: 'me', amount: 0, included: true },
  ]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  
  const baseCurrency = loadCurrencySettings().baseCurrency;

  // Initialize participants when members change
  const initParticipants = () => {
    const initial: SplitParticipant[] = [
      { memberId: 'me', amount: 0, included: true },
      ...members.map(m => ({ memberId: m.id, amount: 0, included: true })),
    ];
    setParticipants(initial);
  };

  const handleAddQuickMember = () => {
    if (!newMemberName.trim()) return;
    
    addMember({
      name: newMemberName,
      avatar: '👤',
      role: 'other',
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    });
    
    setNewMemberName('');
    setShowAddMember(false);
    toast({ title: 'Member added ✓' });
  };

  const toggleParticipant = (memberId: string) => {
    setParticipants(prev => {
      const updated = prev.map(p => 
        p.memberId === memberId ? { ...p, included: !p.included } : p
      );
      
      // Recalculate amounts if equal split
      if (splitType === 'equal') {
        return recalculateEqualSplit(updated);
      }
      return updated;
    });
  };

  const recalculateEqualSplit = (parts: SplitParticipant[]) => {
    const total = parseFloat(totalAmount) || 0;
    const includedCount = parts.filter(p => p.included).length;
    const perPerson = includedCount > 0 ? total / includedCount : 0;
    
    return parts.map(p => ({
      ...p,
      amount: p.included ? Math.round(perPerson * 100) / 100 : 0,
    }));
  };

  const handleTotalChange = (value: string) => {
    setTotalAmount(value);
    if (splitType === 'equal') {
      const total = parseFloat(value) || 0;
      const includedCount = participants.filter(p => p.included).length;
      const perPerson = includedCount > 0 ? total / includedCount : 0;
      
      setParticipants(prev => prev.map(p => ({
        ...p,
        amount: p.included ? Math.round(perPerson * 100) / 100 : 0,
      })));
    }
  };

  const handleCustomAmount = (memberId: string, amount: string) => {
    setParticipants(prev => prev.map(p => 
      p.memberId === memberId ? { ...p, amount: parseFloat(amount) || 0 } : p
    ));
  };

  const getMemberName = (memberId: string) => {
    if (memberId === 'me') return 'Me';
    return members.find(m => m.id === memberId)?.name || 'Unknown';
  };

  const getMemberAvatar = (memberId: string) => {
    if (memberId === 'me') return '👤';
    return members.find(m => m.id === memberId)?.avatar || '👤';
  };

  const handleSubmit = () => {
    if (!description.trim()) {
      toast({ title: 'Add description', variant: 'destructive' });
      return;
    }
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      toast({ title: 'Enter valid amount', variant: 'destructive' });
      return;
    }

    const includedParticipants = participants.filter(p => p.included && p.memberId !== paidBy);
    
    if (includedParticipants.length === 0) {
      toast({ title: 'Add at least one other person to split with', variant: 'destructive' });
      return;
    }

    addSplitExpense({
      description,
      totalAmount: parseFloat(totalAmount),
      date: new Date().toISOString().split('T')[0],
      paidBy,
      splits: includedParticipants.map(p => ({
        memberId: p.memberId,
        amount: p.amount,
        settled: false,
      })),
    });

    toast({ title: 'Split expense added ✓' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={e => e.stopPropagation()}
        className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary">
            <X size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Divide size={20} className="text-primary" />
            <h2 className="text-xl font-bold">Split Expense</h2>
          </div>
          <div className="w-9" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Description */}
          <div className="space-y-2">
            <Label>What's this for?</Label>
            <Input
              placeholder="Dinner, groceries, rent..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Total Amount */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign size={16} />
              Total Amount
            </Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={totalAmount}
              onChange={e => handleTotalChange(e.target.value)}
              className="text-2xl font-bold h-14"
            />
          </div>

          {/* Paid By */}
          <div className="space-y-2">
            <Label>Paid by</Label>
            <Select value={paidBy} onValueChange={setPaidBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="me">
                  <span className="flex items-center gap-2">
                    <span>👤</span>
                    <span>Me</span>
                  </span>
                </SelectItem>
                {members.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    <span className="flex items-center gap-2">
                      <span>{m.avatar}</span>
                      <span>{m.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Split Type */}
          <div className="space-y-2">
            <Label>Split type</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSplitType('equal');
                  setParticipants(recalculateEqualSplit(participants));
                }}
                className={`flex-1 py-2 rounded-xl font-medium transition-all ${
                  splitType === 'equal' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-foreground'
                }`}
              >
                Equal
              </button>
              <button
                type="button"
                onClick={() => setSplitType('custom')}
                className={`flex-1 py-2 rounded-xl font-medium transition-all ${
                  splitType === 'custom' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-foreground'
                }`}
              >
                Custom
              </button>
            </div>
          </div>

          {/* Participants */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users size={16} />
              Split with
            </Label>
            
            <div className="space-y-2">
              {/* Me */}
              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                <button
                  type="button"
                  onClick={() => toggleParticipant('me')}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    participants.find(p => p.memberId === 'me')?.included
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-muted-foreground'
                  }`}
                >
                  {participants.find(p => p.memberId === 'me')?.included && <Check size={14} />}
                </button>
                <span className="text-xl">👤</span>
                <span className="flex-1 font-medium">Me</span>
                {splitType === 'custom' ? (
                  <Input
                    type="number"
                    step="0.01"
                    value={participants.find(p => p.memberId === 'me')?.amount || ''}
                    onChange={e => handleCustomAmount('me', e.target.value)}
                    className="w-24 text-right"
                    disabled={!participants.find(p => p.memberId === 'me')?.included}
                  />
                ) : (
                  <span className="text-muted-foreground">
                    {formatCurrencyAmount(participants.find(p => p.memberId === 'me')?.amount || 0, baseCurrency)}
                  </span>
                )}
              </div>

              {/* Other members */}
              {members.map(member => {
                const participant = participants.find(p => p.memberId === member.id);
                return (
                  <div key={member.id} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                    <button
                      type="button"
                      onClick={() => toggleParticipant(member.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        participant?.included
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-muted-foreground'
                      }`}
                    >
                      {participant?.included && <Check size={14} />}
                    </button>
                    <span className="text-xl">{member.avatar}</span>
                    <span className="flex-1 font-medium">{member.name}</span>
                    {splitType === 'custom' ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={participant?.amount || ''}
                        onChange={e => handleCustomAmount(member.id, e.target.value)}
                        className="w-24 text-right"
                        disabled={!participant?.included}
                      />
                    ) : (
                      <span className="text-muted-foreground">
                        {formatCurrencyAmount(participant?.amount || 0, baseCurrency)}
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Add new member */}
              <AnimatePresence>
                {showAddMember ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex gap-2"
                  >
                    <Input
                      placeholder="Name"
                      value={newMemberName}
                      onChange={e => setNewMemberName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddQuickMember()}
                      autoFocus
                    />
                    <Button onClick={handleAddQuickMember} size="sm">Add</Button>
                    <Button onClick={() => setShowAddMember(false)} size="sm" variant="ghost">
                      <X size={16} />
                    </Button>
                  </motion.div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddMember(true)}
                    className="w-full py-3 border-2 border-dashed border-primary/30 rounded-xl flex items-center justify-center gap-2 text-primary hover:bg-primary/5"
                  >
                    <UserPlus size={18} />
                    <span>Add person</span>
                  </button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button onClick={handleSubmit} className="w-full h-12 text-lg font-semibold">
            <Divide size={20} className="mr-2" />
            Split {totalAmount ? formatCurrencyAmount(parseFloat(totalAmount), baseCurrency) : ''}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
