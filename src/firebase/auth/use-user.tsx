
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
    maxAge: 3600, // 1 hour
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
      } else {
        // When user is confirmed, ensure token is loaded from cookie if not already in state
        const cookies = parseCookies();
        if (cookies.google_access_token && !accessToken) {
          setAccessToken(cookies.google_access_token);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, accessToken]);

  // --- Sign In with Google (with Drive access) ---
  const signInWithGoogle = async (): Promise<UserCredential | void> => {
    if (!auth) {
      return;
    }

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
        console.warn(`Sign-in flow was interrupted: ${error.message}`);
        return; // Do not re-throw, just exit.
      }
      console.error('Error signing in with Google:', error);
      throw error; // Re-throw other errors
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
      // State and cookies are cleared by the onAuthStateChanged listener
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // --- Fetch Google Drive Files ---
  const fetchDriveFiles = async () => {
    let currentToken = accessToken;

    if (!user) {
      throw new Error("User is not signed in.");
    }
    
    // Primary mechanism: Use token from state.
    if (!currentToken) {
        // Fallback: If state is null, try to get from cookies one last time.
        const cookies = parseCookies();
        currentToken = cookies.google_access_token || null;
        if(currentToken) {
            setAccessToken(currentToken);
        }
    }

    if (!currentToken) {
        throw new Error("Authentication token is missing. Please sign in again.");
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
        // Token is invalid or expired. Clear it and prompt for re-login.
        clearAuthTokenCookie();
        setAccessToken(null);
        throw new Error("Authentication token is invalid. Please sign in again to refresh it.");
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to fetch Drive files: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.files;
    } catch (error) {
      console.error('Error fetching Google Drive files:', error);
      throw error; // Re-throw the error so the calling component can handle it
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
