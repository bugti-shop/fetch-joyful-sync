import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useGoogleAuth } from '@/contexts/GoogleAuthContext';
import { performFullSync, uploadToDrive, getLastSyncTime } from '@/lib/driveSync';
import { useToast } from '@/hooks/use-toast';

interface SyncContextType {
  isSyncing: boolean;
  lastSynced: string | null;
  syncNow: () => Promise<void>;
  autoSyncEnabled: boolean;
  setAutoSyncEnabled: (enabled: boolean) => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider = ({ children }: { children: ReactNode }) => {
  const { user, isSignedIn } = useGoogleAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(getLastSyncTime());
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
    return localStorage.getItem('jarify_auto_sync') !== 'false';
  });
  const { toast } = useToast();

  // Save auto-sync preference
  useEffect(() => {
    localStorage.setItem('jarify_auto_sync', String(autoSyncEnabled));
  }, [autoSyncEnabled]);

  const syncNow = useCallback(async () => {
    if (!isSignedIn || !user?.accessToken) {
      toast({
        title: 'Not Signed In',
        description: 'Please sign in with Google to sync your data.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSyncing(true);
      const result = await performFullSync(user.accessToken);

      if (result.success) {
        setLastSynced(getLastSyncTime());
        const messages: Record<string, string> = {
          uploaded: 'Your data has been backed up to Google Drive.',
          downloaded: 'Your data has been restored from Google Drive.',
          merged: 'Your data has been synced with Google Drive.',
          none: 'Sync completed.',
        };
        toast({
          title: 'Sync Complete ✅',
          description: messages[result.direction],
        });

        // Reload page if data was downloaded to refresh all contexts
        if (result.direction === 'downloaded') {
          setTimeout(() => window.location.reload(), 1500);
        }
      } else {
        toast({
          title: 'Sync Failed',
          description: 'Could not sync with Google Drive. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: 'Sync Error',
        description: 'An error occurred during sync.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isSignedIn, user, toast]);

  // Auto-sync on sign-in
  useEffect(() => {
    if (isSignedIn && user?.accessToken && autoSyncEnabled) {
      // Delay to let app fully load
      const timer = setTimeout(() => {
        syncNow();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSignedIn]); // Only trigger on sign-in state change

  // Auto-sync periodically (every 5 minutes while signed in)
  useEffect(() => {
    if (!isSignedIn || !user?.accessToken || !autoSyncEnabled) return;

    const interval = setInterval(async () => {
      if (!isSyncing && user?.accessToken) {
        try {
          await uploadToDrive(user.accessToken);
          setLastSynced(getLastSyncTime());
        } catch (error) {
          console.error('Auto-sync error:', error);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isSignedIn, user?.accessToken, autoSyncEnabled, isSyncing]);

  return (
    <SyncContext.Provider
      value={{
        isSyncing,
        lastSynced,
        syncNow,
        autoSyncEnabled,
        setAutoSyncEnabled,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within SyncProvider');
  }
  return context;
};
