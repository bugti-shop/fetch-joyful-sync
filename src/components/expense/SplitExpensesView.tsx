import { useState } from 'react';
import { useFamily } from '@/contexts/FamilyContext';
import { useExpense } from '@/contexts/ExpenseContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatCurrencyAmount, loadCurrencySettings } from '@/lib/currency';
import { ArrowUpRight, ArrowDownLeft, Check, Users, Divide, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { SplitExpenseModal } from './SplitExpenseModal';
import { FamilyManager } from './FamilyManager';

interface SplitExpensesViewProps {
  onClose?: () => void;
}

export const SplitExpensesView = ({ onClose }: SplitExpensesViewProps) => {
  const { members, splitExpenses, getOwedToMe, getIOwe, settleSplit, deleteSplitExpense } = useFamily();
  const { getWeeklyBudgetProgress, getTotalExpenses } = useExpense();
  
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showFamilyManager, setShowFamilyManager] = useState(false);
  
  const baseCurrency = loadCurrencySettings().baseCurrency;
  const owedToMe = getOwedToMe();
  const iOwe = getIOwe();
  const weeklyProgress = getWeeklyBudgetProgress();

  const getMemberName = (memberId: string) => {
    if (memberId === 'me') return 'Me';
    return members.find(m => m.id === memberId)?.name || 'Unknown';
  };

  const getMemberAvatar = (memberId: string) => {
    if (memberId === 'me') return '👤';
    return members.find(m => m.id === memberId)?.avatar || '👤';
  };

  const pendingSplits = splitExpenses.filter(s => 
    s.splits.some(split => !split.settled)
  );

  return (
    <div className="space-y-6 p-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 bg-green-500/10 border-green-500/30">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownLeft size={18} className="text-green-500" />
            <span className="text-sm text-muted-foreground">Owed to me</span>
          </div>
          <p className="text-2xl font-bold text-green-500">
            {formatCurrencyAmount(owedToMe, baseCurrency)}
          </p>
        </Card>

        <Card className="p-4 bg-destructive/10 border-destructive/30">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight size={18} className="text-destructive" />
            <span className="text-sm text-muted-foreground">I owe</span>
          </div>
          <p className="text-2xl font-bold text-destructive">
            {formatCurrencyAmount(iOwe, baseCurrency)}
          </p>
        </Card>
      </div>

      {/* Weekly Budget Progress */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <DollarSign size={18} className="text-primary" />
            <span className="font-semibold">Weekly Budget</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {Math.round(weeklyProgress.percentage)}% used
          </span>
        </div>
        <Progress 
          value={Math.min(weeklyProgress.percentage, 100)} 
          className="h-3 mb-2"
        />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {formatCurrencyAmount(weeklyProgress.spent, baseCurrency)} spent
          </span>
          <span className="font-medium">
            {formatCurrencyAmount(weeklyProgress.budget, baseCurrency)} budget
          </span>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button 
          onClick={() => setShowSplitModal(true)}
          className="flex-1"
        >
          <Divide size={18} className="mr-2" />
          Split Expense
        </Button>
        <Button 
          onClick={() => setShowFamilyManager(true)}
          variant="outline"
          className="flex-1"
        >
          <Users size={18} className="mr-2" />
          Family
        </Button>
      </div>

      {/* Pending Splits */}
      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Divide size={18} />
          Pending Splits
          {pendingSplits.length > 0 && (
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
              {pendingSplits.length}
            </span>
          )}
        </h3>

        {pendingSplits.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">
            <Divide size={32} className="mx-auto mb-2 opacity-50" />
            <p>No pending splits</p>
            <p className="text-sm">Split an expense with friends or family</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingSplits.map((split, index) => (
              <motion.div
                key={split.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{split.description}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(split.date).toLocaleDateString()} • Paid by {getMemberName(split.paidBy)}
                      </p>
                    </div>
                    <span className="font-bold">
                      {formatCurrencyAmount(split.totalAmount, baseCurrency)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {split.splits.map(s => (
                      <div 
                        key={s.memberId}
                        className={`flex items-center justify-between p-2 rounded-lg ${
                          s.settled ? 'bg-green-500/10' : 'bg-secondary/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getMemberAvatar(s.memberId)}</span>
                          <span className="font-medium">{getMemberName(s.memberId)}</span>
                          {s.settled && (
                            <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                              Settled
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={s.settled ? 'text-muted-foreground line-through' : 'font-medium'}>
                            {formatCurrencyAmount(s.amount, baseCurrency)}
                          </span>
                          {!s.settled && split.paidBy === 'me' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => settleSplit(split.id, s.memberId)}
                              className="h-7 px-2"
                            >
                              <Check size={14} />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Family Members with Allowances */}
      {members.filter(m => m.allowance).length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Users size={18} />
            Allowances
          </h3>
          
          <div className="grid gap-3">
            {members.filter(m => m.allowance).map(member => (
              <Card key={member.id} className="p-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${member.color}20` }}
                  >
                    {member.avatar}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{member.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrencyAmount(member.allowance!.amount, baseCurrency)} / {member.allowance!.frequency}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-500">
                      {formatCurrencyAmount(member.allowance!.balance, baseCurrency)}
                    </p>
                    <p className="text-xs text-muted-foreground">Balance</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <SplitExpenseModal
        isOpen={showSplitModal}
        onClose={() => setShowSplitModal(false)}
      />
      <FamilyManager
        isOpen={showFamilyManager}
        onClose={() => setShowFamilyManager(false)}
      />
    </div>
  );
};
