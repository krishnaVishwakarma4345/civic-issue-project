import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  User as FirebaseUser,
  UserCredential,
} from "firebase/auth";
import { auth } from "./config";
import { createUserDocument, getUserDocument } from "./firestore";
import { RegisterPayload, LoginPayload, User } from "@/types/user";

// ─── Register ────────────────────────────────────────────────

export const registerWithEmail = async (
  payload: RegisterPayload
): Promise<{ user: FirebaseUser; userData: User }> => {
  const { name, email, password, role = "citizen" } = payload;

  const credential: UserCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const firebaseUser = credential.user;

  // Update Firebase Auth display name
  await updateProfile(firebaseUser, { displayName: name });

  // Send email verification
  await sendEmailVerification(firebaseUser);

  // Create Firestore user document
  const userData: User = {
    uid:       firebaseUser.uid,
    name,
    email,
    role,
    createdAt: new Date().toISOString(),
  };

  await createUserDocument(firebaseUser.uid, userData);

  return { user: firebaseUser, userData };
};

// ─── Login ───────────────────────────────────────────────────

export const loginWithEmail = async (
  payload: LoginPayload
): Promise<{ user: FirebaseUser; userData: User | null }> => {
  const { email, password } = payload;

  const credential: UserCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  const firebaseUser = credential.user;

  // Block login if email has not been verified yet
  if (!firebaseUser.emailVerified) {
    await signOut(auth); // sign them back out immediately
    throw { code: "auth/email-not-verified" };
  }

  const userData = await getUserDocument(firebaseUser.uid);

  return { user: firebaseUser, userData };
};

// ─── Logout ──────────────────────────────────────────────────

export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};

// ─── Password Reset ──────────────────────────────────────────

export const sendPasswordReset = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

// ─── Resend Verification Email ───────────────────────────────

export const resendVerificationEmail = async (
  email: string,
  password: string
): Promise<void> => {
  // Sign in temporarily just to get the user object, then send verification
  const credential: UserCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  if (credential.user.emailVerified) {
    await signOut(auth);
    throw { code: "auth/email-already-verified" };
  }

  await sendEmailVerification(credential.user);
  await signOut(auth); // sign back out — they're still unverified
};

// ─── Get ID Token ────────────────────────────────────────────

export const getIdToken = async (forceRefresh = false): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken(forceRefresh);
};

// ─── Auth State Observer ─────────────────────────────────────

export const onAuthChange = (
  callback: (user: FirebaseUser | null) => void
) => {
  return onAuthStateChanged(auth, callback);
};