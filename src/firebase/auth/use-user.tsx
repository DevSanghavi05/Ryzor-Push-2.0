
'use client';

import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
  useCallback,
} from 'react';
import type { User } from 'firebase/auth';
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged as onFirebaseAuthStateChanged,
  signOut as firebaseSignOut,
  UserCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { useAuth } from '@/firebase/provider';
import { setCookie, destroyCookie, parseCookies } from 'nookies';
import { useRouter, useSearchParams } from 'next/navigation';

export type AccountType = 'work' | 'personal';

export interface UserContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: (accountType?: AccountType) => Promise<UserCredential | void>;
  signOut: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<UserCredential | void>;
  signInWithEmail: (email: string, password: string) => Promise<UserCredential | void>;
  accessToken: string | null;
  workAccessToken: string | null;
  personalAccessToken: string | null;
  workProvider: 'google' | null;
  personalProvider: 'google' | null;
  fetchDriveFiles: (accountType: AccountType) => Promise<any[] | void>;
  userLoading: boolean;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// --- Cookie Helpers ---
const setAuthTokenCookie = (token: string, provider: 'google', accountType: AccountType) => {
  const cookieName = `${provider}_access_token_${accountType}`;
  setCookie(null, cookieName, token, {
    maxAge: 3600, // 1 hour
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  // Set a cookie to remember the provider for the account type
  setCookie(null, `provider_${accountType}`, provider, { maxAge: 3600 * 24 * 7, path: '/' });
};

const clearAuthTokenCookies = () => {
  destroyCookie(null, 'google_access_token_work', { path: '/' });
  destroyCookie(null, 'google_access_token_personal', { path: '/' });
  destroyCookie(null, 'provider_work', { path: '/' });
  destroyCookie(null, 'provider_personal', { path: '/' });
};


export function UserProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [accessToken, setAccessToken] = useState<string|null>(null);
  const [workAccessToken, setWorkAccessToken] = useState<string | null>(null);
  const [personalAccessToken, setPersonalAccessToken] = useState<string | null>(null);
  const [workProvider, setWorkProvider] = useState<'google' | null>(null);
  const [personalProvider, setPersonalProvider] = useState<'google' | null>(null);

  // --- Initialize state from cookies ---
  useEffect(() => {
    const cookies = parseCookies();
    setWorkAccessToken(cookies.google_access_token_work || null);
    setPersonalAccessToken(cookies.google_access_token_personal || null);
    setWorkProvider(cookies.provider_work as any || null);
    setPersonalProvider(cookies.provider_personal as any || null);
    // Set a general access token, preferring 'work' if both exist.
    setAccessToken(cookies.google_access_token_work || cookies.google_access_token_personal || null);
  }, []);
  
  // --- Listen to Auth State Changes & Handle Redirect Results ---
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onFirebaseAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (!user) {
        clearAuthTokenCookies();
        setWorkAccessToken(null);
        setPersonalAccessToken(null);
        setWorkProvider(null);
        setPersonalProvider(null);
        setAccessToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const handleSuccessfulSignIn = () => {
    const redirectUrl = searchParams.get('redirect') || '/documents';
    router.push(redirectUrl);
  }

  // --- Sign In with Google (with Drive access) ---
  const signInWithGoogle = useCallback(async (accountType: AccountType = 'personal'): Promise<UserCredential | void> => {
    if (!auth) return;

    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/drive.readonly');
    provider.addScope('https://www.googleapis.com/auth/documents.readonly');
    provider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
    provider.addScope('https://www.googleapis.com/auth/presentations.readonly');
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (credential?.accessToken) {
        const token = credential.accessToken;
        
        if (accountType === 'work') {
          setWorkAccessToken(token);
          setWorkProvider('google');
          setAuthTokenCookie(token, 'google', 'work');
        } else { // 'personal' or default
           setPersonalAccessToken(token);
           setPersonalProvider('google');
           setAuthTokenCookie(token, 'google', 'personal');
        }
        // Update general access token
        setAccessToken(token);
      }

      if (!user) setUser(result.user);
      
      handleSuccessfulSignIn();
      return result;
    } catch (error: any) {
      if (['auth/popup-blocked', 'auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(error.code)) {
        console.warn(`Google sign-in flow was interrupted: ${error.message}`);
        return;
      }
      console.error(`Error signing in with Google:`, error);
      throw error;
    }
  }, [auth, user, router, searchParams]);

  // --- Sign Up with Email/Password ---
  const signUpWithEmail = useCallback(async (email: string, password: string): Promise<UserCredential | void> => {
    if (!auth) return;
    try {
      return await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Error signing up with email:', error);
      throw error;
    }
  }, [auth]);

  // --- Sign In with Email/Password ---
  const signInWithEmail = useCallback(async (email: string, password: string): Promise<UserCredential | void> => {
    if (!auth) return;
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      // The onAuthStateChanged listener will handle setting the user and redirection
      return result;
    } catch (error: any) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  }, [auth]);

  // --- Sign Out ---
  const signOut = async () => {
    if (!auth) return;
    try {
      await firebaseSignOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // --- Fetch Cloud Files ---
  const fetchDriveFiles = useCallback(async (accountType: AccountType) => {
    if (!user) throw new Error("User is not signed in.");

    const provider = accountType === 'work' ? workProvider : personalProvider;
    const token = accountType === 'work' ? workAccessToken : personalAccessToken;
    
    if (!provider || !token) {
        return; // Silently return if this account type isn't connected
    }

    if (provider === 'google') {
        try {
            const response = await fetch(
                "https://www.googleapis.com/drive/v3/files?pageSize=100&fields=files(id,name,mimeType,modifiedTime,webViewLink,iconLink)&q=(mimeType='application/vnd.google-apps.document' or mimeType='application/vnd.google-apps.spreadsheet' or mimeType='application/vnd.google-apps.presentation' or mimeType='application/pdf' or mimeType='application/vnd.google-apps.folder')",
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.status === 401 || response.status === 403) {
                // Clear the invalid token from state and cookies
                if(accountType === 'work') {
                  setWorkAccessToken(null);
                  setWorkProvider(null);
                  destroyCookie(null, 'google_access_token_work', { path: '/' });
                  destroyCookie(null, 'provider_work', { path: '/' });
                } else {
                  setPersonalAccessToken(null);
                  setPersonalProvider(null);
                  destroyCookie(null, 'google_access_token_personal', { path: '/' });
                  destroyCookie(null, 'provider_personal', { path: '/' });
                }
                throw new Error(`Authentication token for Google ${accountType} account is invalid. Please sign in again.`);
            }
            if (!response.ok) throw new Error(`Google Drive API error: ${await response.text()}`);
            const data = await response.json();
            return data.files.map((file: any) => ({ ...file, source: 'drive', sourceProvider: 'google', accountType }));
        } catch (error) {
            console.error(`Error fetching Google Drive files for ${accountType} account:`, error);
            throw error;
        }
    }
  }, [user, workProvider, personalProvider, workAccessToken, personalAccessToken]);

  const value: UserContextValue = {
    user,
    loading,
    userLoading: loading,
    signInWithGoogle,
    signOut,
    signUpWithEmail,
    signInWithEmail,
    accessToken,
    workAccessToken,
    personalAccessToken,
    workProvider,
    personalProvider,
    fetchDriveFiles,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
