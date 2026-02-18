import { Cloud, Smartphone, GitMerge, ArrowUp, ArrowDown, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useSync } from '@/contexts/SyncContext';
import { formatDistanceToNow } from 'date-fns';

export const SyncConflictDialog = () => {
  const { conflict, resolveConflict, dismissConflict, isSyncing } = useSync();

  if (!conflict.isOpen) return null;

  const remoteTime = conflict.remoteData?.timestamp
    ? formatDistanceToNow(new Date(conflict.remoteData.timestamp), { addSuffix: true })
    : 'unknown';

  const localTime = conflict.localData?.timestamp
    ? formatDistanceToNow(new Date(conflict.localData.timestamp), { addSuffix: true })
    : 'unknown';

  const remoteDevice = conflict.remoteData?.deviceId || 'another device';

  return (
    <AlertDialog open={conflict.isOpen} onOpenChange={(open) => !open && dismissConflict()}>
      <AlertDialogContent className="max-w-[380px] rounded-2xl">
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-2">
            <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-amber-500" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-lg">
            Sync Conflict Detected
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-sm">
            Both this device and Google Drive have changes since your last sync. How would you like to resolve this?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 my-2">
          {/* Keep Local */}
          <button
            onClick={() => resolveConflict('keep_local')}
            disabled={isSyncing}
            className="w-full flex items-start gap-3 p-3 rounded-xl border border-border hover:bg-accent/50 transition-colors text-left disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 mt-0.5">
              <Smartphone className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                Keep This Device
                <ArrowUp className="h-3.5 w-3.5 text-blue-500" />
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upload your local data and overwrite the cloud backup.
                Changed {localTime}.
              </p>
            </div>
          </button>

          {/* Keep Remote */}
          <button
            onClick={() => resolveConflict('keep_remote')}
            disabled={isSyncing}
            className="w-full flex items-start gap-3 p-3 rounded-xl border border-border hover:bg-accent/50 transition-colors text-left disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 mt-0.5">
              <Cloud className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                Keep Cloud Data
                <ArrowDown className="h-3.5 w-3.5 text-green-500" />
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Restore from Google Drive and replace local data.
                Saved {remoteTime} from {remoteDevice}.
              </p>
            </div>
          </button>

          {/* Merge */}
          <button
            onClick={() => resolveConflict('merge')}
            disabled={isSyncing}
            className="w-full flex items-start gap-3 p-3 rounded-xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-left disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <GitMerge className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                Merge Both
                <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Recommended</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Combine data from both sources. No data is lost — new items from both sides are kept.
              </p>
            </div>
          </button>
        </div>

        <AlertDialogFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={dismissConflict}
            disabled={isSyncing}
            className="w-full text-muted-foreground"
          >
            Skip for now
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
