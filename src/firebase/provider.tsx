'use client';
import {
  createContext,
  useContext,
  ReactNode,
} from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';

export interface FirebaseContextValue {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(
  undefined
);

export const FirebaseProvider = ({
  children,
  firebaseApp,
  firestore,
  auth,
}: {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}) => {
  return (
    <FirebaseContext.Provider value={{ firebaseApp, firestore, auth }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

export function useFirebaseApp() {
  return useFirebase()?.firebaseApp;
}

export function useFirestore() {
  return useFirebase()?.firestore;
}

export function useAuth() {
  return useFirebase()?.auth;
}
