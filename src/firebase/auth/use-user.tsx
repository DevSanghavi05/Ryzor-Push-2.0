
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
} from 'firebase/auth';
import { useAuth } from '@/firebase/provider';
import { setCookie, destroyCookie, parseCookies } from 'nookies';

export type AccountType = 'work' | 'personal';

export interface UserContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: (accountType: AccountType) => Promise<UserCredential | void>;
  signInWithMicrosoft: () => Promise<void>;
  signOut: () => Promise<void>;
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
const setAuthTokenCookie = (token: string, accountType: AccountType) => {
  const cookieName = `google_access_token_${accountType}`;
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
};


export function UserProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [workAccessToken, setWorkAccessToken] = useState<string | null>(() => {
    const cookies = parseCookies();
    return cookies.google_access_token_work || null;
  });
  const [personalAccessToken, setPersonalAccessToken] = useState<string | null>(() => {
    const cookies = parseCookies();
    return cookies.google_access_token_personal || null;
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
        if (cookies.google_access_token_personal && !personalAccessToken) {
          setPersonalAccessToken(cookies.google_access_token_personal);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, workAccessToken, personalAccessToken]);

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
        setAuthTokenCookie(token, accountType);
      }
      // If this is the first sign-in, set the primary user object
      if (!user) {
        setUser(result.user);
      }

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
  }, [auth, user]);

  // --- Sign In with Microsoft (optional) ---
  const signInWithMicrosoft = async () => {
    if (!auth) return;
    const provider = new OAuthProvider('microsoft.com');
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Microsoft:', error);
    }
  };

  // --- Sign Out ---
  const signOut = async () => {
    if (!auth) return;
    try {
      await firebaseSignOut(auth);
      // State and cookies are cleared by the onAuthStateChanged listener
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // --- Fetch Google Drive Files ---
  const fetchDriveFiles = useCallback(async (accountType: AccountType) => {
    let currentToken = accountType === 'work' ? workAccessToken : personalAccessToken;
    
    if (!user) {
      throw new Error("User is not signed in.");
    }
    
    if (!currentToken) {
      const cookies = parseCookies();
      currentToken = cookies[`google_access_token_${accountType}`] || null;
      if (currentToken) {
        if (accountType === 'work') setWorkAccessToken(currentToken);
        else setPersonalAccessToken(currentToken);
      }
    }

    if (!currentToken) {
      throw new Error(`Authentication token for ${accountType} account is missing. Please sign in again.`);
    }

    try {
      const response = await fetch(
        "https://www.googleapis.com/drive/v3/files?pageSize=50&fields=files(id,name,mimeType,modifiedTime,webViewLink,iconLink)&q=(mimeType='application/vnd.google-apps.document' or mimeType='application/vnd.google-apps.spreadsheet' or mimeType='application/vnd.google-apps.presentation' or mimeType='application/pdf')",
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      if (response.status === 401) {
        if (accountType === 'work') setWorkAccessToken(null);
        else setPersonalAccessToken(null);
        destroyCookie(null, `google_access_token_${accountType}`, { path: '/' });
        throw new Error(`Authentication token for ${accountType} account is invalid. Please sign in again to refresh it.`);
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to fetch Drive files for ${accountType} account: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.files;
    } catch (error) {
      console.error(`Error fetching Google Drive files for ${accountType} account:`, error);
      throw error;
    }
  }, [user, workAccessToken, personalAccessToken]);

  const value: UserContextValue = {
    user,
    loading,
    signInWithGoogle,
    signInWithMicrosoft,
    signOut,
    workAccessToken,
    personalAccessToken,
    fetchDriveFiles,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
