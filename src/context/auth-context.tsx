import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type MinexSession = {
  name: string;
  matricule: string;
  token: string;
};

type AuthContextValue = {
  session: MinexSession | null;
  isLoading: boolean;
  signIn: (name: string, matricule: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const SESSION_KEY = 'minex-session';
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<MinexSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync(SESSION_KEY)
      .then(value => {
        if (value) setSession(JSON.parse(value) as MinexSession);
      })
      .catch(error => console.error('Lecture de la session MINEX impossible', error))
      .finally(() => setIsLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isLoading,
      async signIn(name, matricule) {
        const newSession = {
          name: name.trim(),
          matricule: matricule.trim(),
          token: `minex-demo-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        };
        await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(newSession));
        setSession(newSession);
      },
      async signOut() {
        await SecureStore.deleteItemAsync(SESSION_KEY);
        setSession(null);
      },
    }),
    [session, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return context;
}
