import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase's client SDK is browser-only. Every consumer of auth/db/storage in
// this app is a "use client" component that only touches them inside
// useEffect/event handlers, so it's safe for these to be undefined during
// server-side rendering / build-time prerendering.
//
// Storage is initialized separately from Auth/Firestore and is allowed to
// fail on its own: Firebase Cloud Storage now requires the Blaze (paid)
// plan (enforced since Feb 2026), so a project on the free Spark plan may
// have no usable storage bucket at all. If getStorage() throws here, Auth
// and Firestore -- which don't need Storage and work fine on Spark -- must
// keep working. `storage` becomes undefined and features that need it (the
// photo-evidence upload) check `isStorageConfigured()` and degrade instead
// of crashing.
function initCore() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return { app, auth: getAuth(app), db: getFirestore(app) };
}

const core = typeof window !== "undefined" ? initCore() : undefined;

let storageInstance: FirebaseStorage | undefined;
if (core) {
  try {
    storageInstance = getStorage(core.app);
  } catch (err) {
    console.warn(
      "Firebase Storage tidak tersedia (kemungkinan project masih di paket Spark, yang tidak lagi mendapat akses Cloud Storage gratis sejak Feb 2026). Fitur upload foto akan disembunyikan.",
      err
    );
  }
}

export const auth = core?.auth as Auth;
export const db = core?.db as Firestore;
export const storage = storageInstance;
export const isStorageConfigured = () => storageInstance !== undefined;
export default core?.app;
