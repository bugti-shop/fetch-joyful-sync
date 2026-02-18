import { useState, useEffect } from 'react';
import { X, Plus, Trash2, DollarSign, Calendar, Users, Gift, Wallet, Edit2, Check } from 'lucide-react';
import { useFamily, FamilyMember, defaultAvatars, memberColors } from '@/contexts/FamilyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { loadCurrencySettings, formatCurrencyAmount } from '@/lib/currency';
import { motion, AnimatePresence } from 'framer-motion';

interface FamilyManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FamilyManager = ({ isOpen, onClose }: FamilyManagerProps) => {
  const { members, addMember, updateMember, deleteMember, payAllowance, deductAllowance } = useFamily();
  const { toast } = useToast();
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [showDeduct, setShowDeduct] = useState<string | null>(null);
  const [deductAmount, setDeductAmount] = useState('');
  
  // Form state
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('👤');
  const [role, setRole] = useState<'parent' | 'child' | 'partner' | 'other'>('other');
  const [color, setColor] = useState(memberColors[0]);
  const [hasAllowance, setHasAllowance] = useState(false);
  const [allowanceAmount, setAllowanceAmount] = useState('');
  const [allowanceFrequency, setAllowanceFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  
  const baseCurrency = loadCurrencySettings().baseCurrency;

  const resetForm = () => {
    setName('');
    setAvatar('👤');
    setRole('other');
    setColor(memberColors[Math.floor(Math.random() * memberColors.length)]);
    setHasAllowance(false);
    setAllowanceAmount('');
    setAllowanceFrequency('weekly');
  };

  const handleAddMember = () => {
    if (!name.trim()) {
      toast({ title: 'Enter name', variant: 'destructive' });
      return;
    }

    addMember({
      name,
      avatar,
      role,
      color,
      allowance: hasAllowance && allowanceAmount ? {
        amount: parseFloat(allowanceAmount),
        frequency: allowanceFrequency,
        lastPaid: '',
        balance: 0,
      } : undefined,
    });

    toast({ title: 'Member added ✓' });
    resetForm();
    setView('list');
  };

  const handleUpdateMember = () => {
    if (!selectedMember || !name.trim()) return;

    updateMember(selectedMember.id, {
      name,
      avatar,
      role,
      color,
      allowance: hasAllowance && allowanceAmount ? {
        amount: parseFloat(allowanceAmount),
        frequency: allowanceFrequency,
        lastPaid: selectedMember.allowance?.lastPaid || '',
        balance: selectedMember.allowance?.balance || 0,
      } : undefined,
    });

    toast({ title: 'Member updated ✓' });
    setView('list');
    setSelectedMember(null);
  };

  const handleEditClick = (member: FamilyMember) => {
    setSelectedMember(member);
    setName(member.name);
    setAvatar(member.avatar);
    setRole(member.role);
    setColor(member.color);
    setHasAllowance(!!member.allowance);
    setAllowanceAmount(member.allowance?.amount?.toString() || '');
    setAllowanceFrequency(member.allowance?.frequency || 'weekly');
    setView('edit');
  };

  const handlePayAllowance = (memberId: string) => {
    payAllowance(memberId);
    toast({ title: 'Allowance paid ✓' });
  };

  const handleDeduct = (memberId: string) => {
    if (!deductAmount || parseFloat(deductAmount) <= 0) return;
    deductAllowance(memberId, parseFloat(deductAmount), 'Spending');
    toast({ title: 'Amount deducted ✓' });
    setShowDeduct(null);
    setDeductAmount('');
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
          <button 
            onClick={() => view === 'list' ? onClose() : (setView('list'), resetForm())} 
            className="p-2 rounded-full hover:bg-secondary"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Users size={20} className="text-primary" />
            <h2 className="text-xl font-bold">
              {view === 'list' ? 'Family & Allowances' : view === 'add' ? 'Add Member' : 'Edit Member'}
            </h2>
          </div>
          <div className="w-9" />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* List View */}
          {view === 'list' && (
            <div className="space-y-4">
              {members.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users size={48} className="mx-auto mb-3 opacity-50" />
                  <p>No family members yet</p>
                  <p className="text-sm">Add members to track allowances and split expenses</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map(member => (
                    <Card key={member.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                          style={{ backgroundColor: `${member.color}20` }}
                        >
                          {member.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold truncate">{member.name}</h3>
                            <span className="text-xs px-2 py-0.5 bg-secondary rounded-full capitalize">
                              {member.role}
                            </span>
                          </div>
                          
                          {member.allowance && (
                            <div className="mt-2 space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Balance:</span>
                                <span className="font-bold text-green-500">
                                  {formatCurrencyAmount(member.allowance.balance, baseCurrency)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                  {formatCurrencyAmount(member.allowance.amount, baseCurrency)} / {member.allowance.frequency}
                                </span>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePayAllowance(member.id)}
                                  className="flex-1 h-8 text-xs"
                                >
                                  <Gift size={14} className="mr-1" />
                                  Pay Allowance
                                </Button>
                                
                                {showDeduct === member.id ? (
                                  <div className="flex gap-1 flex-1">
                                    <Input
                                      type="number"
                                      placeholder="Amount"
                                      value={deductAmount}
                                      onChange={e => setDeductAmount(e.target.value)}
                                      className="h-8 text-xs w-20"
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => handleDeduct(member.id)}
                                      className="h-8 px-2"
                                    >
                                      <Check size={14} />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setShowDeduct(member.id)}
                                    className="h-8 text-xs"
                                  >
                                    <Wallet size={14} className="mr-1" />
                                    Spend
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditClick(member)}
                            className="p-2 hover:bg-secondary rounded-full"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              deleteMember(member.id);
                              toast({ title: 'Member removed' });
                            }}
                            className="p-2 hover:bg-destructive/10 text-destructive rounded-full"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              <Button
                onClick={() => {
                  resetForm();
                  setView('add');
                }}
                className="w-full"
              >
                <Plus size={20} className="mr-2" />
                Add Family Member
              </Button>
            </div>
          )}

          {/* Add/Edit Form */}
          {(view === 'add' || view === 'edit') && (
            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="Enter name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              {/* Avatar */}
              <div className="space-y-2">
                <Label>Avatar</Label>
                <div className="flex gap-2 flex-wrap">
                  {defaultAvatars.map(av => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setAvatar(av)}
                      className={`w-10 h-10 rounded-full text-xl flex items-center justify-center transition-all ${
                        avatar === av 
                          ? 'bg-primary text-primary-foreground scale-110' 
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={(v: any) => setRole(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="child">Child</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Color */}
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {memberColors.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition-all ${
                        color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Allowance Toggle */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setHasAllowance(!hasAllowance)}
                  className={`w-full p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                    hasAllowance 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Gift size={20} className={hasAllowance ? 'text-primary' : 'text-muted-foreground'} />
                  <div className="text-left flex-1">
                    <p className="font-medium">Track Allowance</p>
                    <p className="text-xs text-muted-foreground">Set up recurring allowance payments</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    hasAllowance ? 'bg-primary border-primary' : 'border-muted-foreground'
                  }`}>
                    {hasAllowance && <Check size={16} className="text-primary-foreground" />}
                  </div>
                </button>
              </div>

              {/* Allowance Settings */}
              <AnimatePresence>
                {hasAllowance && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <DollarSign size={16} />
                        Allowance Amount
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={allowanceAmount}
                        onChange={e => setAllowanceAmount(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar size={16} />
                        Frequency
                      </Label>
                      <Select value={allowanceFrequency} onValueChange={(v: any) => setAllowanceFrequency(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <Button
                onClick={view === 'add' ? handleAddMember : handleUpdateMember}
                className="w-full"
              >
                {view === 'add' ? 'Add Member' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
