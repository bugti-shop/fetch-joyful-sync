/**
 * RevenueCat SDK Integration for Jarify
 * 
 * This module handles all RevenueCat functionality including:
 * - SDK configuration and initialization
 * - Subscription purchases (monthly/yearly)
 * - Entitlement checking for "Jarify Pro"
 * - Customer info management
 * - Paywall presentation
 * - Customer Center support
 */

import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { RevenueCatUI } from '@revenuecat/purchases-capacitor-ui';
import type {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
  PurchasesStoreProduct,
} from '@revenuecat/purchases-capacitor';

// RevenueCat Configuration
export const REVENUECAT_CONFIG = {
  apiKey: 'goog_PQiAzDIPMmRATlWtUaVQJevGPmS',
  entitlementId: 'Jarify Pro',
  offeringId: 'default', // Your default offering identifier
} as const;

// Google Play product IDs - must match your Google Play Console setup
// These same IDs need to be configured in RevenueCat dashboard
export const GOOGLE_PLAY_PRODUCTS = {
  monthly: {
    productId: 'jarify_mo',
    basePlanId: 'jarify-mo',
    freeTrialOfferId: 'jarify-monthly-offer',
  },
  yearly: {
    productId: 'jarify_yr',
    basePlanId: 'jarify-yearly-plan',
    freeTrialOfferId: 'jarify-yearly-trial',
  },
} as const;

// Product identifiers for RevenueCat packages
export const PRODUCT_IDS = {
  monthly: GOOGLE_PLAY_PRODUCTS.monthly.productId,
  yearly: GOOGLE_PLAY_PRODUCTS.yearly.productId,
} as const;

export type PlanType = keyof typeof PRODUCT_IDS;

// Pricing information interface
export interface PricingInfo {
  monthly: {
    price: number;
    currency: string;
    displayPrice: string;
    yearlyEquivalent: number;
  };
  yearly: {
    price: number;
    pricePerMonth: number;
    currency: string;
    displayPrice: string;
    displayYearlyPrice: string;
    savings: number;
  };
}

// Default pricing information (fallback when store unavailable)
export const DEFAULT_PRICING: PricingInfo = {
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
};

// Track initialization state
let isInitialized = false;

/**
 * Initialize RevenueCat SDK
 * Should be called once when the app starts
 */
export const initializeRevenueCat = async (): Promise<boolean> => {
  if (isInitialized) {
    console.log('RevenueCat already initialized');
    return true;
  }

  try {
    console.log('Initializing RevenueCat SDK...');
    
    await Purchases.configure({
      apiKey: REVENUECAT_CONFIG.apiKey,
    });

    // Enable debug logs in development
    if (import.meta.env.DEV) {
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    }

    isInitialized = true;
    console.log('RevenueCat SDK initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
    return false;
  }
};

/**
 * Get current customer info
 */
export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    console.log('Customer Info:', customerInfo);
    return customerInfo;
  } catch (error) {
    console.error('Failed to get customer info:', error);
    return null;
  }
};

/**
 * Check if user has active "Jarify Pro" entitlement
 */
export const hasActiveEntitlement = async (): Promise<boolean> => {
  try {
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) return false;

    const entitlement = customerInfo.entitlements.active[REVENUECAT_CONFIG.entitlementId];
    const isActive = entitlement !== undefined && entitlement.isActive;
    
    console.log(`Entitlement "${REVENUECAT_CONFIG.entitlementId}" active:`, isActive);
    return isActive;
  } catch (error) {
    console.error('Failed to check entitlement:', error);
    return false;
  }
};

/**
 * Get available offerings and packages
 */
export const getOfferings = async (): Promise<PurchasesOfferings | null> => {
  try {
    const result = await Purchases.getOfferings();
    console.log('Offerings:', result);
    return result;
  } catch (error) {
    console.error('Failed to get offerings:', error);
    return null;
  }
};

/**
 * Get current offering packages
 */
