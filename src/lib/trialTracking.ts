// Trial tracking to prevent users from re-enrolling in free trials
const TRIAL_STORAGE_KEY = 'jarify_trial_history';
const SUBSCRIPTION_STATUS_KEY = 'jarify_subscription_status';

interface TrialHistory {
  hasUsedFreeTrial: boolean;
  trialStartDate: string | null;
  trialEndDate: string | null;
  lastSubscriptionEndDate: string | null;
}

interface SubscriptionStatus {
  isActive: boolean;
  isTrial: boolean;
  expirationDate: string | null;
  cancelledDuringTrial: boolean;
}

// Get trial history from storage
export const getTrialHistory = (): TrialHistory => {
  try {
    const stored = localStorage.getItem(TRIAL_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to get trial history:', error);
  }
  return {
    hasUsedFreeTrial: false,
    trialStartDate: null,
    trialEndDate: null,
    lastSubscriptionEndDate: null,
  };
};

// Save trial history
export const saveTrialHistory = (history: TrialHistory): void => {
  try {
    localStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save trial history:', error);
  }
};

// Mark that user has used their free trial
export const markTrialUsed = (startDate: Date, endDate: Date): void => {
  const history = getTrialHistory();
  history.hasUsedFreeTrial = true;
  history.trialStartDate = startDate.toISOString();
  history.trialEndDate = endDate.toISOString();
  saveTrialHistory(history);
};

// Check if user has already used their free trial
export const hasUsedFreeTrial = (): boolean => {
  return getTrialHistory().hasUsedFreeTrial;
};

// Get subscription status
export const getSubscriptionStatus = (): SubscriptionStatus => {
  try {
    const stored = localStorage.getItem(SUBSCRIPTION_STATUS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to get subscription status:', error);
  }
  return {
    isActive: false,
    isTrial: false,
    expirationDate: null,
    cancelledDuringTrial: false,
  };
};

// Save subscription status
export const saveSubscriptionStatus = (status: SubscriptionStatus): void => {
  try {
    localStorage.setItem(SUBSCRIPTION_STATUS_KEY, JSON.stringify(status));
  } catch (error) {
    console.error('Failed to save subscription status:', error);
  }
};

// Update subscription status when subscription changes
export const updateSubscriptionStatus = (
  isActive: boolean,
  isTrial: boolean,
  expirationDate: Date | null,
  cancelledDuringTrial: boolean = false
): void => {
  const status: SubscriptionStatus = {
    isActive,
    isTrial,
    expirationDate: expirationDate?.toISOString() || null,
    cancelledDuringTrial,
  };
  saveSubscriptionStatus(status);
  
  // If starting a trial, mark it as used
  if (isTrial && expirationDate) {
    const history = getTrialHistory();
    if (!history.hasUsedFreeTrial) {
      markTrialUsed(new Date(), expirationDate);
    }
  }
  
  // Track when subscription ends
  if (!isActive && expirationDate) {
    const history = getTrialHistory();
    history.lastSubscriptionEndDate = new Date().toISOString();
    saveTrialHistory(history);
  }
};

// Check if subscription has expired (trial ended or subscription not renewed)
export const hasSubscriptionExpired = (): boolean => {
  const status = getSubscriptionStatus();
  
  // If no subscription status, check if they've used trial before
  if (!status.expirationDate) {
    return false;
  }
  
  const expirationDate = new Date(status.expirationDate);
  const now = new Date();
  
  // If expiration date is in the past and not active, subscription has expired
  return expirationDate < now && !status.isActive;
};

// Check if user should see paywall (expired trial/subscription)
export const shouldShowPaywall = (): boolean => {
  const status = getSubscriptionStatus();
  const history = getTrialHistory();
  
  // If subscription is active, don't show paywall
  if (status.isActive) {
    return false;
  }
  
  // If user has used free trial and it's expired, show paywall
  if (history.hasUsedFreeTrial && hasSubscriptionExpired()) {
    return true;
  }
  
  // If user cancelled during trial, show paywall after trial ends
  if (status.cancelledDuringTrial && hasSubscriptionExpired()) {
    return true;
  }
  
  return false;
};

// Check if user can enroll in free trial
export const canEnrollInFreeTrial = (): boolean => {
  const history = getTrialHistory();
  return !history.hasUsedFreeTrial;
};

// Clear all trial/subscription data (for testing)
export const clearTrialData = (): void => {
  localStorage.removeItem(TRIAL_STORAGE_KEY);
  localStorage.removeItem(SUBSCRIPTION_STATUS_KEY);
};
