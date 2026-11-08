import { initializeApp } from 'firebase/app';
import {
  EmailAuthProvider,
  browserSessionPersistence,
  connectAuthEmulator,
  getAuth,
  onAuthStateChanged,
  reauthenticateWithCredential,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from 'firebase/auth';
import {
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  initializeFirestore,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';
import { connectStorageEmulator, getDownloadURL, getStorage, ref, uploadString } from 'firebase/storage';
import type { DbSubmission, Team, TournamentRegistration } from './types/tournament';

// Konfigurasi web Firebase bukan rahasia (keamanan data diatur firestore.rules/storage.rules), jadi
// default-nya ditanam agar build tanpa variabel lingkungan tetap terhubung. VITE_* yang terisi menimpa
// default (kosong = pakai default); VITE_DEMO=true mematikan cloud untuk mode demo/tes.
const env = import.meta.env;
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyBM4NKvB2m_2d7i4SQWPZ3_TcOIlQodcfM',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'arenadawn-mlbb.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'arenadawn-mlbb',
  appId: env.VITE_FIREBASE_APP_ID || '1:62973318535:web:d09db60440c111a7c22f22',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'arenadawn-mlbb.firebasestorage.app',
};

/** Tanpa konfigurasi Firebase aplikasi berjalan sebagai demo pengunjung (data contoh, tanpa login staf). */
export const cloudEnabled = env.VITE_DEMO !== 'true' && Boolean(config.apiKey && config.projectId);

const app = cloudEnabled ? initializeApp(config) : null;
const auth = app ? getAuth(app) : null!;
const db = app ? initializeFirestore(app, { ignoreUndefinedProperties: true }) : null!;
const functions = app ? getFunctions(app, 'asia-southeast2') : null!;
const storage = app ? getStorage(app) : null!;

if (app && env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
}

export interface StaffProfile {
  username: string;
  name: string;
  role: 'admin' | 'panitia';
}

export interface ManagedUser extends StaffProfile {
  id: string;
}

export const emailOf = (username: string) => username.trim().toLowerCase() + '@mlbb-app.local';

async function readProfile(uid: string): Promise<StaffProfile | null> {
  const d = (await getDoc(doc(db, 'users', uid))).data();
  return d ? { username: d.username, name: d.name, role: d.role } : null;
}

export async function loginWithUsername(username: string, password: string): Promise<StaffProfile> {
  await setPersistence(auth, browserSessionPersistence); // sesi berakhir saat tab ditutup
  const cred = await signInWithEmailAndPassword(auth, emailOf(username), password);
  const profile = await readProfile(cred.user.uid);
  if (!profile) {
    await signOut(auth);
    throw new Error('Akun tidak aktif.');
  }
  return profile;
}

export const logout = () => (cloudEnabled ? signOut(auth) : Promise.resolve());

/** Memanggil callback dengan profil staf saat sesi dipulihkan/berubah, atau null bila tidak login. */
export function onSession(cb: (p: StaffProfile | null) => void) {
  if (!cloudEnabled) {
    cb(null);
    return () => {};
  }
  return onAuthStateChanged(auth, (u) => {
    if (!u) return cb(null);
    readProfile(u.uid).then(cb, () => cb(null));
  });
}

export async function changeOwnPassword(oldPassword: string, newPassword: string) {
  const u = auth.currentUser;
  if (!u?.email) throw new Error('Sesi berakhir. Silakan login ulang.');
  await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, oldPassword));
  await updatePassword(u, newPassword);
}

export function authErrorMessage(e: unknown): string {
  const code = (e as { code?: string }).code || '';
  if (code === 'auth/too-many-requests') return 'Terlalu banyak percobaan gagal. Coba lagi beberapa menit lagi.';
  if (code.startsWith('auth/invalid-') || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
    return 'Username atau password salah.';
  }
  if (code === 'auth/network-request-failed') return 'Server tidak terjangkau. Coba lagi.';
  return (e as Error).message || 'Terjadi kesalahan.';
}

async function callFn<T = unknown>(name: string, data: unknown): Promise<T> {
  try {
    return (await httpsCallable(functions, name)(data)).data as T;
  } catch (e) {
    throw new Error((e as Error).message || 'Permintaan gagal.');
  }
}

export const createUser = (u: { username: string; name: string; password: string; role: string }) =>
  callFn('createUser', u);
