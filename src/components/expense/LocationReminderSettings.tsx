import { useState } from 'react';
import { MapPin, Trash2, Bell, Clock, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useLocationReminder } from '@/hooks/useLocationReminder';
import { useToast } from '@/hooks/use-toast';
import { requestPermission } from '@/lib/permissions';

interface LocationReminderSettingsProps {
  onClose: () => void;
}

export const LocationReminderSettings = ({ onClose }: LocationReminderSettingsProps) => {
  const { toast } = useToast();
  const {
    locations,
    settings,
    isWatching,
    isSupported,
    updateSettings,
    startWatching,
    stopWatching,
    recordLocation,
    deleteLocation,
    clearAllLocations
  } = useLocationReminder();

  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');

  const handleToggleReminders = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestPermission('geolocation');
      if (!granted) {
        toast({
          title: 'Permission required',
          description: 'Please allow location access to use this feature',
          variant: 'destructive'
        });
        return;
      }
      
      // Also request notification permission
      await requestPermission('notifications');
      startWatching();
    } else {
      stopWatching();
    }
    updateSettings({ enabled });
  };

  const handleAddCurrentLocation = async () => {
    setIsAddingLocation(true);
    const granted = await requestPermission('geolocation');
    if (!granted) {
      toast({
        title: 'Permission required',
        description: 'Please allow location access',
        variant: 'destructive'
      });
      setIsAddingLocation(false);
      return;
    }

    const location = await recordLocation(newLocationName || undefined);
    if (location) {
      toast({
        title: 'Location saved',
        description: `${location.name} added to frequent locations`
      });
      setNewLocationName('');
    } else {
      toast({
        title: 'Failed to add location',
        description: 'Could not get your current location',
        variant: 'destructive'
      });
    }
    setIsAddingLocation(false);
  };

  if (!isSupported) {
    return (
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border p-6">
          <p className="text-center text-muted-foreground">
            Location services are not supported in this browser.
          </p>
          <Button onClick={onClose} className="w-full mt-4">Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <MapPin size={20} className="text-primary" />
            Location Reminders
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary">
            ✕
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-2xl">
            <div className="flex items-center gap-3">
              <Bell size={20} className="text-primary" />
              <div>
                <p className="font-medium text-foreground">Enable Reminders</p>
                <p className="text-xs text-muted-foreground">Get notified at frequent stores</p>
              </div>
            </div>
            <Switch
              checked={settings.enabled && isWatching}
              onCheckedChange={handleToggleReminders}
            />
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Clock size={14} />
                Reminder Cooldown (minutes)
              </Label>
              <Input
                type="number"
                min={5}
                max={1440}
                value={settings.reminderCooldown}
                onChange={e => updateSettings({ reminderCooldown: parseInt(e.target.value) || 60 })}
                className="bg-secondary"
              />
              <p className="text-xs text-muted-foreground">How long to wait before reminding again at the same location</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Minimum Visits to Trigger</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={settings.minVisitsToTrigger}
                onChange={e => updateSettings({ minVisitsToTrigger: parseInt(e.target.value) || 2 })}
                className="bg-secondary"
              />
              <p className="text-xs text-muted-foreground">How many times you must visit before getting reminders</p>
            </div>
          </div>

          {/* Add Location */}
          <div className="p-4 bg-primary/10 rounded-2xl border border-primary/30 space-y-3">
            <p className="font-medium text-foreground">Add Current Location</p>
            <Input
              placeholder="Location name (optional)"
              value={newLocationName}
              onChange={e => setNewLocationName(e.target.value)}
              className="bg-background"
            />
            <Button
              onClick={handleAddCurrentLocation}
              disabled={isAddingLocation}
              className="w-full"
            >
              <Navigation size={16} className="mr-2" />
              {isAddingLocation ? 'Getting location...' : 'Save Current Location'}
            </Button>
          </div>

          {/* Saved Locations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Saved Locations ({locations.length})</h3>
              {locations.length > 0 && (
                <button
                  onClick={clearAllLocations}
                  className="text-xs text-destructive hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            {locations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No saved locations yet. Add your frequently visited stores above.
              </p>
            ) : (
              <div className="space-y-2">
                {locations.map(location => (
                  <div
                    key={location.id}
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{location.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Visited {location.visitCount} times • Last: {new Date(location.lastVisit).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteLocation(location.id)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
