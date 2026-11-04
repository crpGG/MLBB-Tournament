// Membuat akun awal (1 admin + 4 panitia) dengan password acak. Jalankan SEKALI:
//   gcloud auth application-default login   (atau set GOOGLE_APPLICATION_CREDENTIALS)
//   GCLOUD_PROJECT=<project-id> node scripts/seed-users.mjs
// Password tercetak sekali di layar; catat lalu ganti lewat menu Ganti Password.
import { createRequire } from 'module';
import crypto from 'crypto';
const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

if (!process.env.GCLOUD_PROJECT) throw new Error('Set GCLOUD_PROJECT=<project-id> terlebih dahulu.');
initializeApp({ projectId: process.env.GCLOUD_PROJECT });
const auth = getAuth();
const db = getFirestore();

const alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const randomPw = () => Array.from(crypto.randomBytes(12), (b) => alpha[b % alpha.length]).join('');

const USERS = [
  ['admin', 'Administrator', 'admin'],
  ['panitia1', 'Panitia 1', 'panitia'],
  ['panitia2', 'Panitia 2', 'panitia'],
  ['panitia3', 'Panitia 3', 'panitia'],
  ['panitia4', 'Panitia 4', 'panitia'],
];

for (const [username, name, role] of USERS) {
  const password = randomPw();
  try {
    const { uid } = await auth.createUser({ email: `${username}@mlbb-app.local`, password, displayName: name });
    await db.doc(`users/${uid}`).set({ username, name, role, createdAt: new Date().toISOString() });
    console.log(`${username.padEnd(10)} ${role.padEnd(8)} ${password}`);
  } catch (e) {
    console.log(`${username.padEnd(10)} dilewati (${e.code || e.message})`);
  }
}
