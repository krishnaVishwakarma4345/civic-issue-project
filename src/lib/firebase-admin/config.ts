import {
  initializeApp,
  getApps,
  getApp,
  cert,
  App,
} from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

const requiredAdminEnvVars = [
  "FIREBASE_ADMIN_PROJECT_ID",
  "FIREBASE_ADMIN_CLIENT_EMAIL",
  "FIREBASE_ADMIN_PRIVATE_KEY",
] as const;

const normalizePrivateKey = (value: string): string => {
  const trimmed = value.trim().replace(/^"|"$/g, "").replace(/^'|'$/g, "");
  return trimmed.replace(/\\n/g, "\n");
};

let cachedApp: App | null = null;
let cachedDb: Firestore | null = null;
let cachedAuth: Auth | null = null;

const ensureAdminInitialized = (): void => {
  if (cachedApp && cachedDb && cachedAuth) return;

  requiredAdminEnvVars.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(
        `[Firebase Admin] Missing required environment variable: ${key}`
      );
    }
  });

  cachedApp = getApps().length > 0
    ? getApp()
    : initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
          privateKey: normalizePrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY!),
        }),
      });

  cachedDb = getFirestore(cachedApp);
  cachedAuth = getAuth(cachedApp);
};

const createLazyProxy = <T extends object>(getter: () => T): T => {
  return new Proxy({} as T, {
    get(_target, prop) {
      const instance = getter() as Record<PropertyKey, unknown>;
      const value = instance[prop];
      if (typeof value === "function") {
        return (value as (...args: unknown[]) => unknown).bind(instance);
      }
      return value;
    },
  });
};

export const getAdminApp = (): App => {
  ensureAdminInitialized();
  return cachedApp!;
};

export const getAdminDb = (): Firestore => {
  ensureAdminInitialized();
  return cachedDb!;
};

export const getAdminAuth = (): Auth => {
  ensureAdminInitialized();
  return cachedAuth!;
};

export const adminApp: App = createLazyProxy(getAdminApp);
export const adminDb: Firestore = createLazyProxy(getAdminDb);
export const adminAuth: Auth = createLazyProxy(getAdminAuth);
