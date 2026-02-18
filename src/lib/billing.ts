// This file re-exports RevenueCat functions for backwards compatibility
// All billing is now handled through RevenueCat SDK which uses Billing Library 7.x

import {
  purchaseByPlan,
  restorePurchases as rcRestorePurchases,
  hasActiveEntitlement,
  getProductInfo,
  GOOGLE_PLAY_PRODUCTS,
} from './revenuecat';

export { GOOGLE_PLAY_PRODUCTS };

export type PlanType = 'monthly' | 'yearly';

// Pricing information (for display purposes - fallback when store unavailable)
export const PRICING = {
  monthly: {
    price: 2.99,
    currency: 'USD',
    displayPrice: '$2.99/mo',
    yearlyEquivalent: 35.88,
  },
  yearly: {
    price: 23.88,
    pricePerMonth: 1.99,
    currency: 'USD',
    displayPrice: '$1.99/mo',
    displayYearlyPrice: '$23.88/year',
    savings: 12.00,
  },
} as const;

// Check if billing is supported on this device
export const isBillingSupported = async (): Promise<boolean> => {
  // RevenueCat handles this internally
  return true;
};

// Get product info from the store
export const getProducts = async () => {
  try {
    const monthly = await getProductInfo('monthly');
    const yearly = await getProductInfo('yearly');
    return [monthly, yearly].filter(Boolean);
  } catch (error) {
    console.error('Failed to get products:', error);
    return [];
  }
};

// Handle subscription purchase with optional free trial
export const handlePurchase = async (plan: PlanType, _useFreeTrialOffer: boolean = true): Promise<boolean> => {
  console.log('=== PURCHASE FLOW START ===');
  console.log('Plan selected:', plan);
  
  try {
    const result = await purchaseByPlan(plan);
    
    if (result.success) {
      console.log('=== PURCHASE SUCCESS ===');
      localStorage.setItem('jarify_premium', 'true');
      localStorage.setItem('jarify_plan', plan);
      return true;
    }
    
    return false;
  } catch (error: any) {
    console.error('Purchase failed:', error);
    
    // Handle user cancellation gracefully
    if (error.message?.includes('cancelled') || error.message?.includes('canceled')) {
      console.log('User cancelled the purchase');
      return false;
    }
    
    throw error;
  }
};

// Restore previous purchases
export const restorePurchases = async (): Promise<boolean> => {
  try {
    const result = await rcRestorePurchases();
    
    if (result.success && result.customerInfo) {
      const hasPremium = await hasActiveEntitlement();
      if (hasPremium) {
        localStorage.setItem('jarify_premium', 'true');
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    return false;
  }
};

// Open subscription management
export const manageSubscriptions = async (): Promise<void> => {
  // Fallback: open Google Play subscriptions page in browser
  window.open('https://play.google.com/store/account/subscriptions', '_blank');
};

// Check if user has active premium subscription
export const isPremiumActive = (): boolean => {
  return localStorage.getItem('jarify_premium') === 'true';
};

// Get current plan
export const getCurrentPlan = (): PlanType | null => {
  const plan = localStorage.getItem('jarify_plan');
  return plan as PlanType | null;
};