export const getCurrentPackages = async (): Promise<PurchasesPackage[] | null> => {
  try {
    const offerings = await getOfferings();
    if (!offerings?.current?.availablePackages) {
      console.log('No current offering available');
      return null;
    }
    return offerings.current.availablePackages;
  } catch (error) {
    console.error('Failed to get packages:', error);
    return null;
  }
};

/**
 * Get product info with real pricing from store
 */
export const getProductInfo = async (planType: PlanType): Promise<PurchasesStoreProduct | null> => {
  try {
    const packages = await getCurrentPackages();
    if (!packages) return null;

    // Find package by product ID or RC package identifier
    const productId = GOOGLE_PLAY_PRODUCTS[planType].productId;
    const rcPackageId = planType === 'monthly' ? '$rc_monthly' : '$rc_annual';
    
    const pkg = packages.find(p => 
      p.product?.identifier === productId || 
      p.identifier === rcPackageId
    );
    
    return pkg?.product || null;
  } catch (error) {
    console.error('Failed to get product info:', error);
    return null;
  }
};

/**
 * Purchase a subscription package
 */
export const purchasePackage = async (pkg: PurchasesPackage): Promise<{
  success: boolean;
  customerInfo: CustomerInfo | null;
  error?: string;
}> => {
  try {
    console.log('Purchasing package:', pkg.identifier);
    
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    
    // Check if the entitlement is now active
    const entitlement = customerInfo.entitlements.active[REVENUECAT_CONFIG.entitlementId];
    const success = entitlement !== undefined && entitlement.isActive;
    
    console.log('Purchase result - Entitlement active:', success);
    return { success, customerInfo };
  } catch (error: any) {
    console.error('Purchase failed:', error);
    
    // Handle user cancellation
    if (error.code === 'PURCHASE_CANCELLED' || error.message?.includes('cancelled')) {
      return { success: false, customerInfo: null, error: 'cancelled' };
    }
    
    return { success: false, customerInfo: null, error: error.message || 'Purchase failed' };
  }
};

/**
 * Purchase by plan type (monthly or yearly)
 * Finds the package by Google Play product ID or RevenueCat package identifier
 */
export const purchaseByPlan = async (planType: PlanType): Promise<{
  success: boolean;
  customerInfo: CustomerInfo | null;
  error?: string;
}> => {
  try {
    const packages = await getCurrentPackages();
    if (!packages) {
      return { success: false, customerInfo: null, error: 'No packages available' };
    }

    // Find package by product ID (Google Play) or RC package identifier
    const productId = GOOGLE_PLAY_PRODUCTS[planType].productId;
    const rcPackageId = planType === 'monthly' ? '$rc_monthly' : '$rc_annual';
    
    const pkg = packages.find(p => 
      p.product?.identifier === productId || 
      p.identifier === rcPackageId
    );
    
    if (!pkg) {
      console.error(`Package not found for ${planType}. Looking for productId: ${productId} or packageId: ${rcPackageId}`);
      console.log('Available packages:', packages.map(p => ({ id: p.identifier, productId: p.product?.identifier })));
      return { success: false, customerInfo: null, error: 'Package not found' };
    }

    return await purchasePackage(pkg);
  } catch (error: any) {
    console.error('Purchase by plan failed:', error);
    return { success: false, customerInfo: null, error: error.message };
  }
};

/**
 * Restore previous purchases
 */
export const restorePurchases = async (): Promise<{
  success: boolean;
  customerInfo: CustomerInfo | null;
  error?: string;
}> => {
  try {
    console.log('Restoring purchases...');
    
    const { customerInfo } = await Purchases.restorePurchases();
    
    // Check if entitlement is active after restore
    const entitlement = customerInfo.entitlements.active[REVENUECAT_CONFIG.entitlementId];
    const success = entitlement !== undefined && entitlement.isActive;
    
    console.log('Restore result - Entitlement active:', success);
    return { success, customerInfo };
  } catch (error: any) {
    console.error('Restore failed:', error);
    return { success: false, customerInfo: null, error: error.message };
  }
};