export const deleteUser = (username: string) => callFn('deleteUser', { username });
export const setUserPassword = (username: string, newPassword: string) =>
  callFn('setUserPassword', { username, newPassword });

/** Daftar akun (hanya admin yang boleh membaca; selain itu callback kosong). */
export function subscribeUsers(cb: (u: ManagedUser[]) => void) {
  return onSnapshot(
    collection(db, 'users'),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as StaffProfile) }))),
    () => cb([])
  );
}

// ------------------------------------------------------------ data turnamen

const STATE_DOC = () => doc(db, 'app', 'state');
const PRIVATE_DOC = () => doc(db, 'app', 'private');

/** Data publik (dibaca semua orang, ditulis staf). Nomor WhatsApp dan data pendaftaran sensitif tidak termasuk. */
export interface PublicState {
  tournaments: unknown[];
  teams: Team[];
  players: unknown[];
  matches: unknown[];
  registrations: TournamentRegistration[]; // proyeksi publik: hanya yang disetujui, tanpa kontak & bukti
  saweriaUrl?: string; // undefined = alamat bawaan, '' = disembunyikan admin
}

export function subscribeState(onState: (s: PublicState | null) => void, onError: () => void) {
  return onSnapshot(STATE_DOC(), (snap) => onState(snap.exists() ? (snap.data() as PublicState) : null), onError);
}

/** Data pribadi khusus staf: nomor WhatsApp kapten per id tim dan nama lengkap per id player. */
export interface PrivateData {
  teamContacts: Record<string, string>;
  playerNames: Record<string, string>;
}

export function subscribePrivate(cb: (d: PrivateData) => void) {
  return onSnapshot(
    PRIVATE_DOC(),
    (snap) => {
      const d = snap.data() || {};
      cb({ teamContacts: d.teamContacts || {}, playerNames: d.playerNames || {} });
    },
    () => cb({ teamContacts: {}, playerNames: {} })
  );
}

// Gambar (data URL) dipindah ke Storage; dokumen state hanya menyimpan URL-nya (batas dokumen 1 MB).
const uploaded = new Map<string, string>();

async function externalize<T>(value: T): Promise<T> {
  if (typeof value === 'string') {
    if (!value.startsWith('data:image/')) return value;
    const hit = uploaded.get(value);
    if (hit) return hit as T;
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 32);
    const ext = /^data:image\/(png|jpeg|webp|gif|svg\+xml)/.exec(value)?.[1]?.replace('svg+xml', 'svg') || 'png';
    const r = ref(storage, `img/${digest}.${ext}`);
    await uploadString(r, value, 'data_url');
    const url = await getDownloadURL(r);
    uploaded.set(value, url);
    return url as T;
  }
  if (Array.isArray(value)) return (await Promise.all(value.map(externalize))) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value)) out[k] = await externalize((value as Record<string, unknown>)[k]);
    return out as T;
  }
  return value;
}

export const saveState = async (s: PublicState) => setDoc(STATE_DOC(), await externalize(s));
export const savePrivate = (d: PrivateData) => setDoc(PRIVATE_DOC(), d);

/** Antrean/riwayat pendaftaran lengkap: hanya staf yang bisa membaca. */
export function subscribeRegistrations(cb: (r: TournamentRegistration[]) => void) {
  return onSnapshot(
    collection(db, 'registrations'),
    (snap) => cb(snap.docs.map((d) => d.data() as TournamentRegistration)),
    () => cb([])
  );
}

/** Dipakai staf (upsert) dan pengunjung (hanya membuat dokumen baru berstatus pending; dijaga rules). */
export const saveRegistration = (r: TournamentRegistration) =>
  setDoc(doc(db, 'registrations', r.id), r);

/** Pendaftaran tim/player ke Database. Pengunjung hanya boleh membuat; staf membaca, menyetujui (hapus), menolak. */
export const saveSubmission = (s: DbSubmission) => setDoc(doc(db, 'submissions', s.id), s);
export const deleteSubmission = (id: string) => deleteDoc(doc(db, 'submissions', id));
export function subscribeSubmissions(cb: (list: DbSubmission[]) => void) {
  return onSnapshot(
    collection(db, 'submissions'),
    (snap) => cb(snap.docs.map((d) => d.data() as DbSubmission)),
    () => cb([])
  );
}
