import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  initializeRevenueCat,
  hasActiveEntitlement,
  purchaseByPlan,
  restorePurchases as rcRestorePurchases,
  presentPaywall,
  presentPaywallIfNeeded,
  presentCustomerCenter,
  getDisplayPricing,
  getCustomerInfo,
  isInTrialPeriod,
  getExpirationDate,
  PaywallResultType,
  DEFAULT_PRICING,
  type PricingInfo,
  type PlanType,
} from '@/lib/revenuecat';
import type { CustomerInfo } from '@revenuecat/purchases-capacitor';
import { isAdminUnlocked } from '@/components/AdminUnlock';
import { 
  updateSubscriptionStatus, 
  shouldShowPaywall, 
  canEnrollInFreeTrial,
  hasUsedFreeTrial,
  getSubscriptionStatus 
} from '@/lib/trialTracking';

export type SubscriptionTier = 'free' | 'premium';

interface SubscriptionContextType {
  tier: SubscriptionTier;
  isLoading: boolean;
  isInitialized: boolean;
  customerInfo: CustomerInfo | null;
  isTrialActive: boolean;
  expirationDate: Date | null;
  purchaseWeekly: () => Promise<void>;
  purchaseMonthly: () => Promise<void>;
  purchaseYearly: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  showPaywall: () => Promise<void>;
  showPaywallIfNeeded: () => Promise<boolean>;
  showCustomerCenter: () => Promise<void>;
  canUseFeature: (feature: string) => boolean;
  pricing: PricingInfo;
  refreshSubscriptionStatus: () => Promise<void>;
  shouldRedirectToPaywall: boolean;
  canUseTrial: boolean;
  hasUsedTrial: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const FREE_LIMITS = {
  maxJars: 2,
  maxCategories: 2,
  transactionHistoryDays: 30,
  maxStickyNotes: 2,
  maxCurrencies: 1,
  darkModes: 0,
  calculatorModes: ['monthly'],
  maxReminders: 0,
  maxActiveChallenges: 0,
};

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [pricing, setPricing] = useState<PricingInfo>(DEFAULT_PRICING);
  const [shouldRedirectToPaywall, setShouldRedirectToPaywall] = useState(false);
  const [canUseTrial, setCanUseTrial] = useState(true);
  const [hasUsedTrial, setHasUsedTrial] = useState(false);
  const { toast } = useToast();

