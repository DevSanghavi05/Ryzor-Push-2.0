'use client';
import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from 'react';
import type { User, Auth } from 'firebase/auth';
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged as onFirebaseAuthStateChanged,
} from 'firebase/auth';
import { useAuth } from '@/firebase/provider';

export interface UserContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onFirebaseAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const signInWithGoogle = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google', error);
    }
  };

  const signOut = async () => {
    if (!auth) return;
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  const value: UserContextValue = {
    user,
    loading,
    signInWithGoogle,
    signOut,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
