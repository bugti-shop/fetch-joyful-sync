import { useState, useEffect } from 'react';
import { X, Bell, AlertTriangle, TrendingUp, Check } from 'lucide-react';
import { useExpense } from '@/contexts/ExpenseContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface BudgetNotificationsProps {
  onClose: () => void;
}

interface NotificationSettings {
  enabled: boolean;
  warningThreshold: number;
  criticalThreshold: number;
  showInApp: boolean;
}

const STORAGE_KEY = 'jarify_budget_notifications';

export const BudgetNotifications = ({ onClose }: BudgetNotificationsProps) => {
  const { categories, getCategoryTotal } = useExpense();
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    warningThreshold: 80,
    criticalThreshold: 100,
    showInApp: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  const saveSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    toast({ title: 'Settings saved', description: 'Your notification preferences have been updated.' });
  };

  const getAlerts = () => {
    return categories.map(category => {
      const spent = getCategoryTotal(category.id, 'monthly');
      const percentage = (spent / category.budget) * 100;
      let status: 'ok' | 'warning' | 'critical' = 'ok';
      if (percentage >= settings.criticalThreshold) status = 'critical';
      else if (percentage >= settings.warningThreshold) status = 'warning';
      return { category, spent, percentage, status };
    }).filter(alert => alert.status !== 'ok');
  };

  const alerts = getAlerts();

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="text-primary" size={24} />
            <h2 className="text-xl font-bold text-foreground">Budget Notifications</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications-enabled">Enable Notifications</Label>
            <Switch id="notifications-enabled" checked={settings.enabled} onCheckedChange={(enabled) => saveSettings({ ...settings, enabled })} />
          </div>

          <div className="space-y-2">
            <Label>Warning Alert at</Label>
            <div className="flex items-center gap-2">
              <Input type="number" value={settings.warningThreshold} onChange={(e) => setSettings(prev => ({ ...prev, warningThreshold: parseInt(e.target.value) || 80 }))} className="w-20" />
              <span className="text-muted-foreground">% of budget</span>
            </div>
            <p className="text-xs text-muted-foreground">Show a warning when spending reaches this percentage</p>
          </div>

          <div className="space-y-2">
            <Label>Critical Alert at</Label>
            <div className="flex items-center gap-2">
              <Input type="number" value={settings.criticalThreshold} onChange={(e) => setSettings(prev => ({ ...prev, criticalThreshold: parseInt(e.target.value) || 100 }))} className="w-20" />
              <span className="text-muted-foreground">% of budget</span>
            </div>
            <p className="text-xs text-muted-foreground">Show a critical alert when spending exceeds this percentage</p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-in-app">Show In-App Alerts</Label>
            <Switch id="show-in-app" checked={settings.showInApp} onCheckedChange={(showInApp) => saveSettings({ ...settings, showInApp })} />
          </div>

          <button onClick={() => saveSettings(settings)} className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-medium flex items-center justify-center gap-2">
            <Check size={18} /> Save Settings
          </button>

          {alerts.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Current Alerts</h3>
              {alerts.map((alert) => (
                <div key={alert.category.id} className={`p-3 rounded-xl flex items-center gap-3 ${alert.status === 'critical' ? 'bg-destructive/10 border border-destructive/30' : 'bg-yellow-500/10 border border-yellow-500/30'}`}>
                  {alert.status === 'critical' ? <AlertTriangle className="text-destructive" size={20} /> : <TrendingUp className="text-yellow-500" size={20} />}
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{alert.category.icon} {alert.category.name}</p>
                    <p className="text-xs text-muted-foreground">${alert.spent.toFixed(2)} of ${alert.category.budget.toFixed(2)} ({alert.percentage.toFixed(0)}%)</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {alerts.length === 0 && settings.enabled && (
            <div className="text-center py-4 text-muted-foreground">
              <Check size={32} className="mx-auto mb-2 text-green-500" />
              <p>All budgets are on track!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};