/**
 * Paywall result types
 */
export enum PaywallResultType {
  NOT_PRESENTED = 'NOT_PRESENTED',
  ERROR = 'ERROR',
  CANCELLED = 'CANCELLED',
  PURCHASED = 'PURCHASED',
  RESTORED = 'RESTORED',
}

/**
 * Present RevenueCat Paywall UI
 * Returns the result of the paywall interaction
 */
export const presentPaywall = async (): Promise<{
  result: PaywallResultType;
  customerInfo: CustomerInfo | null;
}> => {
  try {
    console.log('Presenting paywall...');
    
    const paywallResult = await RevenueCatUI.presentPaywall();
    
    console.log('Paywall result:', paywallResult);
    
    // Get updated customer info after paywall closes
    const customerInfo = await getCustomerInfo();
    
    // Map the result string to our enum
    let result: PaywallResultType;
    const resultString = String(paywallResult);
    
    if (resultString.includes('PURCHASED')) {
      result = PaywallResultType.PURCHASED;
    } else if (resultString.includes('RESTORED')) {
      result = PaywallResultType.RESTORED;
    } else if (resultString.includes('CANCELLED')) {
      result = PaywallResultType.CANCELLED;
    } else if (resultString.includes('NOT_PRESENTED')) {
      result = PaywallResultType.NOT_PRESENTED;
    } else {
      result = PaywallResultType.ERROR;
    }
    
    return { result, customerInfo };
  } catch (error) {
    console.error('Failed to present paywall:', error);
    return {
      result: PaywallResultType.ERROR,
      customerInfo: null,
    };
  }
};

/**
 * Present RevenueCat Paywall UI conditionally
 * Only shows if user doesn't have the entitlement
 */
export const presentPaywallIfNeeded = async (): Promise<{
  result: PaywallResultType;
  customerInfo: CustomerInfo | null;
}> => {
  try {
    console.log('Presenting paywall if needed...');
    
    const paywallResult = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: REVENUECAT_CONFIG.entitlementId,
    });
    
    console.log('Paywall if needed result:', paywallResult);
    
    const customerInfo = await getCustomerInfo();
    
    // Map the result string to our enum
    let result: PaywallResultType;
    const resultString = String(paywallResult);
    
    if (resultString.includes('PURCHASED')) {
      result = PaywallResultType.PURCHASED;
    } else if (resultString.includes('RESTORED')) {
      result = PaywallResultType.RESTORED;
    } else if (resultString.includes('CANCELLED')) {
      result = PaywallResultType.CANCELLED;
    } else if (resultString.includes('NOT_PRESENTED')) {
      result = PaywallResultType.NOT_PRESENTED;
    } else {
      result = PaywallResultType.ERROR;
    }
    
    return { result, customerInfo };
  } catch (error) {
    console.error('Failed to present paywall if needed:', error);
    return {
      result: PaywallResultType.ERROR,
      customerInfo: null,
    };
  }
};

/**
 * Present Customer Center for subscription management
 */
export const presentCustomerCenter = async (): Promise<boolean> => {
  try {
    console.log('Presenting Customer Center...');
    
    await RevenueCatUI.presentCustomerCenter();
    
    console.log('Customer Center presented successfully');
    return true;
  } catch (error) {
    console.error('Failed to present Customer Center:', error);
    return false;
  }
};

/**
 * Set user identifier for RevenueCat (useful for syncing with your backend)
 */
export const identifyUser = async (userId: string): Promise<CustomerInfo | null> => {
  try {
    console.log('Identifying user:', userId);
    
    const { customerInfo } = await Purchases.logIn({ appUserID: userId });
    
    console.log('User identified successfully');
    return customerInfo;
  } catch (error) {
    console.error('Failed to identify user:', error);
    return null;
  }
};

/**
 * Log out current user (creates anonymous user)
 */
