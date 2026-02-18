import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const hapticFeedback = {
  // Light tap - for selections, toggles
  light: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      console.log('Haptics not available');
    }
  },

  // Medium tap - for button presses, navigation
  medium: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      console.log('Haptics not available');
    }
  },

  // Heavy tap - for important actions, confirmations
  heavy: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {
      console.log('Haptics not available');
    }
  },

  // Success - for goal completion, successful transactions
  success: async () => {
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (error) {
      console.log('Haptics not available');
    }
  },

  // Warning - for alerts, limits reached
  warning: async () => {
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (error) {
      console.log('Haptics not available');
    }
  },

  // Error - for errors, failed actions
  error: async () => {
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (error) {
      console.log('Haptics not available');
    }
  },

  // Custom patterns for specific actions
  jarCreated: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
      setTimeout(async () => {
        await Haptics.impact({ style: ImpactStyle.Light });
      }, 100);
    } catch (error) {
      console.log('Haptics not available');
    }
  },

  moneyAdded: async () => {
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (error) {
      console.log('Haptics not available');
    }
  },

  moneyWithdrawn: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {
      console.log('Haptics not available');
    }
  },

  goalCompleted: async () => {
    try {
      await Haptics.notification({ type: NotificationType.Success });
      setTimeout(async () => {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      }, 150);
      setTimeout(async () => {
        await Haptics.impact({ style: ImpactStyle.Medium });
      }, 300);
    } catch (error) {
      console.log('Haptics not available');
    }
  },
};
