import { SocialLogin } from '@capgo/capacitor-social-login';

const WEB_CLIENT_ID = '467764265978-hupkmmhkn56t71cs1u5mm2p173922408.apps.googleusercontent.com';

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  givenName: string;
  familyName: string;
  imageUrl: string;
  idToken: string | null;
  accessToken: string | null;
}

const GOOGLE_USER_KEY = 'jarify_google_user';

export const initializeGoogleAuth = async (): Promise<boolean> => {
  try {
    await SocialLogin.initialize({
      google: {
        webClientId: WEB_CLIENT_ID,
      },
    });
    console.log('Google Auth initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Google Auth:', error);
    return false;
  }
};

export const signInWithGoogle = async (): Promise<GoogleUser | null> => {
  try {
    await initializeGoogleAuth();

    const result = await SocialLogin.login({
      provider: 'google',
      options: {
        scopes: [
          'email',
          'profile',
          'openid',
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/drive.appdata',
        ],
      },
    });

    console.log('Google Sign-In result:', result);

    if (result?.result) {
      const profile = (result.result as any).profile;
      const credential = (result.result as any).credential;

      const user: GoogleUser = {
        id: profile?.id || '',
        email: profile?.email || '',
        name: profile?.name || '',
        givenName: profile?.givenName || profile?.given_name || '',
        familyName: profile?.familyName || profile?.family_name || '',
        imageUrl: profile?.imageUrl || profile?.picture || '',
        idToken: credential?.idToken || null,
        accessToken: credential?.accessToken || null,
      };

      // Save user to localStorage
      localStorage.setItem(GOOGLE_USER_KEY, JSON.stringify(user));
      console.log('Google user signed in:', user.email);
      return user;
    }

    return null;
  } catch (error) {
    console.error('Google Sign-In error:', error);
    return null;
  }
};

export const signOutGoogle = async (): Promise<boolean> => {
  try {
    await SocialLogin.logout({ provider: 'google' });
    localStorage.removeItem(GOOGLE_USER_KEY);
    console.log('Google user signed out');
    return true;
  } catch (error) {
    console.error('Google Sign-Out error:', error);
    localStorage.removeItem(GOOGLE_USER_KEY);
    return true;
  }
};

export const getStoredGoogleUser = (): GoogleUser | null => {
  try {
    const stored = localStorage.getItem(GOOGLE_USER_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  } catch {
    return null;
  }
};

export const isGoogleSignedIn = (): boolean => {
  return getStoredGoogleUser() !== null;
};
