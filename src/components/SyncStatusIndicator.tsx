import { Cloud, RefreshCw, Check, CloudOff } from 'lucide-react';
import { useSync } from '@/contexts/SyncContext';
import { useGoogleAuth } from '@/contexts/GoogleAuthContext';
import { formatDistanceToNow } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const SyncStatusIndicator = () => {
  const { isSignedIn } = useGoogleAuth();
  const { isSyncing, lastSynced } = useSync();

  if (!isSignedIn) return null;

  const tooltipText = isSyncing
    ? 'Syncing to Google Drive...'
    : lastSynced
      ? `Last synced ${formatDistanceToNow(new Date(lastSynced), { addSuffix: true })}`
      : 'Not synced yet';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center justify-center w-8 h-8 rounded-full">
          {isSyncing ? (
            <RefreshCw className="h-4 w-4 text-primary animate-spin" />
          ) : lastSynced ? (
            <Cloud className="h-4 w-4 text-primary" />
          ) : (
            <CloudOff className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs">{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
};
