import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInAnonymously,
  User as FirebaseUser,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Firestore,
} from 'firebase/firestore';
import type { UserProfile, JournalEntry } from '../types';

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, authInstance?: Auth) {
  const current = authInstance?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: current?.uid,
      email: current?.email,
      emailVerified: current?.emailVerified,
      isAnonymous: current?.isAnonymous,
      tenantId: current?.tenantId,
      providerInfo: current?.providerData?.map((p) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('[Firestore Error]:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let isRealFirebaseConfigured = false;

// Initialize Firebase with runtime or environment config
export function initClientFirebase(runtimeConfig?: Record<string, string>): {
  isConfigured: boolean;
  auth: Auth | null;
  db: Firestore | null;
} {
  if (app && auth && db) {
    return { isConfigured: isRealFirebaseConfigured, auth, db };
  }

  const apiKey = runtimeConfig?.apiKey || import.meta.env.VITE_FIREBASE_API_KEY;
  const authDomain = runtimeConfig?.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  const projectId = runtimeConfig?.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const firestoreDatabaseId = runtimeConfig?.firestoreDatabaseId || import.meta.env.VITE_FIREBASE_DATABASE_ID;

  if (apiKey && apiKey.length > 5 && projectId) {
    try {
      const config = {
        apiKey,
        authDomain: authDomain || `${projectId}.firebaseapp.com`,
        projectId,
        storageBucket: runtimeConfig?.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
        messagingSenderId: runtimeConfig?.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
        appId: runtimeConfig?.appId || import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef',
      };

      app = getApps().length > 0 ? getApps()[0] : initializeApp(config);
      auth = getAuth(app);
      
      // If a specific database ID was provisioned (e.g. ai-studio-personalgeminijo-...), pass it
      if (firestoreDatabaseId && firestoreDatabaseId !== '(default)') {
        db = getFirestore(app, firestoreDatabaseId);
      } else {
        db = getFirestore(app);
      }
      
      isRealFirebaseConfigured = true;
      console.log('[FirebaseClient] Connected to Cloud Firestore project:', projectId, 'database:', firestoreDatabaseId || '(default)');
      return { isConfigured: true, auth, db };
    } catch (err) {
      console.warn('[FirebaseClient] Error initializing Firebase client:', err);
    }
  }

  return { isConfigured: false, auth: null, db: null };
}

// Initial attempt
initClientFirebase();

export { auth, db, isRealFirebaseConfigured };

export function getDb(): Firestore | null {
  return db;
}

export function getAuthClient(): Auth | null {
  return auth;
}

export function isFirebaseReady(): boolean {
  return isRealFirebaseConfigured;
}

export const KNOWN_USERS_KEY = 'personal_gemini_known_users';

export function getKnownUserProfiles(): UserProfile[] {
  try {
    const raw = localStorage.getItem(KNOWN_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading known users:', e);
  }

  // Default suggested starter profiles for 5th graders & family
  const defaults: UserProfile[] = [
    {
      uid: 'student-alex-grade5',
      email: 'alex.adventurer@school.org',
      displayName: 'Alex (Grade 5 Explorer)',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      isMockDemo: true,
    },
    {
      uid: 'student-maya-grade5',
      email: 'maya.writer@school.org',
      displayName: 'Maya (Grade 5 Creative Writer)',
      photoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
      isMockDemo: true,
    },
    {
      uid: 'student-leo-grade5',
      email: 'leo.space@school.org',
      displayName: 'Leo (Grade 5 Space & Stars)',
      photoURL: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80',
      isMockDemo: true,
    },
  ];
  try {
    localStorage.setItem(KNOWN_USERS_KEY, JSON.stringify(defaults));
  } catch {}
  return defaults;
}

export function recordUserInHistory(user: UserProfile) {
  try {
    const current = getKnownUserProfiles();
    const filtered = current.filter((u) => u.uid !== user.uid);
    const updated = [user, ...filtered].slice(0, 10);
    localStorage.setItem(KNOWN_USERS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to record user profile:', e);
  }
}

export function removeUserFromHistory(uid: string) {
  try {
    const current = getKnownUserProfiles();
    const updated = current.filter((u) => u.uid !== uid);
    localStorage.setItem(KNOWN_USERS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to remove user profile:', e);
  }
}

/**
 * Subscribe to Firebase Auth state changes
 */
export function subscribeAuthState(callback: (user: UserProfile | null) => void): () => void {
  const { auth: clientAuth } = initClientFirebase();
  if (clientAuth) {
    return onAuthStateChanged(clientAuth, (fbUser) => {
      if (fbUser) {
        const u: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || 'Mindful Journaler',
          photoURL: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
          isAnonymous: fbUser.isAnonymous,
          isMockDemo: false,
        };
        localStorage.removeItem('gemini_journal_demo_user');
        recordUserInHistory(u);
        callback(u);
      } else {
        callback(null);
      }
    });
  }
  return () => {};
}

/**
 * Sign in using Google Federated Identity
 */
export async function signInWithGoogleFederated(): Promise<UserProfile> {
  const { auth: clientAuth, isConfigured } = initClientFirebase();

  if (isConfigured && clientAuth) {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(clientAuth, provider);
    const u = result.user;
    const profile: UserProfile = {
      uid: u.uid,
      email: u.email,
      displayName: u.displayName || 'Mindful Journaler',
      photoURL: u.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      isAnonymous: u.isAnonymous,
      isMockDemo: false,
    };
    recordUserInHistory(profile);
    return profile;
  }

  // Fallback demo user
  const mockUser: UserProfile = {
    uid: 'demo-user-apple-hig',
    email: 'mindful.architect@icloud.apple.com',
    displayName: 'Apple HIG Architect',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    isMockDemo: true,
  };
  localStorage.setItem('gemini_journal_demo_user', JSON.stringify(mockUser));
  recordUserInHistory(mockUser);
  return mockUser;
}

/**
 * Sign in with Email & Password
 */
export async function signInWithEmail(email: string, pass: string): Promise<UserProfile> {
  const { auth: clientAuth, isConfigured } = initClientFirebase();

  if (isConfigured && clientAuth) {
    const result = await signInWithEmailAndPassword(clientAuth, email, pass);
    const u = result.user;
    const profile: UserProfile = {
      uid: u.uid,
      email: u.email,
      displayName: u.displayName || email.split('@')[0],
      photoURL: u.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      isAnonymous: u.isAnonymous,
      isMockDemo: false,
    };
    recordUserInHistory(profile);
    return profile;
  }

  // Simulation mode for preview
  const uid = 'user-' + btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 14);
  const profile: UserProfile = {
    uid,
    email,
    displayName: email.split('@')[0],
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    isMockDemo: true,
  };
  localStorage.setItem('gemini_journal_demo_user', JSON.stringify(profile));
  recordUserInHistory(profile);
  return profile;
}

/**
 * Sign up with Email & Password
 */
export async function signUpWithEmail(email: string, pass: string, name?: string): Promise<UserProfile> {
  const { auth: clientAuth, isConfigured } = initClientFirebase();

  if (isConfigured && clientAuth) {
    const result = await createUserWithEmailAndPassword(clientAuth, email, pass);
    const u = result.user;
    if (name) {
      try {
        await updateProfile(u, { displayName: name });
      } catch (err) {
        console.warn('Could not set displayName:', err);
      }
    }
    const profile: UserProfile = {
      uid: u.uid,
      email: u.email,
      displayName: name || u.displayName || email.split('@')[0],
      photoURL: u.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      isAnonymous: u.isAnonymous,
      isMockDemo: false,
    };
    recordUserInHistory(profile);
    return profile;
  }

  const uid = 'user-' + btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 14);
  const profile: UserProfile = {
    uid,
    email,
    displayName: name || email.split('@')[0],
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    isMockDemo: true,
  };
  localStorage.setItem('gemini_journal_demo_user', JSON.stringify(profile));
  recordUserInHistory(profile);
  return profile;
}

/**
 * Switch directly to a student or demo profile
 */
export function signInWithQuickProfile(profile: UserProfile): UserProfile {
  localStorage.setItem('gemini_journal_demo_user', JSON.stringify(profile));
  recordUserInHistory(profile);
  return profile;
}

/**
 * Sign out of current session
 */
export async function logOutUser(): Promise<void> {
  const { auth: clientAuth } = initClientFirebase();
  if (clientAuth) {
    try {
      await firebaseSignOut(clientAuth);
    } catch (err) {
      console.warn('Sign out error:', err);
    }
  }
  localStorage.removeItem('gemini_journal_demo_user');
}

/**
 * Retrieve current user token for server API authorization header
 */
export async function getAuthIdToken(): Promise<string> {
  const { auth: clientAuth } = initClientFirebase();
  if (clientAuth?.currentUser) {
    return await clientAuth.currentUser.getIdToken();
  }
  try {
    const local = localStorage.getItem('gemini_journal_demo_user');
    if (local) {
      const u = JSON.parse(local);
      if (u?.uid) {
        return `demo-user-${u.uid}-token`;
      }
    }
  } catch {}
  return 'demo-user-hig-valid-token-preview';
}
