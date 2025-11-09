
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
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged as onFirebaseAuthStateChanged,
  signOut as firebaseSignOut,
  UserCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { useAuth } from '@/firebase/provider';
import { setCookie, destroyCookie, parseCookies } from 'nookies';
import { useRouter } from 'next/navigation';

export type AccountType = 'work' | 'personal';

export interface UserContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: (accountType?: AccountType) => Promise<UserCredential | void>;
  signInWithMicrosoft: (accountType?: AccountType) => Promise<void>;
  signOut: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<UserCredential | void>;
  signInWithEmail: (email: string, password: string) => Promise<UserCredential | void>;
  accessToken: string | null;
  workAccessToken: string | null;
  personalAccessToken: string | null;
  workProvider: 'google' | 'microsoft' | null;
  personalProvider: 'google' | 'microsoft' | null;
  fetchDriveFiles: (accountType: AccountType) => Promise<any[] | void>;
  userLoading: boolean;
  disconnectGoogleAccount: (accountType: AccountType) => void;
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
  setCookie(null, `provider_${accountType}`, provider, { maxAge: 3600 * 24 * 7, path: '/' });
};

const clearAuthTokenCookies = () => {
  const cookies = parseCookies();
  for (const cookie in cookies) {
    if (cookie.includes('_access_token_') || cookie.startsWith('provider_')) {
      destroyCookie(null, cookie, { path: '/' });
    }
  }
};


