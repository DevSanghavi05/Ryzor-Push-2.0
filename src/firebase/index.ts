import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';
import {
  FirebaseProvider,
  FirebaseClientProvider,
  useFirebaseApp,
  useFirestore,
  useAuth,
} from './provider';

import { useUser } from './auth/use-user';

export function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
} {
  const apps = getApps();
  const firebaseApp = !apps.length ? initializeApp(firebaseConfig) : apps[0];
  const firestore = getFirestore(firebaseApp);
  const auth = getAuth(firebaseApp);

  return { firebaseApp, firestore, auth };
}


export {
  FirebaseProvider,
  FirebaseClientProvider,
  useUser,
  useFirebaseApp,
  useFirestore,
  useAuth,
};
