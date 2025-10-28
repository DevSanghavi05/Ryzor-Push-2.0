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
  UserCredential,
} from 'firebase/auth';
import { useAuth } from '@/firebase/provider';
import { setCookie, destroyCookie, parseCookies } from 'nookies';

export interface UserContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<UserCredential | void>;
  signInWithMicrosoft: () => Promise<void>;
  signOut: () => Promise<void>;
  accessToken: string | null;
  fetchDriveFiles: () => Promise<any[] | void>;
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
const setAuthTokenCookie = (token: string) => {
  setCookie(null, 'google_access_token', token, {
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
};

const clearAuthTokenCookie = () => {
  destroyCookie(null, 'google_access_token', { path: '/' });
};

export function UserProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    const cookies = parseCookies();
    return cookies.google_access_token || null;
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
        setAccessToken(null);
        clearAuthTokenCookie();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  // --- Sign In with Google (with Drive access) ---
  const signInWithGoogle = async (): Promise<UserCredential | void> => {
    if (!auth) return;

    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/drive.readonly');
    provider.addScope('https://www.googleapis.com/auth/documents.readonly');
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (credential?.accessToken) {
        setAccessToken(credential.accessToken);
        setAuthTokenCookie(credential.accessToken);
      }

      return result;
    } catch (error: any) {
      if (
        error.code === 'auth/popup-blocked' ||
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/cancelled-popup-request'
      ) {
        console.warn(error.message);
        return;
      }
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

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
      clearAuthTokenCookie();
      setAccessToken(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // --- Fetch Google Drive Files ---
  const fetchDriveFiles = async () => {
    let currentToken = accessToken;
    
    if (!currentToken) {
        // If token is missing, try to sign in to get a new one.
        console.warn('No access token, attempting to re-authenticate...');
        await signInWithGoogle();
        const cookies = parseCookies();
        currentToken = cookies.google_access_token || null;
    }

    if (!currentToken) {
      console.error('Could not obtain access token. Please sign in again.');
      return;
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
        console.log('Access token expired or invalid. Refreshing...');
        // Token is likely expired, clear it and re-authenticate
        await signOut(); // Clears bad token
        await signInWithGoogle(); // Gets new token
        const newCookies = parseCookies();
        const newToken = newCookies.google_access_token;
        if(newToken) {
            // Retry the fetch with the new token
            const retryResponse = await fetch(
                "https://www.googleapis.com/drive/v3/files?pageSize=50&fields=files(id,name,mimeType,modifiedTime,webViewLink,iconLink)&q=(mimeType='application/vnd.google-apps.document' or mimeType='application/vnd.google-apps.spreadsheet' or mimeType='application/vnd.google-apps.presentation' or mimeType='application/pdf')",
                {
                    headers: { Authorization: `Bearer ${newToken}` },
                }
            );
            if (!retryResponse.ok) throw new Error(`Retry fetch failed: ${retryResponse.statusText}`);
            const data = await retryResponse.json();
            return data.files;
        } else {
            throw new Error('Failed to refresh authentication token.');
        }

      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to fetch Drive files: ${errorData.error.message}`);
      }

      const data = await response.json();
      return data.files;
    } catch (error) {
      console.error('Error fetching Google Drive files:', error);
      throw error;
    }
  };

  const value: UserContextValue = {
    user,
    loading,
    signInWithGoogle,
    signInWithMicrosoft,
    signOut,
    accessToken,
    fetchDriveFiles,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
