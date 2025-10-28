
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
  getAdditionalUserInfo,
  OAuthCredential,
  UserCredential,
} from 'firebase/auth';
import { useAuth } from '@/firebase/provider';
import { setCookie, destroyCookie } from 'nookies';

export interface UserContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<UserCredential | undefined>;
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

// Helper to set a cookie on the client
const setAuthTokenCookie = (token: string) => {
    // This cookie is accessible by our API routes.
    setCookie(null, 'google_access_token', token, {
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
};

const clearAuthTokenCookie = () => {
    destroyCookie(null, 'google_access_token', { path: '/' });
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
      if (!user) {
        setAccessToken(null);
        clearAuthTokenCookie();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const signInWithGoogle = async (): Promise<UserCredential | undefined> => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    // These scopes are now requested on sign-in, ensuring the access token has the right permissions.
    provider.addScope('https://www.googleapis.com/auth/drive.readonly');
    provider.addScope('https://www.googleapis.com/auth/documents.readonly');
    
    try {
      const result = await signInWithPopup(auth, provider);
      // Get the OAuth access token from the credential.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setAccessToken(credential.accessToken);
        // Store it in a cookie for API routes to use.
        setAuthTokenCookie(credential.accessToken);
      }
      // The user state is updated by the onFirebaseAuthStateChanged listener.
      return result;
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        // This is not an actual error, so we just return.
        return;
      }
      console.error('Error signing in with Google', error);
      throw error; // Re-throw for the caller to handle if needed
    }
  };

  const signInWithMicrosoft = async () => {
    if (!auth) return;
    const provider = new OAuthProvider('microsoft.com');
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
      clearAuthTokenCookie();
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

    