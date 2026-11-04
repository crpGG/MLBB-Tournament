import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import { CallableRequest, HttpsError, onCall } from 'firebase-functions/v2/https';

initializeApp();
setGlobalOptions({ region: 'asia-southeast2', maxInstances: 5 });

const db = getFirestore();
const auth = getAuth();

const EMAIL_DOMAIN = '@mlbb-app.local';
const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const ROLES = ['admin', 'panitia'];
const emailOf = (username: string) => username + EMAIL_DOMAIN;
const str = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

async function requireAdmin(req: CallableRequest) {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Silakan login.');
  const snap = await db.doc(`users/${req.auth.uid}`).get();
  if (snap.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Hanya admin yang boleh melakukan ini.');
  }
  return req.auth.uid;
}

async function uidOfUsername(username: string) {
  const snap = await db.collection('users').where('username', '==', username).limit(1).get();
  if (snap.empty) throw new HttpsError('not-found', 'User tidak ditemukan.');
  return snap.docs[0].id;
}

export const createUser = onCall(async (req) => {
  await requireAdmin(req);
  const username = str(req.data?.username, 20).toLowerCase();
  const name = str(req.data?.name, 40);
  const password = String(req.data?.password ?? '');
  const role = String(req.data?.role ?? '');
  if (!USERNAME_RE.test(username)) {
    throw new HttpsError('invalid-argument', 'Username 3-20 karakter: huruf kecil, angka, atau _.');
  }
  if (!name) throw new HttpsError('invalid-argument', 'Nama wajib diisi.');
  if (password.length < 8) throw new HttpsError('invalid-argument', 'Password minimal 8 karakter.');
  if (!ROLES.includes(role)) throw new HttpsError('invalid-argument', 'Peran tidak valid.');

  let uid: string;
  try {
    uid = (await auth.createUser({ email: emailOf(username), password, displayName: name })).uid;
  } catch (e) {
    if ((e as { code?: string }).code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'Username sudah dipakai.');
    }
    throw new HttpsError('internal', 'Gagal membuat user.');
  }
  await db.doc(`users/${uid}`).set({ username, name, role, createdAt: new Date().toISOString() });
  return { ok: true, username };
});

export const deleteUser = onCall(async (req) => {
  const selfUid = await requireAdmin(req);
  const username = str(req.data?.username, 20).toLowerCase();
  const uid = await uidOfUsername(username);
  if (uid === selfUid) throw new HttpsError('failed-precondition', 'Anda tidak bisa menghapus akun sendiri.');
  const target = (await db.doc(`users/${uid}`).get()).data();
  if (target?.role === 'admin') {
    const admins = await db.collection('users').where('role', '==', 'admin').get();
    if (admins.size <= 1) throw new HttpsError('failed-precondition', 'Admin terakhir tidak bisa dihapus.');
  }
  // Hapus profil dulu: firestore.rules membaca dokumen ini, jadi akses langsung dicabut.
  await db.doc(`users/${uid}`).delete();
  await auth.deleteUser(uid).catch(() => undefined);
  return { ok: true };
});

export const setUserPassword = onCall(async (req) => {
  await requireAdmin(req);
  const username = str(req.data?.username, 20).toLowerCase();
  const newPassword = String(req.data?.newPassword ?? '');
  if (newPassword.length < 8) throw new HttpsError('invalid-argument', 'Password baru minimal 8 karakter.');
  const uid = await uidOfUsername(username);
  await auth.updateUser(uid, { password: newPassword });
  await auth.revokeRefreshTokens(uid);
  return { ok: true };
});