  // Initialize RevenueCat and check subscription status
  const initialize = useCallback(async () => {
    try {
      console.log('Initializing subscription context...');
      
      // Check trial tracking status first
      setHasUsedTrial(hasUsedFreeTrial());
      setCanUseTrial(canEnrollInFreeTrial());
      setShouldRedirectToPaywall(shouldShowPaywall());
      
      const initialized = await initializeRevenueCat();
      setIsInitialized(initialized);
      
      if (initialized) {
        // Check entitlement status
        const hasEntitlement = await hasActiveEntitlement();
        setTier(hasEntitlement ? 'premium' : 'free');
        
        // Get customer info
        const info = await getCustomerInfo();
        setCustomerInfo(info);
        
        // Check trial status
        const isTrial = await isInTrialPeriod();
        setIsTrialActive(isTrial);
        
        // Get expiration date
        const expDate = await getExpirationDate();
        setExpirationDate(expDate);
        
        // Update local tracking
        updateSubscriptionStatus(hasEntitlement, isTrial, expDate, false);
        
        // Update redirect status after checking RevenueCat
        if (!hasEntitlement && hasUsedFreeTrial()) {
          setShouldRedirectToPaywall(true);
        } else {
          setShouldRedirectToPaywall(false);
        }
        
        // Get real pricing from store
        const realPricing = await getDisplayPricing();
        setPricing(realPricing);
        
        console.log('Subscription status:', { hasEntitlement, isTrial, expDate });
      }
    } catch (error) {
      console.error('Failed to initialize subscription context:', error);
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Refresh subscription status
  const refreshSubscriptionStatus = useCallback(async () => {
    try {
      const hasEntitlement = await hasActiveEntitlement();
      setTier(hasEntitlement ? 'premium' : 'free');
      
      const info = await getCustomerInfo();
      setCustomerInfo(info);
      
      const isTrial = await isInTrialPeriod();
      setIsTrialActive(isTrial);
      
      const expDate = await getExpirationDate();
      setExpirationDate(expDate);
    } catch (error) {
      console.error('Failed to refresh subscription status:', error);
    }
  }, []);

  const purchaseWeekly = async () => {
    try {
      setIsLoading(true);
      
      const result = await purchaseByPlan('weekly');
      
      if (result.success) {
        setTier('premium');
        setCustomerInfo(result.customerInfo);
        await refreshSubscriptionStatus();
        
        toast({
          title: 'Welcome to Jarify Pro!',
          description: 'Thank you for subscribing to the weekly plan.',
        });
      } else if (result.error !== 'cancelled') {
        toast({
          title: 'Purchase Failed',
          description: result.error || 'Unable to complete purchase. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: 'Purchase Failed',
        description: 'Unable to complete purchase. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const purchaseMonthly = async () => {
    try {
      setIsLoading(true);
      
      const result = await purchaseByPlan('monthly');
      
      if (result.success) {
        setTier('premium');
        setCustomerInfo(result.customerInfo);
        await refreshSubscriptionStatus();
        
        toast({
          title: 'Welcome to Jarify Pro!',
          description: 'Thank you for subscribing to the monthly plan.',
        });
      } else if (result.error !== 'cancelled') {
        toast({
          title: 'Purchase Failed',
          description: result.error || 'Unable to complete purchase. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: 'Purchase Failed',
        description: 'Unable to complete purchase. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const purchaseYearly = async () => {
    try {
      setIsLoading(true);
      
      const result = await purchaseByPlan('yearly');
      
      if (result.success) {
        setTier('premium');
        setCustomerInfo(result.customerInfo);
        await refreshSubscriptionStatus();
        
        toast({
          title: 'Welcome to Jarify Pro!',
          description: 'Thank you for subscribing to the yearly plan. You saved money!',
        });
      } else if (result.error !== 'cancelled') {
        toast({
          title: 'Purchase Failed',
          description: result.error || 'Unable to complete purchase. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: 'Purchase Failed',
        description: 'Unable to complete purchase. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const restorePurchases = async () => {
    try {
      setIsLoading(true);
      
      const result = await rcRestorePurchases();
      
      if (result.success) {
        setTier('premium');
        setCustomerInfo(result.customerInfo);
        await refreshSubscriptionStatus();
        
        toast({
          title: 'Purchases Restored',
          description: 'Your premium subscription has been restored.',
        });
      } else {
        toast({
          title: 'No Purchases Found',
          description: 'No previous purchases were found to restore.',
        });
      }
    } catch (error) {
      console.error('Restore error:', error);
      toast({
        title: 'Restore Failed',
        description: 'Unable to restore purchases. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const showPaywall = async () => {
    try {
      setIsLoading(true);
      
      const { result, customerInfo: info } = await presentPaywall();
      
      if (result === PaywallResultType.PURCHASED || result === PaywallResultType.RESTORED) {
        setTier('premium');
        setCustomerInfo(info);
        await refreshSubscriptionStatus();
        
        toast({
          title: 'Welcome to Jarify Pro!',
          description: result === PaywallResultType.RESTORED 
            ? 'Your subscription has been restored.'
            : 'Thank you for subscribing!',
        });
      }
    } catch (error) {
      console.error('Paywall error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showPaywallIfNeeded = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { result, customerInfo: info } = await presentPaywallIfNeeded();
      
      if (result === PaywallResultType.NOT_PRESENTED) {
        // User already has access
        return true;
      }
      
      if (result === PaywallResultType.PURCHASED || result === PaywallResultType.RESTORED) {
        setTier('premium');
        setCustomerInfo(info);
        await refreshSubscriptionStatus();
        
        toast({
          title: 'Welcome to Jarify Pro!',
          description: 'You now have access to all premium features.',
        });
        return true;
      }
      
      // User cancelled or there was an error
      return false;
    } catch (error) {
      console.error('Paywall if needed error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const showCustomerCenter = async () => {
    try {
      setIsLoading(true);
      
      const success = await presentCustomerCenter();
      
      if (!success) {
        toast({
          title: 'Unable to Open',
          description: 'Could not open subscription management. Please try again.',
          variant: 'destructive',
        });
      }
      
      // Refresh status after closing customer center
      await refreshSubscriptionStatus();
    } catch (error) {
      console.error('Customer center error:', error);
      toast({
        title: 'Error',
        description: 'Could not open subscription management.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canUseFeature = (feature: string): boolean => {
    // Admin override - always grant access if admin is unlocked
    if (isAdminUnlocked()) {
      return true;
    }
    return tier === 'premium';
  };

  return (
    <SubscriptionContext.Provider
      value={{
        tier,
        isLoading,
        isInitialized,
        customerInfo,
        isTrialActive,
        expirationDate,
        purchaseWeekly,
        purchaseMonthly,
        purchaseYearly,
        restorePurchases,
        showPaywall,
        showPaywallIfNeeded,
        showCustomerCenter,
        canUseFeature,
        pricing,
        refreshSubscriptionStatus,
        shouldRedirectToPaywall,
        canUseTrial,
        hasUsedTrial,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
};

export { FREE_LIMITS };
