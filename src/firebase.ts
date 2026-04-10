import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';
import { UserProfile } from './types';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export async function ensureUserProfileDocument(user: User, overrides: Partial<UserProfile> = {}) {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: overrides.email || user.email || '',
      displayName: overrides.displayName || user.displayName || '',
      phone: overrides.phone || '',
      role: 'user',
      wishlist: [],
      wantsOffers: overrides.wantsOffers ?? true,
      memberOfferCode: overrides.memberOfferCode || 'DTHC10',
      savedAddress: overrides.savedAddress || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    return;
  }

  await setDoc(userRef, {
      uid: user.uid,
    email: overrides.email || user.email || userSnap.data()?.email || '',
    displayName: overrides.displayName || user.displayName || userSnap.data()?.displayName || '',
    phone: overrides.phone || userSnap.data()?.phone || '',
    wantsOffers: overrides.wantsOffers ?? userSnap.data()?.wantsOffers ?? true,
    memberOfferCode: overrides.memberOfferCode || userSnap.data()?.memberOfferCode || 'DTHC10',
    savedAddress: overrides.savedAddress || userSnap.data()?.savedAddress || null,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. Firestore is offline.");
    }
  }
}
testConnection();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signInWithEmail = (email: string, password: string) => signInWithEmailAndPassword(auth, email, password);
export const requestPasswordReset = (email: string) => sendPasswordResetEmail(auth, email);

export function getFirebaseAuthMessage(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error);

  if (raw.includes('auth/email-already-in-use')) {
    return 'This email is already in use. Try logging in instead.';
  }
  if (raw.includes('auth/invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (raw.includes('auth/weak-password')) {
    return 'Your password is too weak. Use at least 6 characters.';
  }
  if (raw.includes('auth/operation-not-allowed') || raw.includes('auth/admin-restricted-operation')) {
    return 'Email/password signup is not enabled in Firebase yet. Turn on Email/Password sign-in in Firebase Authentication.';
  }
  if (raw.includes('auth/configuration-not-found')) {
    return 'Firebase email/password authentication is not configured yet. In Firebase Console, open Authentication > Sign-in method and enable Email/Password.';
  }
  if (raw.includes('auth/network-request-failed')) {
    return 'Network error. Please check your internet connection and try again.';
  }
  if (raw.includes('auth/too-many-requests')) {
    return 'Too many attempts right now. Please wait a little and try again.';
  }

  return raw || 'Unable to complete this action right now.';
}

export async function signUpWithEmail(input: {
  email: string;
  password: string;
  displayName: string;
  phone?: string;
  wantsOffers?: boolean;
}) {
  const credential = await createUserWithEmailAndPassword(auth, input.email, input.password);
  if (input.displayName.trim()) {
    await updateProfile(credential.user, { displayName: input.displayName.trim() });
  }

  try {
    await ensureUserProfileDocument(credential.user, {
      email: input.email.trim(),
      displayName: input.displayName.trim(),
      phone: input.phone?.trim() || '',
      wantsOffers: input.wantsOffers ?? true,
      memberOfferCode: 'DTHC10',
    });
  } catch (profileError) {
    console.warn('User auth account created, but profile document could not be saved yet.', profileError);
  }

  return credential;
}

export const logOut = () => signOut(auth);

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
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
