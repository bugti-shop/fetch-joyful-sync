import { useState } from 'react';
import { Crown, Lock, Bell, MapPin, X, Check } from 'lucide-react';
import { Button } from './ui/button';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { hapticFeedback } from '@/lib/haptics';

const triggerHaptic = async () => {
  try {
    await hapticFeedback.heavy();
    setTimeout(async () => {
      await hapticFeedback.heavy();
    }, 50);
  } catch (error) {
    // Haptics not available
  }
};

interface ProPaywallProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

const features = [
  {
    icon: Lock,
    iconBg: 'bg-blue-500',
    title: 'Unlock All Features',
    description: 'Dark mode, custom currencies, and more',
  },
  {
    icon: Bell,
    iconBg: 'bg-blue-400',
    title: 'Unlimited Everything',
    description: 'Unlimited jars, categories, and notes',
  },
  {
    icon: Crown,
    iconBg: 'bg-indigo-500',
    title: 'Pro Member',
    description: 'Get access to all current and future features',
  },
  {
    icon: MapPin,
    iconBg: 'bg-pink-400',
    title: 'Investment Insights',
    description: 'Daily, weekly & monthly saving plans',
  },
];

type PlanOption = 'weekly' | 'monthly' | 'yearly';

export const ProPaywall = ({ isOpen, onClose, featureName }: ProPaywallProps) => {
  const { isLoading, purchaseWeekly, purchaseMonthly, purchaseYearly, restorePurchases, pricing } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<PlanOption>('yearly');

  if (!isOpen) return null;

  const handleContinue = () => {
    if (selectedPlan === 'weekly') {
      purchaseWeekly();
    } else if (selectedPlan === 'monthly') {
      purchaseMonthly();
    } else {
      purchaseYearly();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#1a1a2e] rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto overscroll-contain touch-pan-y">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <X size={18} className="text-white/70" />
        </button>

        <div className="px-6 pt-10 pb-8">
          {/* Header */}
          <h2 className="text-3xl font-bold text-white text-center mb-2">Upgrade to Pro</h2>
          {featureName && (
            <p className="text-center text-blue-400 text-sm mb-6">
              {featureName} is a Pro feature
            </p>
          )}
          {!featureName && <div className="mb-6" />}

          {/* Features List with Timeline */}
          <div className="relative mb-8">
            {/* Timeline line */}
            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-blue-500 via-indigo-500 to-pink-400" />

            <div className="space-y-5">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-start gap-4 relative">
                    <div className={`w-12 h-12 rounded-full ${feature.iconBg} flex items-center justify-center flex-shrink-0 z-10 shadow-lg`}>
                      <Icon size={20} className="text-white" />
                    </div>
                    <div className="pt-1">
                      <h3 className="text-white font-semibold text-base">{feature.title}</h3>
                      <p className="text-white/50 text-sm">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Plan Selection */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {/* Weekly */}
            <button
              onClick={() => { triggerHaptic(); setSelectedPlan('weekly'); }}
              className={`relative rounded-xl p-3 text-center transition-all border-2 ${
                selectedPlan === 'weekly'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-blue-400 rounded-full text-[8px] font-bold text-white whitespace-nowrap">
                Try Out
              </span>
              {selectedPlan === 'weekly' && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                  <Check size={10} className="text-white" />
                </div>
              )}
              <p className="text-white font-bold text-sm mt-1">Weekly</p>
              <p className="text-white/60 text-[10px]">{pricing.weekly?.displayPrice || '$1.75/wk'}</p>
            </button>

            {/* Monthly */}
            <button
              onClick={() => { triggerHaptic(); setSelectedPlan('monthly'); }}
              className={`relative rounded-xl p-3 text-center transition-all border-2 ${
                selectedPlan === 'monthly'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-blue-500 rounded-full text-[8px] font-bold text-white whitespace-nowrap">
                Popular
              </span>
              {selectedPlan === 'monthly' && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                  <Check size={10} className="text-white" />
                </div>
              )}
              <p className="text-white font-bold text-sm mt-1">Monthly</p>
              <p className="text-white/60 text-[10px]">{pricing.monthly.displayPrice}</p>
            </button>

            {/* Yearly */}
            <button
              onClick={() => { triggerHaptic(); setSelectedPlan('yearly'); }}
              className={`relative rounded-xl p-3 text-center transition-all border-2 ${
                selectedPlan === 'yearly'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-teal-500 rounded-full text-[8px] font-bold text-white whitespace-nowrap">
                Best Value
              </span>
              {selectedPlan === 'yearly' && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                  <Check size={10} className="text-white" />
                </div>
              )}
              <p className="text-white font-bold text-sm mt-1">Yearly</p>
              <p className="text-white/60 text-[10px]">{pricing.yearly.displayPrice}</p>
              <p className="text-white/40 text-[8px] mt-0.5">{pricing.yearly.displayYearlyPrice}</p>
            </button>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleContinue}
            disabled={isLoading}
            className="w-full py-6 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-base shadow-lg shadow-blue-500/25"
            size="lg"
          >
            {isLoading
              ? 'Processing...'
              : `Continue with ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} — ${
                  selectedPlan === 'weekly' ? (pricing.weekly?.displayPrice || '$1.75/wk') : selectedPlan === 'monthly' ? pricing.monthly.displayPrice : pricing.yearly.displayPrice
                }`}
          </Button>

          {/* Restore */}
          <button
            onClick={restorePurchases}
            disabled={isLoading}
            className="w-full text-center text-blue-400 text-sm font-medium mt-4 py-2 hover:text-blue-300 transition-colors"
          >
            Restore Purchase
          </button>
        </div>
      </div>
    </div>
  );
};

// Small crown badge component for inline use
export const ProBadge = ({ onClick, className = '' }: { onClick?: () => void; className?: string }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-600 text-[10px] font-semibold ${className}`}
  >
    <Crown className="h-3 w-3" />
    PRO
  </button>
);
