import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WelcomeContextType {
  hasSeenWelcome: boolean;
  completeWelcome: () => void;
}

const WelcomeContext = createContext<WelcomeContextType | undefined>(undefined);

export function WelcomeProvider({ children }: { children: ReactNode }) {
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean>(() => {
    const seen = localStorage.getItem('hasSeenWelcome');
    return seen === 'true';
  });

  const completeWelcome = () => {
    setHasSeenWelcome(true);
    localStorage.setItem('hasSeenWelcome', 'true');
  };

  return (
    <WelcomeContext.Provider value={{ hasSeenWelcome, completeWelcome }}>
      {children}
    </WelcomeContext.Provider>
  );
}

export function useWelcome() {
  const context = useContext(WelcomeContext);
  if (context === undefined) {
    throw new Error('useWelcome must be used within a WelcomeProvider');
  }
  return context;
}
