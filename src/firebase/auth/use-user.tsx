
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
  OAuthProvider,
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
  signInWithGoogle: (accountType: AccountType) => Promise<UserCredential | void>;
  signInWithMicrosoft: (accountType: AccountType) => Promise<UserCredential | void>;
  signOut: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<UserCredential | void>;
  signInWithEmail: (email: string, password: string) => Promise<UserCredential | void>;
  workAccessToken: string | null;
  personalAccessToken: string | null;
  workProvider: 'google' | 'microsoft' | null;
  personalProvider: 'google' | 'microsoft' | null;
  fetchDriveFiles: (accountType: AccountType) => Promise<any[] | void>;
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
const setAuthTokenCookie = (token: string, provider: 'google' | 'microsoft', accountType: AccountType) => {
  const cookieName = `${provider}_access_token_${accountType}`;
  setCookie(null, cookieName, token, {
    maxAge: 3600, // 1 hour
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  // Set a cookie to remember the provider for the account type
  setCookie(null, `provider_${accountType}`, provider, { maxAge: 3600, path: '/' });
};

const clearAuthTokenCookies = () => {
  destroyCookie(null, 'google_access_token_work', { path: '/' });
  destroyCookie(null, 'google_access_token_personal', { path: '/' });
  destroyCookie(null, 'microsoft_access_token_work', { path: '/' });
  destroyCookie(null, 'microsoft_access_token_personal', { path: '/' });
  destroyCookie(null, 'provider_work', { path: '/' });
  destroyCookie(null, 'provider_personal', { path: '/' });
};


export function UserProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [workAccessToken, setWorkAccessToken] = useState<string | null>(null);
  const [personalAccessToken, setPersonalAccessToken] = useState<string | null>(null);
  const [workProvider, setWorkProvider] = useState<'google' | 'microsoft' | null>(null);
  const [personalProvider, setPersonalProvider] = useState<'google' | 'microsoft' | null>(null);

  // --- Initialize state from cookies ---
  useEffect(() => {
    const cookies = parseCookies();
    setWorkAccessToken(cookies.google_access_token_work || cookies.microsoft_access_token_work || null);
    setPersonalAccessToken(cookies.google_access_token_personal || cookies.microsoft_access_token_personal || null);
    setWorkProvider(cookies.provider_work as any || null);
    setPersonalProvider(cookies.provider_personal as any || null);
  }, []);
  
  // --- Listen to Auth State ---
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onFirebaseAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (!user) {
        setWorkAccessToken(null);
        setPersonalAccessToken(null);
        setWorkProvider(null);
        setPersonalProvider(null);
        clearAuthTokenCookies();
      }
      // State from cookies is already initialized, no need to re-read here
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const handleSuccessfulSignIn = () => {
    const redirectUrl = searchParams.get('redirect') || '/';
    router.push(redirectUrl);
  }

  // --- Sign In with Google (with Drive access) ---
  const signInWithGoogle = useCallback(async (accountType: AccountType): Promise<UserCredential | void> => {
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
        } else {
          setPersonalAccessToken(token);
          setPersonalProvider('google');
        }
        setAuthTokenCookie(token, 'google', accountType);
      }
      if (!user) setUser(result.user);
      handleSuccessfulSignIn();
      return result;
    } catch (error: any) {
      if (['auth/popup-blocked', 'auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(error.code)) {
        console.warn(`Google sign-in flow for ${accountType} account was interrupted: ${error.message}`);
        return;
      }
      console.error(`Error signing in with Google for ${accountType} account:`, error);
      throw error;
    }
  }, [auth, user, router, searchParams]);

  // --- Sign In with Microsoft (with OneDrive/365 access) ---
  const signInWithMicrosoft = useCallback(async (accountType: AccountType): Promise<UserCredential | void> => {
    if (!auth) return;
    const provider = new OAuthProvider('microsoft.com');
    
    provider.addScope('Files.Read.All');
    provider.addScope('User.Read');
    provider.setCustomParameters({ tenant: 'edb93353-33cc-4551-a2f5-170be96d8b9d' });
    
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = OAuthProvider.credentialFromResult(result);

      if (credential?.accessToken) {
        const token = credential.accessToken;
        if (accountType === 'work') {
          setWorkAccessToken(token);
          setWorkProvider('microsoft');
        } else {
          setPersonalAccessToken(token);
          setPersonalProvider('microsoft');
        }
        setAuthTokenCookie(token, 'microsoft', accountType);
      }
      
      if (!user) setUser(result.user);
      handleSuccessfulSignIn();
      return result;
    } catch (error: any) {
       if (['auth/popup-blocked', 'auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(error.code)) {
        console.warn(`Microsoft sign-in flow for ${accountType} account was interrupted: ${error.message}`);
        return;
      }
      console.error('Error signing in with Microsoft:', error);
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
      return await signInWithEmailAndPassword(auth, email, password);
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

    const cookies = parseCookies();
    const provider = cookies[`provider_${accountType}`];
    const token = cookies[`${provider}_access_token_${accountType}`];

    if (!provider || !token) {
        // Silently return if this account type isn't connected
        return;
    }

    if (provider === 'google') {
        try {
            const response = await fetch(
                "https://www.googleapis.com/drive/v3/files?pageSize=50&fields=files(id,name,mimeType,modifiedTime,webViewLink,iconLink)&q=(mimeType='application/vnd.google-apps.document' or mimeType='application/vnd.google-apps.spreadsheet' or mimeType='application/vnd.google-apps.presentation' or mimeType='application/pdf')",
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.status === 401) {
                destroyCookie(null, `google_access_token_${accountType}`, { path: '/' });
                destroyCookie(null, `provider_${accountType}`, { path: '/' });
                throw new Error(`Authentication token for Google ${accountType} account is invalid. Please sign in again.`);
            }
            if (!response.ok) throw new Error(await response.text());
            const data = await response.json();
            return data.files.map((file: any) => ({ ...file, source: 'drive', sourceProvider: 'google' }));
        } catch (error) {
            console.error(`Error fetching Google Drive files for ${accountType} account:`, error);
            throw error;
        }
    } else if (provider === 'microsoft') {
        try {
            const response = await fetch(
                "https://graph.microsoft.com/v1.0/me/drive/root/children",
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.status === 401) {
                 destroyCookie(null, `microsoft_access_token_${accountType}`, { path: '/' });
                 destroyCookie(null, `provider_${accountType}`, { path: '/' });
                throw new Error(`Authentication token for Microsoft ${accountType} account is invalid. Please sign in again.`);
            }
            if (!response.ok) throw new Error(await response.text());
            const data = await response.json();
            return data.value.map((file: any) => ({
                id: file.id,
                name: file.name,
                mimeType: file.file.mimeType,
                modifiedTime: file.lastModifiedDateTime,
                webViewLink: file.webUrl,
                source: 'drive',
                sourceProvider: 'microsoft',
                accountType: accountType,
            }));
        } catch (error) {
            console.error(`Error fetching OneDrive files for ${accountType} account:`, error);
            throw error;
        }
    }
  }, [user]);

  const value: UserContextValue = {
    user,
    loading,
    signInWithGoogle,
    signInWithMicrosoft,
    signOut,
    signUpWithEmail,
    signInWithEmail,
    workAccessToken,
    personalAccessToken,
    workProvider,
    personalProvider,
    fetchDriveFiles,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
