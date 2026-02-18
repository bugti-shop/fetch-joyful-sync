import { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight, Settings as SettingsIcon, Bell, Shield } from 'lucide-react';
import { AdminUnlock } from '@/components/AdminUnlock';
import { useNavigate } from 'react-router-dom';
import { BackupSync } from '@/components/BackupSync';
import { useToast } from '@/hooks/use-toast';
import { hapticFeedback } from '@/lib/haptics';
import { storage } from '@/lib/storage';
import { Switch } from '@/components/ui/switch';
import { LocalNotifications } from '@capacitor/local-notifications';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const PLAY_STORE_LINK = 'https://play.google.com/store/apps/details?id=com.jarify.app';

interface NotificationPreferences {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  customDate?: string;
  customTime: string;
  message: string;
}

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    enabled: false,
    frequency: 'daily',
    customTime: '09:00',
    message: "Time to check your savings goals! 💰",
  });

  useEffect(() => {
    const saved = localStorage.getItem('jarify_notifications');
    if (saved) {
      setNotificationPrefs(JSON.parse(saved));
    }
  }, []);

  const handleNotificationToggle = async (enabled: boolean) => {
    const newPrefs = { ...notificationPrefs, enabled };
    setNotificationPrefs(newPrefs);
    localStorage.setItem('jarify_notifications', JSON.stringify(newPrefs));

    if (!enabled) {
      await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
      toast({
        title: 'Notifications Disabled',
        description: "You won't receive any more reminders.",
      });
    } else {
      scheduleNotifications(newPrefs);
    }
  };

  const scheduleNotifications = async (prefs: NotificationPreferences) => {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
      if (!prefs.enabled) return;

      const [hours, minutes] = prefs.customTime.split(':').map(Number);
      const now = new Date();
      const scheduledTime = new Date(now);
      scheduledTime.setHours(hours, minutes, 0, 0);

      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      let schedule: any = { at: scheduledTime };

      if (prefs.frequency === 'daily') {
        schedule.every = 'day';
      } else if (prefs.frequency === 'weekly') {
        schedule.every = 'week';
      } else if (prefs.frequency === 'monthly') {
        schedule.every = 'month';
      } else if (prefs.frequency === 'custom' && prefs.customDate) {
        const customDate = new Date(prefs.customDate);
        customDate.setHours(hours, minutes, 0, 0);
        schedule = { at: customDate };
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Jarify Reminder',
            body: prefs.message,
            id: 1,
            schedule,
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: null,
          },
        ],
      });

      toast({
        title: 'Notifications Scheduled',
        description: `You'll receive ${prefs.frequency} reminders at ${prefs.customTime}.`,
      });
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  };

  const saveNotificationSettings = () => {
    localStorage.setItem('jarify_notifications', JSON.stringify(notificationPrefs));
    scheduleNotifications(notificationPrefs);
    toast({
      title: 'Settings Saved',
      description: 'Your notification preferences have been updated.',
    });
  };

  const handleClearData = async () => {
    await hapticFeedback.warning();
    storage.clearAll();
    toast({
      title: 'Data Cleared',
      description: 'All your data has been deleted.',
      variant: 'destructive',
    });
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Jarify - Savings App',
          text: 'Check out Jarify, the best savings app!',
          url: PLAY_STORE_LINK,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      window.open(PLAY_STORE_LINK, '_blank');
    }
  };

  const handleRateApp = () => {
    window.open(PLAY_STORE_LINK, '_blank');
  };

  const handleDownloadData = () => {
    const data = {
      jars: localStorage.getItem('jarify_jars'),
      categories: localStorage.getItem('jarify_categories'),
      notes: localStorage.getItem('jarify_notes'),
      darkMode: localStorage.getItem('jarify_darkMode'),
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jarify-backup.json';
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: 'Download Complete',
      description: 'Your data has been downloaded.',
    });
  };

  const SettingsItem = ({ label, onClick }: { label: string; onClick?: () => void }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between py-4 px-4 text-foreground hover:bg-accent/50 transition-colors border-b border-border/50"
    >
      <span className="text-base">{label}</span>
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </button>
  );

  const SettingsToggleItem = ({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) => (
    <div className="w-full flex items-center justify-between py-4 px-4 border-b border-border/50">
      <span className="text-base text-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );

  const SectionHeader = ({ icon, label }: { icon?: React.ReactNode; label: string }) => (
    <div className="flex items-center gap-2 px-4 py-3 text-muted-foreground">
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 mb-2 bg-background/90 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-full hover:bg-accent transition-colors"
            >
              <ArrowLeft className="text-foreground" size={24} />
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Settings</h1>
          </div>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto">
        {/* Notifications Section */}
        <SectionHeader icon={<Bell className="w-4 h-4" />} label="Notifications" />
        <div className="bg-card rounded-lg mb-4 mx-4 overflow-hidden shadow-sm">
          <SettingsToggleItem 
            label="Push notifications" 
            checked={notificationPrefs.enabled} 
            onCheckedChange={handleNotificationToggle} 
          />
          {notificationPrefs.enabled && (
            <Dialog>
              <DialogTrigger asChild>
                <button className="w-full flex items-center justify-between py-4 px-4 text-foreground hover:bg-accent/50 transition-colors border-b border-border/50">
                  <span className="text-base">Reminder settings</span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Reminder Settings</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <div className="flex flex-col gap-2">
                    <Label>Frequency</Label>
                    <Select
                      value={notificationPrefs.frequency}
                      onValueChange={(value: any) =>
                        setNotificationPrefs({ ...notificationPrefs, frequency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="custom">Custom Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {notificationPrefs.frequency === 'custom' && (
                    <div className="flex flex-col gap-2">
                      <Label>Select Date</Label>
                      <Input
                        type="date"
                        value={notificationPrefs.customDate || ''}
                        onChange={(e) =>
                          setNotificationPrefs({
                            ...notificationPrefs,
                            customDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={notificationPrefs.customTime}
                      onChange={(e) =>
                        setNotificationPrefs({ ...notificationPrefs, customTime: e.target.value })
                      }
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Message</Label>
                    <Input
                      type="text"
                      value={notificationPrefs.message}
                      onChange={(e) =>
                        setNotificationPrefs({ ...notificationPrefs, message: e.target.value })
                      }
                      placeholder="Enter your reminder message"
                    />
                  </div>

                  <Button onClick={saveNotificationSettings} className="w-full">
                    Save Settings
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Data Management Section */}
        <div className="bg-card rounded-lg mb-4 mx-4 overflow-hidden shadow-sm">
          <BackupSync 
            onExport={() => {
              toast({
                title: 'Backup Complete',
                description: 'Your data has been backed up successfully.',
              });
            }} 
            onImport={() => {
              toast({
                title: 'Data Restored',
                description: 'Your backup has been restored.',
              });
              setTimeout(() => window.location.reload(), 1000);
            }}
            renderAsListItems={true}
          />
          <SettingsItem label="Download my data" onClick={handleDownloadData} />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="w-full flex items-center justify-between py-4 px-4 text-destructive hover:bg-destructive/10 transition-colors">
                <span className="text-base">Delete app data</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete all data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all your data including goals, categories, and notes. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Admin Section */}
        <SectionHeader icon={<Shield className="w-4 h-4" />} label="Admin" />
        <div className="bg-card rounded-lg mb-4 mx-4 overflow-hidden shadow-sm p-4">
          <AdminUnlock />
        </div>

        {/* Other Section */}
        <SectionHeader icon={<SettingsIcon className="w-4 h-4" />} label="Other" />
        <div className="bg-card rounded-lg mx-4 overflow-hidden shadow-sm">
          <SettingsItem label="Share with friends" onClick={handleShare} />
          
          {/* Terms of Service Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <button className="w-full flex items-center justify-between py-4 px-4 text-foreground hover:bg-accent/50 transition-colors border-b border-border/50">
                <span className="text-base">Terms of Service</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Terms of Service</DialogTitle>
              </DialogHeader>
              <div className="text-sm text-muted-foreground space-y-4 py-4">
                <p><strong>Last Updated:</strong> January 2025</p>
                <p>Welcome to Jarify. By using our app, you agree to these terms.</p>
                <h4 className="font-semibold text-foreground">1. Use of Service</h4>
                <p>Jarify is a personal savings tracker app. You may use it for personal, non-commercial purposes only.</p>
                <h4 className="font-semibold text-foreground">2. User Data</h4>
                <p>All your data is stored locally on your device. We do not collect or store your personal financial information on our servers.</p>
                <h4 className="font-semibold text-foreground">3. Disclaimer</h4>
                <p>Jarify is not a financial advisor. The calculators and tools are for informational purposes only. Always consult a professional for financial advice.</p>
                <h4 className="font-semibold text-foreground">4. Modifications</h4>
                <p>We reserve the right to modify these terms at any time. Continued use of the app constitutes acceptance of updated terms.</p>
                <h4 className="font-semibold text-foreground">5. Contact</h4>
                <p>For questions, contact us at bugtishop@gmail.com</p>
              </div>
            </DialogContent>
          </Dialog>

          {/* Help and Feedback Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <button className="w-full flex items-center justify-between py-4 px-4 text-foreground hover:bg-accent/50 transition-colors border-b border-border/50">
                <span className="text-base">Help and feedback</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Help and Feedback</DialogTitle>
              </DialogHeader>
              <div className="text-sm text-muted-foreground space-y-4 py-4">
                <h4 className="font-semibold text-foreground">Frequently Asked Questions</h4>
                <p><strong>How do I create a savings jar?</strong><br />Tap the + button on the home screen and enter your goal details.</p>
                <p><strong>How do I add money to a jar?</strong><br />Tap on any jar and use the Add or Withdraw buttons.</p>
                <p><strong>Is my data backed up?</strong><br />Your data is stored locally. Use the Backup feature in Settings to export your data.</p>
                <p><strong>Can I set reminders?</strong><br />Yes! Enable notifications in Settings to receive savings reminders.</p>
                <h4 className="font-semibold text-foreground mt-4">Need More Help?</h4>
                <p>Contact our support team at: <span className="text-foreground font-medium">bugtishop@gmail.com</span></p>
                <h4 className="font-semibold text-foreground mt-4">Send Feedback</h4>
                <p>We love hearing from you! Share your suggestions, report bugs, or tell us what you love about Jarify by emailing us.</p>
              </div>
            </DialogContent>
          </Dialog>

          {/* Privacy Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <button className="w-full flex items-center justify-between py-4 px-4 text-foreground hover:bg-accent/50 transition-colors border-b border-border/50">
                <span className="text-base">Privacy</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Privacy Policy</DialogTitle>
              </DialogHeader>
              <div className="text-sm text-muted-foreground space-y-4 py-4">
                <p><strong>Last Updated:</strong> January 2025</p>
                <p>Your privacy is important to us. This policy explains how Jarify handles your information.</p>
                <h4 className="font-semibold text-foreground">Data Storage</h4>
                <p>All your financial data, savings goals, and personal information are stored locally on your device. We do not upload or store your data on any external servers.</p>
                <h4 className="font-semibold text-foreground">Data Collection</h4>
                <p>Jarify does not collect personal information. We may collect anonymous usage analytics to improve the app experience.</p>
                <h4 className="font-semibold text-foreground">Third-Party Services</h4>
                <p>We do not share your information with third parties. Any integrations (like Google Play) follow their respective privacy policies.</p>
                <h4 className="font-semibold text-foreground">Data Security</h4>
                <p>Your data remains on your device and is as secure as your device itself. We recommend using device-level security features.</p>
                <h4 className="font-semibold text-foreground">Your Rights</h4>
                <p>You can delete all your data at any time using the "Delete app data" option in Settings.</p>
                <h4 className="font-semibold text-foreground">Contact</h4>
                <p>For privacy concerns, contact us at bugtishop@gmail.com</p>
              </div>
            </DialogContent>
          </Dialog>

          <button
            onClick={handleRateApp}
            className="w-full flex items-center justify-between py-4 px-4 text-foreground hover:bg-accent/50 transition-colors"
          >
            <span className="text-base">Rate app</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default Settings;
