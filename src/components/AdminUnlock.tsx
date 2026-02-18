import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Check, X, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// The admin secret code - change this to your own secret
const ADMIN_SECRET = 'jarify2024admin';
const ADMIN_STORAGE_KEY = 'jarify_admin_unlocked';

export const isAdminUnlocked = (): boolean => {
  return localStorage.getItem(ADMIN_STORAGE_KEY) === 'true';
};

export const setAdminUnlocked = (unlocked: boolean) => {
  if (unlocked) {
    localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
  } else {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
  }
};

interface AdminUnlockProps {
  onUnlock?: () => void;
}

export const AdminUnlock = ({ onUnlock }: AdminUnlockProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(isAdminUnlocked());
  const { toast } = useToast();

  const handleUnlock = () => {
    if (code === ADMIN_SECRET) {
      setAdminUnlocked(true);
      setIsUnlocked(true);
      setCode('');
      setIsOpen(false);
      toast({
        title: 'Admin Access Granted',
        description: 'You now have access to all premium features.',
      });
      onUnlock?.();
      // Reload to apply changes
      window.location.reload();
    } else {
      toast({
        title: 'Invalid Code',
        description: 'The secret code you entered is incorrect.',
        variant: 'destructive',
      });
    }
  };

  const handleLock = () => {
    setAdminUnlocked(false);
    setIsUnlocked(false);
    toast({
      title: 'Admin Access Revoked',
      description: 'Premium features are now locked.',
    });
    window.location.reload();
  };

  if (isUnlocked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-green-500/10 border border-green-500/30 rounded-2xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
              <Shield className="text-green-500" size={20} />
            </div>
            <div>
              <p className="font-medium text-foreground">Admin Access Active</p>
              <p className="text-sm text-muted-foreground">All premium features unlocked</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLock}>
            Lock
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full p-4 bg-card border border-border rounded-2xl flex items-center gap-4 text-left hover:bg-secondary transition-colors"
        >
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Shield className="text-primary" size={20} />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">Admin Access</p>
            <p className="text-sm text-muted-foreground">Enter secret code to unlock</p>
          </div>
        </motion.button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield size={20} />
            Admin Unlock
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground">
            Enter the admin secret code to unlock all premium features.
          </p>
          <div className="relative">
            <Input
              type={showCode ? 'text' : 'password'}
              placeholder="Enter secret code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowCode(!showCode)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showCode ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <Button onClick={handleUnlock} className="w-full">
            <Check size={18} className="mr-2" />
            Unlock Premium
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
