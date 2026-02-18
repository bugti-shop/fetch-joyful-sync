import { useState } from 'react';
import { Crown, Check, Sparkles, Gift, X } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useSubscription } from '@/contexts/SubscriptionContext';

const premiumFeatures = [
  'Unlimited jars & categories',
  'Debt/Loan tracking jars',
  'Image jars (Photo Circle)',
  'All currency symbols',
  'Investment plan insights',
  'All dark modes',
  'Advanced calculator',
  'Backup & restore',
  'Unlimited sticky notes',
  'Savings trends & analytics',
  'No ads',
];

interface ProPaywallProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export const ProPaywall = ({ isOpen, onClose, featureName }: ProPaywallProps) => {
  const { isLoading, purchaseMonthly, purchaseYearly, restorePurchases, pricing } = useSubscription();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-card rounded-3xl p-6 max-w-md w-full shadow-2xl my-8 max-h-[90vh] overflow-y-auto relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-accent transition-colors"
        >
          <X size={20} className="text-muted-foreground" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-3">
            <Crown className="h-8 w-8 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Upgrade to Pro</h2>
          {featureName && (
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-medium text-amber-600">{featureName}</span> is a Pro feature
            </p>
          )}
        </div>

        {/* Features */}
        <div className="space-y-2.5 mb-6">
          {premiumFeatures.map((feature, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/10">
                <Check className="h-3 w-3 text-amber-600" />
              </div>
              <span className="text-sm text-foreground/90">{feature}</span>
            </div>
          ))}
        </div>

        {/* Free Trial */}
        <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 p-3 border border-emerald-500/30 mb-4">
          <Gift className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-medium text-foreground">Start with a free trial!</p>
        </div>

        {/* Pricing */}
        <div className="space-y-3 mb-4">
          <div className="rounded-xl border-2 border-amber-500 bg-amber-500/5 p-4">
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Yearly</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground">{pricing.yearly.displayPrice}</span>
                  <span className="text-sm text-muted-foreground">billed yearly</span>
                </div>
                <p className="mt-1 text-xs text-amber-600 font-medium">
                  Save ${pricing.yearly.savings.toFixed(2)}!
                </p>
              </div>
              <Badge className="bg-amber-500 text-white border-0">Best Value</Badge>
            </div>
            <Button
              onClick={() => purchaseYearly()}
              disabled={isLoading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              size="lg"
            >
              {isLoading ? 'Processing...' : 'Start Free Trial'}
            </Button>
          </div>

          <div className="rounded-xl border-2 border-border bg-card p-4">
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground">{pricing.monthly.displayPrice}</span>
                </div>
              </div>
              <Badge variant="secondary">Popular</Badge>
            </div>
            <Button
              onClick={() => purchaseMonthly()}
              disabled={isLoading}
              className="w-full"
              size="lg"
              variant="outline"
            >
              {isLoading ? 'Processing...' : 'Start Free Trial'}
            </Button>
          </div>
        </div>

        <Button
          onClick={restorePurchases}
          variant="ghost"
          className="w-full"
          disabled={isLoading}
        >
          Restore Purchases
        </Button>
      </div>
    </div>
  );
};

// Small crown badge component for inline use
export const ProBadge = ({ onClick, className = '' }: { onClick?: () => void; className?: string }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 text-[10px] font-semibold ${className}`}
  >
    <Crown className="h-3 w-3" />
    PRO
  </button>
);
