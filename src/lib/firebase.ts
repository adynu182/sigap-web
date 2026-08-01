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
// server-side rendering / build-time prerendering. Initializing inside this
// helper (instead of at module scope) keeps `app` a plain non-nullable
// FirebaseApp for getAuth/getFirestore/getStorage, so TypeScript doesn't
// need to deal with an `undefined` branch on every call.
function initFirebaseClient() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    storage: getStorage(app),
  };
}

const client = typeof window !== "undefined" ? initFirebaseClient() : undefined;

export const auth = client?.auth as Auth;
export const db = client?.db as Firestore;
export const storage = client?.storage as FirebaseStorage;
export default client?.app;
