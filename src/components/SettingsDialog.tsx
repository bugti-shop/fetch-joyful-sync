import { Settings } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { NotificationSettings } from './NotificationSettings';
import { ScrollArea } from './ui/scroll-area';

export const SettingsDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your app preferences and subscription
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[500px] pr-4">
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border p-4">
              <NotificationSettings />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
