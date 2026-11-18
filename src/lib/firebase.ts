/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  getDocFromServer
} from 'firebase/firestore';
import appletFirebaseConfig from '../../firebase-applet-config.json';

const resolvedConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || appletFirebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || appletFirebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || appletFirebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || appletFirebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletFirebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || appletFirebaseConfig.appId,
  firestoreDatabaseId:
    import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || appletFirebaseConfig.firestoreDatabaseId,
};

export const firebaseProjectId = resolvedConfig.projectId;
export const firestoreDatabaseId = resolvedConfig.firestoreDatabaseId;
export const isFirebaseConfigured = Boolean(resolvedConfig.apiKey && resolvedConfig.projectId);

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

if (isFirebaseConfigured) {
  appInstance = getApps().length > 0 ? getApps()[0] : initializeApp(resolvedConfig);
  authInstance = getAuth(appInstance);
  /* CRITICAL: Pass firestoreDatabaseId to bind to the provisioned Enterprise Firestore instance */
  dbInstance = resolvedConfig.firestoreDatabaseId
    ? getFirestore(appInstance, resolvedConfig.firestoreDatabaseId)
    : getFirestore(appInstance);
}

export const firebaseApp = appInstance;
export const auth = authInstance;
export const db = dbInstance;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export type FirestoreConnectionState = 'connected' | 'offline' | 'unconfigured' | 'error';

export async function testFirestoreConnection(): Promise<{
  state: FirestoreConnectionState;
  detail?: string;
}> {
  if (!db) {
    return { state: 'unconfigured', detail: 'Chưa cấu hình Firebase Client SDK.' };
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return { state: 'connected' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
      return { state: 'offline', detail: msg };
    }
    return { state: 'connected', detail: msg };
  }
}

export async function signInWithFirebaseGoogle(): Promise<{
  firebaseUser: FirebaseUser;
  idToken: string;
}> {
  if (!auth) {
    throw new Error('Firebase Auth chưa được khởi tạo.');
  }
  const cred = await signInWithPopup(auth, googleProvider);
  const idToken = await cred.user.getIdToken(true);
  return { firebaseUser: cred.user, idToken };
}

export async function signInWithFirebaseEmail(
  email: string,
  password: string
): Promise<{ firebaseUser: FirebaseUser; idToken: string }> {
  if (!auth) throw new Error('Firebase Auth chưa được khởi tạo.');
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await cred.user.getIdToken(true);
  return { firebaseUser: cred.user, idToken };
}

export async function registerWithFirebaseEmail(
  name: string,
  email: string,
  password: string
): Promise<{ firebaseUser: FirebaseUser; idToken: string }> {
  if (!auth) throw new Error('Firebase Auth chưa được khởi tạo.');
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name.trim()) {
    await updateProfile(cred.user, { displayName: name.trim() });
  }
  const idToken = await cred.user.getIdToken(true);
  return { firebaseUser: cred.user, idToken };
}

export async function sendFirebasePasswordReset(email: string): Promise<void> {
  if (!auth) throw new Error('Firebase Auth chưa được khởi tạo.');
  await sendPasswordResetEmail(auth, email);
}

export async function signOutFirebase(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}
