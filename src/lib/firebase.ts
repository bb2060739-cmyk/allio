import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with experimentalForceLongPolling: true.
// In browser iframe sandbox / restricted proxy environments, default WebChannel streaming
// can be delayed by proxies and cause "Could not reach Cloud Firestore backend. Backend didn't respond within 10 seconds".
// Long-polling ensures immediate, reliable HTTP connection without 10s streaming hangs.
function getOrCreateFirestore(): Firestore {
  try {
    return initializeFirestore(app, {
      experimentalForceLongPolling: true,
    }, firebaseConfig.firestoreDatabaseId);
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

export const db = getOrCreateFirestore();
export const auth = getAuth(app);

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
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[Firebase ${operationType.toUpperCase()}] Notice on ${path || 'database'}:`, message);
  return new Error(message);
}
