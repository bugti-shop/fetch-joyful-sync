import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jarify.app',
  appName: 'Jarify',
  webDir: 'dist',
  server: {
    cleartext: true
  }
};

export default config;
