'use client';
import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from 'react';
import type { User } from 'firebase/auth';
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  onAuthStateChanged as onFirebaseAuthStateChanged,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { useAuth } from '@/firebase/provider';

export interface UserContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  signOut: () => Promise<void>;
  accessToken: string | null;
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
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    // This effect only manages the user's login state with Firebase.
    // The OAuth access token is handled separately during the sign-in flow.
    const unsubscribe = onFirebaseAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const idToken = await user.getIdToken();
        setAccessToken(idToken);
      } else {
        // Clear access token on sign out
        setAccessToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const signInWithGoogle = async () => {
    if (!auth) return;
    // Scopes for Drive are no longer needed here, they are handled
    // by the dedicated server-side sync flow.
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // The user state will be updated by the onFirebaseAuthStateChanged listener
    } catch (error: any) {
      // Don't log an error if the user simply closes the popup.
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        return;
      }
      console.error('Error signing in with Google', error);
    }
  };

  const signInWithMicrosoft = async () => {
    if (!auth) return;
    const provider = new OAuthProvider('microsoft.com');
    // Add scopes if necessary for Microsoft services
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Microsoft', error);
    }
  };

  const signOut = async () => {
    if (!auth) return;
    try {
      await firebaseSignOut(auth);
      // User state will be cleared by onFirebaseAuthStateChanged listener
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  const value: UserContextValue = {
    user,
    loading,
    signInWithGoogle,
    signInWithMicrosoft,
    signOut,
    accessToken,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