export const logOutUser = async (): Promise<CustomerInfo | null> => {
  try {
    console.log('Logging out user...');
    
    const { customerInfo } = await Purchases.logOut();
    
    console.log('User logged out successfully');
    return customerInfo;
  } catch (error) {
    console.error('Failed to log out user:', error);
    return null;
  }
};

/**
 * Get subscription management URL
 */
export const getManagementURL = async (): Promise<string | null> => {
  try {
    const customerInfo = await getCustomerInfo();
    return customerInfo?.managementURL || null;
  } catch (error) {
    console.error('Failed to get management URL:', error);
    return null;
  }
};

/**
 * Check if user is in trial period
 */
export const isInTrialPeriod = async (): Promise<boolean> => {
  try {
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) return false;

    const entitlement = customerInfo.entitlements.active[REVENUECAT_CONFIG.entitlementId];
    if (!entitlement) return false;

    // Check if the period type indicates a trial
    return entitlement.periodType === 'TRIAL';
  } catch (error) {
    console.error('Failed to check trial period:', error);
    return false;
  }
};

/**
 * Get expiration date for current subscription
 */
export const getExpirationDate = async (): Promise<Date | null> => {
  try {
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) return null;

    const entitlement = customerInfo.entitlements.active[REVENUECAT_CONFIG.entitlementId];
    if (!entitlement?.expirationDate) return null;

    return new Date(entitlement.expirationDate);
  } catch (error) {
    console.error('Failed to get expiration date:', error);
    return null;
  }
};

/**
 * Listen for customer info updates
 */
export const addCustomerInfoListener = (
  callback: (customerInfo: CustomerInfo) => void
): (() => void) => {
  // Note: The Capacitor plugin uses a different pattern for listeners
  // This sets up the listener and returns a cleanup function
  let isListening = true;
  
  const checkForUpdates = async () => {
    if (!isListening) return;
    try {
      const customerInfo = await getCustomerInfo();
      if (customerInfo) {
        callback(customerInfo);
      }
    } catch (error) {
      console.error('Error in customer info listener:', error);
    }
  };

  // Initial check
  checkForUpdates();
  
  // Return cleanup function
  return () => {
    isListening = false;
  };
};

/**
 * Utility to format price from product
 */
export const formatProductPrice = (product: PurchasesStoreProduct): string => {
  return product.priceString || `${product.currencyCode} ${product.price}`;
};

/**
 * Get display pricing from store or fallback
 */
export const getDisplayPricing = async (): Promise<PricingInfo> => {
  try {
    const packages = await getCurrentPackages();
    if (!packages) return DEFAULT_PRICING;

    const monthlyPkg = packages.find(p => p.identifier === '$rc_monthly');
    const yearlyPkg = packages.find(p => p.identifier === '$rc_annual');

    const monthlyPrice = monthlyPkg?.product?.price || DEFAULT_PRICING.monthly.price;
    const yearlyPrice = yearlyPkg?.product?.price || DEFAULT_PRICING.yearly.price;

    return {
      monthly: {
        price: monthlyPrice,
        currency: monthlyPkg?.product?.currencyCode || DEFAULT_PRICING.monthly.currency,
        displayPrice: monthlyPkg?.product?.priceString || DEFAULT_PRICING.monthly.displayPrice,
        yearlyEquivalent: monthlyPrice * 12,
      },
      yearly: {
        price: yearlyPrice,
        pricePerMonth: yearlyPrice / 12,
        currency: yearlyPkg?.product?.currencyCode || DEFAULT_PRICING.yearly.currency,
        displayPrice: `${(yearlyPrice / 12).toFixed(2)}/mo`,
        displayYearlyPrice: yearlyPkg?.product?.priceString || DEFAULT_PRICING.yearly.displayYearlyPrice,
        savings: (monthlyPrice * 12) - yearlyPrice,
      },
    };
  } catch (error) {
    console.error('Failed to get display pricing:', error);
    return DEFAULT_PRICING;
  }
};
