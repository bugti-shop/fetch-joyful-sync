import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NotificationPreferences {
  enabled: boolean;
  frequency: "daily" | "weekly" | "monthly" | "custom";
  customDate?: string;
  customTime: string;
  message: string;
}

export const NotificationSettings = () => {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: false,
    frequency: "daily",
    customTime: "09:00",
    message: "Time to check your savings goals! 💰",
  });

  useEffect(() => {
    const saved = localStorage.getItem("jarify_notifications");
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
    requestPermissions();
    
    // Add listener for when notification is actually received/displayed
    const addNotificationListener = async () => {
      try {
        await LocalNotifications.addListener('localNotificationReceived', async (notification) => {
          // Trigger very strong vibration when notification is received
          try {
            await Haptics.impact({ style: ImpactStyle.Heavy });
            setTimeout(async () => {
              await Haptics.impact({ style: ImpactStyle.Heavy });
            }, 100);
            setTimeout(async () => {
              await Haptics.impact({ style: ImpactStyle.Heavy });
            }, 200);
          } catch (e) {
            console.log("Haptics not available");
          }
        });
      } catch (error) {
        console.log("Error adding notification listener:", error);
      }
    };
    
    addNotificationListener();
    
    return () => {
      LocalNotifications.removeAllListeners();
    };
  }, []);

  const requestPermissions = async () => {
    try {
      const result = await LocalNotifications.requestPermissions();
      if (result.display !== "granted") {
        toast({
          title: "Notification Permission Required",
          description: "Please enable notifications in your device settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.log("Notification permission error:", error);
    }
  };

  const scheduleNotifications = async (prefs: NotificationPreferences) => {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: 1 }] });

      if (!prefs.enabled) return;

      const [hours, minutes] = prefs.customTime.split(":").map(Number);
      const now = new Date();
      const scheduledTime = new Date(now);
      scheduledTime.setHours(hours, minutes, 0, 0);

      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      let schedule: any = { at: scheduledTime };

      if (prefs.frequency === "daily") {
        schedule.every = "day";
      } else if (prefs.frequency === "weekly") {
        schedule.every = "week";
      } else if (prefs.frequency === "monthly") {
        schedule.every = "month";
      } else if (prefs.frequency === "custom" && prefs.customDate) {
        const customDate = new Date(prefs.customDate);
        customDate.setHours(hours, minutes, 0, 0);
        schedule = { at: customDate };
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            title: "Mindful Stash Save",
            body: prefs.message,
            id: 1,
            schedule,
            sound: undefined,
            attachments: undefined,
            actionTypeId: "",
            extra: null,
            iconColor: "#10b981",
            smallIcon: "res://logo",
            largeIcon: "res://logo",
          },
        ],
      });

      // Trigger strong vibration when notification is scheduled
      try {
        await Haptics.impact({ style: ImpactStyle.Heavy });
        // Double vibration for extra strong feedback
        setTimeout(async () => {
          await Haptics.impact({ style: ImpactStyle.Heavy });
        }, 100);
      } catch (e) {
        console.log("Haptics not available");
      }

      toast({
        title: "Notifications Scheduled",
        description: `You'll receive ${prefs.frequency} reminders at ${prefs.customTime}.`,
      });
    } catch (error) {
      console.error("Error scheduling notifications:", error);
      toast({
        title: "Error",
        description: "Failed to schedule notifications.",
        variant: "destructive",
      });
    }
  };

  const handleSave = () => {
    localStorage.setItem("jarify_notifications", JSON.stringify(preferences));
    scheduleNotifications(preferences);
    toast({
      title: "Settings Saved",
      description: "Your notification preferences have been updated.",
    });
  };

  const handleToggle = async () => {
    const newEnabled = !preferences.enabled;
    const newPrefs = { ...preferences, enabled: newEnabled };
    setPreferences(newPrefs);
    
    if (!newEnabled) {
      await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
      localStorage.setItem("jarify_notifications", JSON.stringify(newPrefs));
      toast({
        title: "Notifications Disabled",
        description: "You won't receive any more reminders.",
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Notification Settings</DialogTitle>
          <DialogDescription>
            Customize when and how you receive savings reminders.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label>Enable Notifications</Label>
            <Button
              variant={preferences.enabled ? "default" : "outline"}
              size="sm"
              onClick={handleToggle}
            >
              {preferences.enabled ? "On" : "Off"}
            </Button>
          </div>

          {preferences.enabled && (
            <>
              <div className="flex flex-col gap-2">
                <Label>Frequency</Label>
                <Select
                  value={preferences.frequency}
                  onValueChange={(value: any) =>
                    setPreferences({ ...preferences, frequency: value })
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

              {preferences.frequency === "custom" && (
                <div className="flex flex-col gap-2">
                  <Label>Select Date</Label>
                  <Input
                    type="date"
                    value={preferences.customDate || ""}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
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
                  value={preferences.customTime}
                  onChange={(e) =>
                    setPreferences({ ...preferences, customTime: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Notification Message</Label>
                <Input
                  type="text"
                  value={preferences.message}
                  onChange={(e) =>
                    setPreferences({ ...preferences, message: e.target.value })
                  }
                  placeholder="Enter your custom reminder message"
                />
              </div>

              <Button onClick={handleSave} className="w-full">
                Save Settings
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
