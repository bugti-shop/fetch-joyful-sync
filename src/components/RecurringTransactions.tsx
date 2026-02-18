import { useState } from 'react';
import { Clock, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface RecurringTransaction {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  amount: number;
  nextDate: string;
  time?: string;
  weekday?: number;
  monthDay?: number;
}

interface RecurringTransactionsProps {
  jarId: number;
  jarName: string;
  recurringTransaction?: RecurringTransaction;
  onSave: (jarId: number, transaction: RecurringTransaction) => void;
}

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const RecurringTransactions = ({ 
  jarId, 
  jarName, 
  recurringTransaction, 
  onSave 
}: RecurringTransactionsProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(recurringTransaction?.enabled || false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>(
    recurringTransaction?.frequency || 'daily'
  );
  const [amount, setAmount] = useState(recurringTransaction?.amount?.toString() || '');
  const [time, setTime] = useState(recurringTransaction?.time || '09:00');
  const [weekday, setWeekday] = useState(recurringTransaction?.weekday?.toString() || '1');
  const [monthDay, setMonthDay] = useState(recurringTransaction?.monthDay?.toString() || '1');

  const getNextDate = (freq: 'daily' | 'weekly' | 'monthly') => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    now.setHours(hours, minutes, 0, 0);
    
    switch (freq) {
      case 'daily':
        if (now <= new Date()) {
          now.setDate(now.getDate() + 1);
        }
        break;
      case 'weekly':
        const targetWeekday = parseInt(weekday);
        const daysUntilNext = (targetWeekday + 7 - now.getDay()) % 7 || 7;
        now.setDate(now.getDate() + daysUntilNext);
        break;
      case 'monthly':
        const targetDay = parseInt(monthDay);
        now.setMonth(now.getMonth() + 1);
        now.setDate(Math.min(targetDay, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()));
        break;
    }
    return now.toISOString();
  };

  const handleSave = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount for recurring transactions.",
        variant: "destructive",
      });
      return;
    }

    const transaction: RecurringTransaction = {
      enabled,
      frequency,
      amount: parseFloat(amount),
      nextDate: getNextDate(frequency),
      time,
      weekday: frequency === 'weekly' ? parseInt(weekday) : undefined,
      monthDay: frequency === 'monthly' ? parseInt(monthDay) : undefined,
    };

    onSave(jarId, transaction);
    setOpen(false);
    
    const scheduleText = 
      frequency === 'daily' ? `daily at ${time}` :
      frequency === 'weekly' ? `every ${weekdays[parseInt(weekday)]} at ${time}` :
      `monthly on day ${monthDay} at ${time}`;
    
    toast({
      title: "Recurring Transaction Saved",
      description: `${enabled ? 'Enabled' : 'Disabled'} ${scheduleText} contribution of $${amount} for ${jarName}`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Clock size={16} className="mr-2" />
          Recurring Transactions
          {recurringTransaction?.enabled && (
            <Bell size={14} className="ml-2 text-primary" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Recurring Transactions</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="enabled">Enable Recurring Contributions</Label>
            <Switch
              id="enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          {enabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                  <SelectTrigger id="frequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Daily: Show time */}
              {frequency === 'daily' && (
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              )}

              {/* Weekly: Show weekday and time */}
              {frequency === 'weekly' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="weekday">Day of Week</Label>
                    <Select value={weekday} onValueChange={setWeekday}>
                      <SelectTrigger id="weekday">
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        {weekdays.map((day, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Monthly: Show day of month and time */}
              {frequency === 'monthly' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="monthDay">Day of Month</Label>
                    <Select value={monthDay} onValueChange={setMonthDay}>
                      <SelectTrigger id="monthDay">
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <SelectItem key={day} value={day.toString()}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {frequency === 'daily' && `Daily at ${time}`}
                  {frequency === 'weekly' && `Every ${weekdays[parseInt(weekday)]} at ${time}`}
                  {frequency === 'monthly' && `Monthly on day ${monthDay} at ${time}`}
                  {' '}contribution of ${amount || '0.00'} will be added to <strong>{jarName}</strong>
                </p>
              </div>
            </>
          )}

          <Button onClick={handleSave} className="w-full">
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
