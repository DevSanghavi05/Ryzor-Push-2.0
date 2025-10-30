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
};

const clearAuthTokenCookies = () => {
  destroyCookie(null, 'google_access_token_work', { path: '/' });
  destroyCookie(null, 'google_access_token_personal', { path: '/' });
  destroyCookie(null, 'microsoft_access_token_work', { path: '/' });
  destroyCookie(null, 'microsoft_access_token_personal', { path: '/' });
};


export function UserProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [workAccessToken, setWorkAccessToken] = useState<string | null>(() => {
    const cookies = parseCookies();
    return cookies.google_access_token_work || cookies.microsoft_access_token_work || null;
  });
  const [personalAccessToken, setPersonalAccessToken] = useState<string | null>(() => {
    const cookies = parseCookies();
    return cookies.google_access_token_personal || cookies.microsoft_access_token_personal || null;
  });

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
        clearAuthTokenCookies();
      } else {
        const cookies = parseCookies();
        if (cookies.google_access_token_work && !workAccessToken) {
          setWorkAccessToken(cookies.google_access_token_work);
        }
         if (cookies.microsoft_access_token_work && !workAccessToken) {
          setWorkAccessToken(cookies.microsoft_access_token_work);
        }
        if (cookies.google_access_token_personal && !personalAccessToken) {
          setPersonalAccessToken(cookies.google_access_token_personal);
        }
         if (cookies.microsoft_access_token_personal && !personalAccessToken) {
          setPersonalAccessToken(cookies.microsoft_access_token_personal);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, workAccessToken, personalAccessToken]);

  const handleSuccessfulSignIn = () => {
    const redirectUrl = searchParams.get('redirect') || '/';
    router.push(redirectUrl);
  }

  // --- Sign In with Google (with Drive access) ---
  const signInWithGoogle = useCallback(async (accountType: AccountType): Promise<UserCredential | void> => {
    if (!auth) {
      return;
    }

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
        } else {
          setPersonalAccessToken(token);
        }
        setAuthTokenCookie(token, 'google', accountType);
      }
      // If this is the first sign-in, set the primary user object
      if (!user) {
        setUser(result.user);
      }
      handleSuccessfulSignIn();
      return result;
    } catch (error: any) {
      if (
        error.code === 'auth/popup-blocked' ||
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/cancelled-popup-request'
      ) {
        console.warn(`Sign-in flow for ${accountType} account was interrupted: ${error.message}`);
        return; // Do not re-throw, just exit.
      }
      console.error(`Error signing in with Google for ${accountType} account:`, error);
      throw error; // Re-throw other errors
    }
  }, [auth, user, router, searchParams]);

  // --- Sign In with Microsoft (with OneDrive/365 access) ---
  const signInWithMicrosoft = useCallback(async (accountType: AccountType): Promise<UserCredential | void> => {
    if (!auth) return;
    const provider = new OAuthProvider('microsoft.com');
    
    // Add scopes for Microsoft Graph API
    provider.addScope('Files.Read.All');
    provider.addScope('User.Read');
    provider.addScope('Mail.Read');
    provider.addScope('Calendars.Read');

    // Set the tenant ID for the authentication request
    provider.setCustomParameters({
      tenant: 'edb93353-33cc-4551-a2f5-170be96d8b9d',
    });
    
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = OAuthProvider.credentialFromResult(result);

      if (credential?.accessToken) {
        const token = credential.accessToken;
        if (accountType === 'work') {
          setWorkAccessToken(token);
        } else {
          setPersonalAccessToken(token);
        }
        setAuthTokenCookie(token, 'microsoft', accountType);
      }
      
      if (!user) {
        setUser(result.user);
      }
      handleSuccessfulSignIn();
      return result;
    } catch (error: any) {
      if (
        error.code === 'auth/popup-blocked' ||
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/cancelled-popup-request'
      ) {
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
      const result = await createUserWithEmailAndPassword(auth, email, password);
      // The onAuthStateChanged listener will handle setting the user and redirection
      return result;
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
      // State and cookies are cleared by the onAuthStateChanged listener
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // --- Fetch Google Drive Files ---
  const fetchDriveFiles = useCallback(async (accountType: AccountType) => {
    const cookies = parseCookies();
    const googleToken = cookies[`google_access_token_${accountType}`];
    const microsoftToken = cookies[`microsoft_access_token_${accountType}`];

    // Determine which token to use, preferring Google for now as Drive is implemented
    let currentToken = googleToken || microsoftToken || null;
    let providerName = googleToken ? 'Google' : (microsoftToken ? 'Microsoft' : null);

    if (!user) {
        throw new Error("User is not signed in.");
    }

    if (!currentToken) {
        console.log(`Authentication token for ${accountType} account is missing.`);
        // Don't throw error, just return nothing, as user might not have connected this account type.
        return;
    }

    // Determine which provider to fetch from
    if (googleToken) {
        try {
            const response = await fetch(
                "https://www.googleapis.com/drive/v3/files?pageSize=50&fields=files(id,name,mimeType,modifiedTime,webViewLink,iconLink)&q=(mimeType='application/vnd.google-apps.document' or mimeType='application/vnd.google-apps.spreadsheet' or mimeType='application/vnd.google-apps.presentation' or mimeType='application/pdf')",
                { headers: { Authorization: `Bearer ${googleToken}` } }
            );

            if (response.status === 401) {
                if (accountType === 'work') setWorkAccessToken(null); else setPersonalAccessToken(null);
                destroyCookie(null, `google_access_token_${accountType}`, { path: '/' });
                throw new Error(`Authentication token for Google ${accountType} account is invalid. Please sign in again to refresh it.`);
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to fetch Google Drive files for ${accountType} account: ${errorData.error?.message || 'Unknown error'}`);
            }
            const data = await response.json();
            return data.files;
        } catch (error) {
            console.error(`Error fetching Google Drive files for ${accountType} account:`, error);
            throw error;
        }
    } else if (microsoftToken) {
        try {
            const response = await fetch(
                "https://graph.microsoft.com/v1.0/me/drive/root/children",
                { headers: { Authorization: `Bearer ${microsoftToken}` } }
            );

            if (response.status === 401) {
                if (accountType === 'work') setWorkAccessToken(null); else setPersonalAccessToken(null);
                destroyCookie(null, `microsoft_access_token_${accountType}`, { path: '/' });
                throw new Error(`Authentication token for Microsoft ${accountType} account is invalid. Please sign in again to refresh it.`);
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to fetch OneDrive files for ${accountType} account: ${errorData.error?.message || 'Unknown error'}`);
            }
            const data = await response.json();
            // We need to normalize the Microsoft Graph API response to match the Google Drive API response structure
            return data.value.map((file: any) => ({
                id: file.id,
                name: file.name,
                mimeType: file.file.mimeType,
                modifiedTime: file.lastModifiedDateTime,
                webViewLink: file.webUrl,
                source: 'drive',
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
    fetchDriveFiles,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
