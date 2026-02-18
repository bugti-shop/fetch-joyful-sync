import { ReactNode } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Lock } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { PremiumSettings } from './PremiumSettings';

interface FeatureGateProps {
  children: ReactNode;
  feature: string;
  fallback?: ReactNode;
  showUpgrade?: boolean;
}

export const FeatureGate = ({ 
  children, 
  feature, 
  fallback,
  showUpgrade = true 
}: FeatureGateProps) => {
  const { canUseFeature } = useSubscription();

  if (canUseFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgrade) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Lock className="h-4 w-4" />
            Premium Feature
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Unlock Premium</DialogTitle>
            <DialogDescription>
              This feature is available with Premium subscription
            </DialogDescription>
          </DialogHeader>
          <PremiumSettings />
        </DialogContent>
      </Dialog>
    );
  }

  return null;
};
