import {
  initializeApp,
  getApps,
  getApp,
  cert,
  App,
} from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

// ─── Validate Required Env Vars ──────────────────────────────

const requiredAdminEnvVars = [
  "FIREBASE_ADMIN_PROJECT_ID",
  "FIREBASE_ADMIN_CLIENT_EMAIL",
  "FIREBASE_ADMIN_PRIVATE_KEY",
] as const;

requiredAdminEnvVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(
      `[Firebase Admin] Missing required environment variable: ${key}`
    );
  }
});

// ─── Singleton Initialization ────────────────────────────────

const getAdminApp = (): App => {
  if (getApps().length > 0) return getApp();

  return initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_ADMIN_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
      // Vercel/env escaping fix — replace literal \n with actual newlines
      privateKey:  process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(
        /\\n/g,
        "\n"
      ),
    }),
  });
};

const adminApp: App         = getAdminApp();
const adminDb: Firestore    = getFirestore(adminApp);
const adminAuth: Auth       = getAuth(adminApp);

export { adminApp, adminDb, adminAuth };