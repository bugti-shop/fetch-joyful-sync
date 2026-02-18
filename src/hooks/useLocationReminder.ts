import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface FrequentLocation {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  category?: string;
  visitCount: number;
  lastVisit: string;
  radius: number; // meters
}

interface LocationReminderSettings {
  enabled: boolean;
  minVisitsToTrigger: number;
  reminderCooldown: number; // minutes
}

const LOCATIONS_STORAGE_KEY = 'jarify_frequent_locations';
const SETTINGS_STORAGE_KEY = 'jarify_location_reminder_settings';
const LAST_REMINDER_KEY = 'jarify_last_location_reminder';

const DEFAULT_SETTINGS: LocationReminderSettings = {
  enabled: true,
  minVisitsToTrigger: 2,
  reminderCooldown: 60 // 1 hour
};

export const useLocationReminder = (onReminderTrigger?: (location: FrequentLocation) => void) => {
  const { toast } = useToast();
  const [locations, setLocations] = useState<FrequentLocation[]>([]);
  const [settings, setSettings] = useState<LocationReminderSettings>(DEFAULT_SETTINGS);
  const [isWatching, setIsWatching] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastReminderRef = useRef<string>('');

  // Load saved locations and settings
  useEffect(() => {
    const savedLocations = localStorage.getItem(LOCATIONS_STORAGE_KEY);
    if (savedLocations) {
      setLocations(JSON.parse(savedLocations));
    }
    
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    
    const lastReminder = localStorage.getItem(LAST_REMINDER_KEY);
    if (lastReminder) {
      lastReminderRef.current = lastReminder;
    }
  }, []);

  // Save locations
  const saveLocations = useCallback((newLocations: FrequentLocation[]) => {
    setLocations(newLocations);
    localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(newLocations));
  }, []);

  // Save settings
  const updateSettings = useCallback((newSettings: Partial<LocationReminderSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
  }, [settings]);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }, []);

  // Check if we're near any frequent location
  const checkNearbyLocations = useCallback((lat: number, lng: number) => {
    if (!settings.enabled) return null;

    for (const location of locations) {
      if (location.visitCount >= settings.minVisitsToTrigger) {
        const distance = calculateDistance(lat, lng, location.latitude, location.longitude);
        if (distance <= location.radius) {
          return location;
        }
      }
    }
    return null;
  }, [locations, settings, calculateDistance]);

  // Show reminder if conditions are met
  const showReminderIfNeeded = useCallback((location: FrequentLocation) => {
    const now = new Date();
    const lastReminderTime = lastReminderRef.current ? new Date(lastReminderRef.current) : null;
    
    // Check cooldown
    if (lastReminderTime) {
      const minutesSinceLastReminder = (now.getTime() - lastReminderTime.getTime()) / (1000 * 60);
      if (minutesSinceLastReminder < settings.reminderCooldown) {
        return;
      }
    }

    // Update last reminder time
    lastReminderRef.current = now.toISOString();
    localStorage.setItem(LAST_REMINDER_KEY, now.toISOString());

    // Show notification
    toast({
      title: `📍 At ${location.name}?`,
      description: 'Tap to log an expense for this location',
      duration: 10000,
    });

    // Call callback if provided
    onReminderTrigger?.(location);

    // Try native notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`At ${location.name}?`, {
        body: 'Tap to log an expense',
        icon: '/logo.png',
        tag: 'location-reminder'
      });
    }
  }, [settings.reminderCooldown, toast, onReminderTrigger]);

  // Add or update a location
  const recordLocation = useCallback(async (name?: string, category?: string): Promise<FrequentLocation | null> => {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Check if near existing location
          const existingIdx = locations.findIndex(loc => {
            const distance = calculateDistance(latitude, longitude, loc.latitude, loc.longitude);
            return distance < 100; // Within 100 meters
          });

          let locationName = name;
          if (!locationName) {
            // Try reverse geocoding
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
              );
              const data = await response.json();
              locationName = data.name || data.address?.shop || data.address?.amenity || 
                            data.address?.road || 'Unknown Location';
            } catch {
              locationName = 'Unknown Location';
            }
          }

          if (existingIdx >= 0) {
            // Update existing
            const updated = [...locations];
            updated[existingIdx] = {
              ...updated[existingIdx],
              visitCount: updated[existingIdx].visitCount + 1,
              lastVisit: new Date().toISOString(),
              name: name || updated[existingIdx].name,
              category: category || updated[existingIdx].category
            };
            saveLocations(updated);
            resolve(updated[existingIdx]);
          } else {
            // Add new
            const newLocation: FrequentLocation = {
              id: `loc_${Date.now()}`,
              latitude,
              longitude,
              name: locationName,
              category,
              visitCount: 1,
              lastVisit: new Date().toISOString(),
              radius: 100
            };
            saveLocations([...locations, newLocation]);
            resolve(newLocation);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, [locations, calculateDistance, saveLocations]);

  // Start watching location
  const startWatching = useCallback(() => {
    if (!('geolocation' in navigator) || !settings.enabled) return;

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        
        const nearbyLocation = checkNearbyLocations(latitude, longitude);
        if (nearbyLocation) {
          showReminderIfNeeded(nearbyLocation);
        }
      },
      (error) => {
        console.error('Location watch error:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60000, // 1 minute cache
        timeout: 10000
      }
    );

    setIsWatching(true);
  }, [settings.enabled, checkNearbyLocations, showReminderIfNeeded]);

  // Stop watching
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWatching(false);
  }, []);

  // Delete a location
  const deleteLocation = useCallback((id: string) => {
    saveLocations(locations.filter(loc => loc.id !== id));
  }, [locations, saveLocations]);

  // Clear all locations
  const clearAllLocations = useCallback(() => {
    saveLocations([]);
  }, [saveLocations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    locations,
    settings,
    isWatching,
    currentLocation,
    updateSettings,
    startWatching,
    stopWatching,
    recordLocation,
    deleteLocation,
    clearAllLocations,
    isSupported: 'geolocation' in navigator
  };
};
