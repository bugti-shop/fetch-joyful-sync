import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  GoogleUser,
  signInWithGoogle,
  signOutGoogle,
  getStoredGoogleUser,
} from '@/lib/googleAuth';
import { useToast } from '@/hooks/use-toast';

interface GoogleAuthContextType {
  user: GoogleUser | null;
  isSignedIn: boolean;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

export const GoogleAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const stored = getStoredGoogleUser();
    if (stored) {
      setUser(stored);
    }
  }, []);

  const signIn = useCallback(async () => {
    try {
      setIsLoading(true);
      const googleUser = await signInWithGoogle();
      if (googleUser) {
        setUser(googleUser);
        toast({
          title: 'Signed In',
          description: `Welcome, ${googleUser.givenName || googleUser.name}!`,
        });
      } else {
        toast({
          title: 'Sign-In Cancelled',
          description: 'Google sign-in was cancelled or failed.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      toast({
        title: 'Sign-In Failed',
        description: 'Unable to sign in with Google. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      await signOutGoogle();
      setUser(null);
      toast({
        title: 'Signed Out',
        description: 'You have been signed out.',
      });
    } catch (error) {
      console.error('Sign-out error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return (
    <GoogleAuthContext.Provider
      value={{
        user,
        isSignedIn: !!user,
        isLoading,
        signIn,
        signOut,
      }}
    >
      {children}
    </GoogleAuthContext.Provider>
  );
};

export const useGoogleAuth = () => {
  const context = useContext(GoogleAuthContext);
  if (!context) {
    throw new Error('useGoogleAuth must be used within GoogleAuthProvider');
  }
  return context;
};