export function UserProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  const [accessToken, setAccessToken] = useState<string|null>(null);
  const [workAccessToken, setWorkAccessToken] = useState<string | null>(null);
  const [personalAccessToken, setPersonalAccessToken] = useState<string | null>(null);
  const [workProvider, setWorkProvider] = useState<'google' | 'microsoft' | null>(null);
  const [personalProvider, setPersonalProvider] = useState<'google' | 'microsoft' | null>(null);

  // --- Initialize state from cookies ---
  useEffect(() => {
    const cookies = parseCookies();
    const workToken = cookies.google_access_token_work || cookies.microsoft_access_token_work || null;
    const personalToken = cookies.google_access_token_personal || cookies.microsoft_access_token_personal || null;
    
    setWorkAccessToken(workToken);
    setPersonalAccessToken(personalToken);
    setWorkProvider(cookies.provider_work as any || null);
    setPersonalProvider(cookies.provider_personal as any || null);
    
    setAccessToken(workToken || personalToken || null);
  }, []);
  
  // --- Listen to Auth State Changes & Handle Redirect Results ---
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    // Handle the result from a redirect sign-in
    getRedirectResult(auth).then((result) => {
        if (result) {
            const credential = OAuthProvider.credentialFromResult(result);
            if (credential?.accessToken) {
                // We need to know if this was for a 'work' or 'personal' account.
                // Since we can't pass state through the redirect easily, we'll assume a default
                // or check a temporary cookie if we were to set one before the redirect.
                // For now, let's assume 'personal' as a default for simplicity.
                const accountType: AccountType = 'personal'; // This is a simplification
                const providerName = result.providerId.includes('google') ? 'google' : 'microsoft';
                setAuthTokenCookie(credential.accessToken, providerName, accountType);
                if (accountType === 'work') {
                    setWorkAccessToken(credential.accessToken);
                    setWorkProvider(providerName);
                } else {
                    setPersonalAccessToken(credential.accessToken);
                    setPersonalProvider(providerName);
                }
                 setAccessToken(credential.accessToken);
            }
        }
    }).catch(error => {
        console.error("Error getting redirect result:", error);
    }).finally(() => {
        setLoading(false);
    });

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
      // Only set loading to false in here if not handling redirect
      // The redirect handler will manage loading state
    });

    return () => unsubscribe();
  }, [auth]);

  const handleOAuthSignIn = useCallback(async (provider: GoogleAuthProvider, providerName: 'google', accountType: AccountType = 'personal'): Promise<UserCredential | void> => {
      if (!auth) return;
      provider.setCustomParameters({ prompt: 'select_account' });
      
      try {
        const result = await signInWithPopup(auth, provider);
        const credential = OAuthProvider.credentialFromResult(result);

        if (credential?.accessToken) {
          const token = credential.accessToken;
          
          if (accountType === 'work') {
            setWorkAccessToken(token);
            setWorkProvider(providerName);
            setAuthTokenCookie(token, providerName, 'work');
          } else { // 'personal' or default
             setPersonalAccessToken(token);
             setPersonalProvider(providerName);
             setAuthTokenCookie(token, providerName, 'personal');
          }
          // Update general access token
          setAccessToken(token);
        }

        if (!user) setUser(result.user);
        return result;
      } catch (error: any) {
        if (['auth/popup-blocked', 'auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(error.code)) {
          console.warn(`Sign-in flow was interrupted: ${error.message}`);
          return;
        }
        console.error(`Error signing in with ${providerName}:`, error);
        throw error;
      }
  }, [auth, user]);

  // --- Sign In with Google (with Drive access) ---
  const signInWithGoogle = useCallback(async (accountType: AccountType = 'personal'): Promise<UserCredential | void> => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/drive.readonly');
    provider.addScope('https://www.googleapis.com/auth/documents.readonly');
    provider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
    provider.addScope('https://www.googleapis.com/auth/presentations.readonly');
    provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
    provider.addScope('https://www.googleapis.com/auth/gmail.compose');
    provider.addScope('https://www.googleapis.com/auth/calendar');
    
    return handleOAuthSignIn(provider, 'google', accountType);
  }, [handleOAuthSignIn]);

  // --- Sign In with Microsoft ---
  const signInWithMicrosoft = useCallback(async (accountType: AccountType = 'personal'): Promise<void> => {
    if (!auth) return;
    const provider = new OAuthProvider('microsoft.com');
    // Add scopes if needed
    // provider.addScope('...')

    try {
        // We use signInWithRedirect for Microsoft to solve the PKCE issue.
        await signInWithRedirect(auth, provider);
        // The rest of the logic is handled by getRedirectResult in the useEffect hook.
    } catch(error) {
        console.error("Error starting Microsoft sign-in redirect:", error);
        throw error;
    }
  }, [auth]);

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
  
  // --- Disconnect Google Account ---
  const disconnectGoogleAccount = useCallback((accountType: AccountType) => {
    if (accountType === 'work') {
      destroyCookie(null, 'google_access_token_work', { path: '/' });
      destroyCookie(null, 'provider_work', { path: '/' });
      setWorkAccessToken(null);
      setWorkProvider(null);
    } else {
      destroyCookie(null, 'google_access_token_personal', { path: '/' });
      destroyCookie(null, 'provider_personal', { path: '/' });
      setPersonalAccessToken(null);
      setPersonalProvider(null);
    }
    // Re-evaluate the main access token
    const cookies = parseCookies();
    const workToken = cookies.google_access_token_work || null;
    const personalToken = cookies.google_access_token_personal || null;
    setAccessToken(workToken || personalToken);
  }, []);

  // --- Fetch Cloud Files ---
  const fetchDriveFiles = useCallback(async (accountType: AccountType) => {
    if (!user) throw new Error("User is not signed in.");

    const provider = accountType === 'work' ? workProvider : personalProvider;
    const token = accountType === 'work' ? workAccessToken : personalAccessToken;
    
    if (!provider || !token) {
        return;
    }

    if (provider === 'google') {
        try {
            const response = await fetch(
                "https://www.googleapis.com/drive/v3/files?pageSize=100&fields=files(id,name,mimeType,modifiedTime,webViewLink,iconLink)&q=(mimeType='application/vnd.google-apps.document' or mimeType='application/vnd.google-apps.spreadsheet' or mimeType='application/vnd.google-apps.presentation' or mimeType='application/pdf' or mimeType='application/vnd.google-apps.folder')",
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.status === 401 || response.status === 403) {
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
    signInWithMicrosoft,
    signOut,
    signUpWithEmail,
    signInWithEmail,
    accessToken,
    workAccessToken,
    personalAccessToken,
    workProvider,
    personalProvider,
    fetchDriveFiles,
    disconnectGoogleAccount,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
