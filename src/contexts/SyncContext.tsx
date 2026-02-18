import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useGoogleAuth } from '@/contexts/GoogleAuthContext';
import { performFullSync, uploadToDrive, getLastSyncTime, type SyncData, type SyncResult } from '@/lib/driveSync';
import { useToast } from '@/hooks/use-toast';

interface ConflictState {
  isOpen: boolean;
  remoteData?: SyncData;
  localData?: SyncData;
}

interface SyncContextType {
  isSyncing: boolean;
  lastSynced: string | null;
  syncNow: () => Promise<void>;
  autoSyncEnabled: boolean;
  setAutoSyncEnabled: (enabled: boolean) => void;
  conflict: ConflictState;
  resolveConflict: (choice: 'keep_local' | 'keep_remote' | 'merge') => Promise<void>;
  dismissConflict: () => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider = ({ children }: { children: ReactNode }) => {
  const { user, isSignedIn } = useGoogleAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(getLastSyncTime());
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
    return localStorage.getItem('jarify_auto_sync') !== 'false';
  });
  const [conflict, setConflict] = useState<ConflictState>({ isOpen: false });
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem('jarify_auto_sync', String(autoSyncEnabled));
  }, [autoSyncEnabled]);

  const handleSyncResult = useCallback((result: SyncResult) => {
    if (result.direction === 'conflict') {
      setConflict({
        isOpen: true,
        remoteData: result.remoteData,
        localData: result.localData,
      });
      return;
    }

    if (result.success) {
      setLastSynced(getLastSyncTime());
      const messages: Record<string, string> = {
        uploaded: 'Your data has been backed up to Google Drive.',
        downloaded: 'Your data has been restored from Google Drive.',
        merged: 'Your data has been merged successfully.',
        none: 'Sync completed.',
      };
      toast({
        title: 'Sync Complete ✅',
        description: messages[result.direction],
      });

      if (result.direction === 'downloaded' || result.direction === 'merged') {
        setTimeout(() => window.location.reload(), 1500);
      }
    } else {
      toast({
        title: 'Sync Failed',
        description: 'Could not sync with Google Drive. Please try again.',
        variant: 'destructive',
      });
    }
  }, [toast]);

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
      handleSyncResult(result);
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
  }, [isSignedIn, user, toast, handleSyncResult]);

  const resolveConflict = useCallback(async (choice: 'keep_local' | 'keep_remote' | 'merge') => {
    if (!user?.accessToken) return;

    try {
      setIsSyncing(true);
      setConflict({ isOpen: false });
      const result = await performFullSync(user.accessToken, choice);
      handleSyncResult(result);
    } catch (error) {
      console.error('Conflict resolution error:', error);
      toast({
        title: 'Resolution Failed',
        description: 'Could not resolve sync conflict. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  }, [user, handleSyncResult, toast]);

  const dismissConflict = useCallback(() => {
    setConflict({ isOpen: false });
  }, []);

  // Auto-sync on sign-in
  useEffect(() => {
    if (isSignedIn && user?.accessToken && autoSyncEnabled) {
      const timer = setTimeout(() => {
        syncNow();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSignedIn]);

  // Auto-sync periodically (every 5 minutes)
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
    }, 5 * 60 * 1000);

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
        conflict,
        resolveConflict,
        dismissConflict,
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
