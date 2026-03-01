import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth }      from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ─── Firebase Config ──────────────────────────────────────────

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ─── Validate ─────────────────────────────────────────────────
// Only warn in development instead of throwing — prevents
// hard crashes when .env.local is present but not yet loaded

if (process.env.NODE_ENV === "development") {
  const missing = Object.entries(firebaseConfig)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length > 0) {
    console.warn(
      "[Firebase] Missing environment variables:",
      missing.join(", "),
      "\nCheck your .env.local file."
    );
  }
}

// ─── Initialize Firebase (singleton) ─────────────────────────

const app  = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
export default app;