import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jarify.app',
  appName: 'Jarify',
  webDir: 'dist',
  server: {
    cleartext: true
  },
  plugins: {
    SocialLogin: {
      providers: {
        google: true,
        apple: false,
        facebook: false,
      },
      google: {
        webClientId: '467764265978-hupkmmhkn56t71cs1u5mm2p173922408.apps.googleusercontent.com',
      },
    },
  },
};

export default config;
