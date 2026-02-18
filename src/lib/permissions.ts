// Permissions utility for voice, location, camera, etc.

export type PermissionType = 'microphone' | 'geolocation' | 'camera' | 'notifications';

interface PermissionStatus {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
  error?: string;
}

// Check permission status
export const checkPermission = async (type: PermissionType): Promise<PermissionStatus> => {
  try {
    if (type === 'microphone') {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return {
        granted: result.state === 'granted',
        denied: result.state === 'denied',
        prompt: result.state === 'prompt'
      };
    }
    
    if (type === 'geolocation') {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return {
        granted: result.state === 'granted',
        denied: result.state === 'denied',
        prompt: result.state === 'prompt'
      };
    }
    
    if (type === 'camera') {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return {
        granted: result.state === 'granted',
        denied: result.state === 'denied',
        prompt: result.state === 'prompt'
      };
    }
    
    if (type === 'notifications') {
      const permission = Notification.permission;
      return {
        granted: permission === 'granted',
        denied: permission === 'denied',
        prompt: permission === 'default'
      };
    }
    
    return { granted: false, denied: false, prompt: true };
  } catch (error) {
    console.log(`Permission check for ${type} not supported:`, error);
    return { granted: false, denied: false, prompt: true };
  }
};

// Request permission
export const requestPermission = async (type: PermissionType): Promise<boolean> => {
  try {
    if (type === 'microphone') {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    }
    
    if (type === 'camera') {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    }
    
    if (type === 'geolocation') {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false),
          { timeout: 5000 }
        );
      });
    }
    
    if (type === 'notifications') {
      const result = await Notification.requestPermission();
      return result === 'granted';
    }
    
    return false;
  } catch (error) {
    console.error(`Error requesting ${type} permission:`, error);
    return false;
  }
};

// Request all required permissions
export const requestAllPermissions = async (): Promise<Record<PermissionType, boolean>> => {
  const results: Record<PermissionType, boolean> = {
    microphone: false,
    geolocation: false,
    camera: false,
    notifications: false
  };
  
  // Request each permission
  results.microphone = await requestPermission('microphone');
  results.geolocation = await requestPermission('geolocation');
  results.camera = await requestPermission('camera');
  results.notifications = await requestPermission('notifications');
  
  return results;
};

// Check if browser supports the feature
export const isFeatureSupported = (type: PermissionType): boolean => {
  if (type === 'microphone' || type === 'camera') {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
  if (type === 'geolocation') {
    return 'geolocation' in navigator;
  }
  if (type === 'notifications') {
    return 'Notification' in window;
  }
  return false;
};
