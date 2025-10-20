
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
  OAuthProvider,
  signInWithPopup,
  onAuthStateChanged as onFirebaseAuthStateChanged,
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
    const unsubscribe = onFirebaseAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // This pattern ensures we get the token from the credential on sign-in,
        // and from the user object on subsequent loads.
        const idTokenResult = await user.getIdTokenResult();
        setAccessToken(idTokenResult.token);
      } else {
        setAccessToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const signInWithGoogle = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    // Add required scopes for Drive and Docs API
    provider.addScope('https://www.googleapis.com/auth/drive.readonly');
    provider.addScope('https://www.googleapis.com/auth/documents.readonly');
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential) {
        // This gives you a Google Access Token.
        setAccessToken(credential.accessToken || null);
      }
    } catch (error) {
      console.error('Error signing in with Google', error);
    }
  };

  const signInWithMicrosoft = async () => {
    if (!auth) return;
    const provider = new OAuthProvider('microsoft.com');
    provider.addScope('Files.ReadWrite');
    try {
        const result = await signInWithPopup(auth, provider);
        const credential = OAuthProvider.credentialFromResult(result);
        if (credential) {
            setAccessToken(credential.accessToken || null);
        }
    } catch (error) {
        console.error('Error signing in with Microsoft', error);
    }
  };

  const signOut = async () => {
    if (!auth) return;
    try {
      await auth.signOut();
      setUser(null);
      setAccessToken(null);
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
