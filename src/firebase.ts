import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);

// Error Handling conforming to specification
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection validation
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

// Google Workspace Scopes
export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/drive.file'
];

let cachedAccessToken: string | null = null;
let isSigningIn = false;

onAuthStateChanged(auth, (user) => {
  if (!user) {
    cachedAccessToken = null;
  }
});

export function getCachedAccessToken(): string | null {
  return cachedAccessToken;
}

export function setCachedAccessToken(token: string | null) {
  cachedAccessToken = token;
}

// Authentication helpers
export async function loginWithGoogle(): Promise<User> {
  try {
    isSigningIn = true;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    WORKSPACE_SCOPES.forEach(scope => provider.addScope(scope));
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;
    return result.user;
  } finally {
    isSigningIn = false;
  }
}

export async function getOrRequestAccessToken(): Promise<string> {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }
  await loginWithGoogle();
  if (!cachedAccessToken) {
    throw new Error('Tidak berhasil memperoleh token otorisasi Google Docs & Drive.');
  }
  return cachedAccessToken;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
  cachedAccessToken = null;
}

// User Profile & Settings in Firestore
export interface UserProfileData {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  namaGuru?: string;
  namaSekolah?: string;
  instansi?: string;
  alamat?: string;
  telp?: string;
  tahun?: string;
  semester?: string;
  watermarkText?: string;
  watermarkEnabled?: boolean;
  updatedAt?: string;
}

export async function saveUserProfile(profile: Partial<UserProfileData>): Promise<void> {
  if (!auth.currentUser) throw new Error('Harus login terlebih dahulu.');
  const userId = auth.currentUser.uid;
  const path = `users/${userId}`;
  const data: UserProfileData = {
    id: userId,
    email: auth.currentUser.email || '',
    displayName: auth.currentUser.displayName || '',
    photoURL: auth.currentUser.photoURL || '',
    ...profile,
    updatedAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'users', userId), data, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function loadUserProfile(userId: string): Promise<UserProfileData | null> {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return snap.data() as UserProfileData;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

// Saved Question Set in Firestore
export interface SavedQuestionSet {
  id: string;
  userId: string;
  title: string;
  mapel: string;
  jenjang: string;
  kelas: string;
  topik: string;
  curriculum?: string;
  soalCount: number;
  soalJson: string;
  formData?: any;
  createdAt: string;
  updatedAt: string;
}

export async function saveQuestionSet(payload: {
  id?: string;
  title: string;
  mapel: string;
  jenjang: string;
  kelas: string;
  topik: string;
  curriculum?: string;
  soalCount: number;
  soalData: any[];
  formData?: any;
}): Promise<string> {
  if (!auth.currentUser) throw new Error('Silakan masuk dengan akun Google terlebih dahulu untuk menyimpan ke Cloud.');
  const userId = auth.currentUser.uid;
  const docId = payload.id || `set_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `savedQuestions/${docId}`;

  const dataToSave: SavedQuestionSet = {
    id: docId,
    userId,
    title: payload.title || `${payload.mapel} - ${payload.topik}`,
    mapel: payload.mapel,
    jenjang: payload.jenjang,
    kelas: payload.kelas,
    topik: payload.topik,
    curriculum: payload.curriculum || 'merdeka',
    soalCount: payload.soalCount || payload.soalData.length,
    soalJson: JSON.stringify({
      meta: {
        appName: 'Super App',
        version: '1.0',
        kurikulum: payload.curriculum,
        savedDate: new Date().toISOString()
      },
      formData: payload.formData || {},
      soal: payload.soalData
    }),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'savedQuestions', docId), dataToSave);
    return docId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return docId;
  }
}

export async function getUserSavedQuestions(): Promise<SavedQuestionSet[]> {
  if (!auth.currentUser) return [];
  const userId = auth.currentUser.uid;
  const path = 'savedQuestions';

  try {
    const q = query(
      collection(db, 'savedQuestions'),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    const list: SavedQuestionSet[] = [];
    snap.forEach(d => {
      list.push(d.data() as SavedQuestionSet);
    });
    // Sort client-side by date descending
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

export async function deleteSavedQuestion(id: string): Promise<void> {
  if (!auth.currentUser) throw new Error('Harus login terlebih dahulu.');
  const path = `savedQuestions/${id}`;
  try {
    await deleteDoc(doc(db, 'savedQuestions', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
