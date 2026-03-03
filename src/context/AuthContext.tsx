"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { User as FirebaseUser }       from "firebase/auth";
import { doc, onSnapshot }            from "firebase/firestore";
import { onAuthChange }               from "@/lib/firebase/auth";
import { db }                         from "@/lib/firebase/config";
import { COLLECTIONS, getUserDocument } from "@/lib/firebase/firestore";
import { User }                       from "@/types/user";

// ─── Types ───────────────────────────────────────────────────

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  userData:     User | null;
  loading:      boolean;
  error:        string | null;
  isAdmin:      boolean;
  isCitizen:    boolean;
  isLoggedIn:   boolean;
  refreshUser:  () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Helper: Firestore doc → User ────────────────────────────

const snapToUser = (snap: import("firebase/firestore").DocumentSnapshot): User | null => {
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    ...data,
    uid:       snap.id,
    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt ?? "",
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? data.updatedAt,
  } as User;
};

// ─── Provider ────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userData,     setUserData]     = useState<User | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  // refreshUser kept for backward compatibility — components that call it
  // will just trigger a manual re-fetch, but in practice the onSnapshot
  // listener will have already updated userData automatically.
  const refreshUser = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const data = await getUserDocument(firebaseUser.uid);
      setUserData(data);
    } catch (err) {
      console.error("[AuthContext] refreshUser failed:", err);
    }
  }, [firebaseUser]);

  useEffect(() => {
    let userDocUnsubscribe: (() => void) | null = null;

    // 1. Subscribe to Firebase Auth state
    const authUnsubscribe = onAuthChange((user) => {
      setError(null);

      // Tear down the previous user-doc listener whenever auth state changes
      if (userDocUnsubscribe) {
        userDocUnsubscribe();
        userDocUnsubscribe = null;
      }

      if (user) {
        setFirebaseUser(user);

        // 2. Start a REAL-TIME listener on this user's Firestore document.
        //    This means any profile edit (name, phone, address, etc.) saved
        //    by the profile page will instantly update userData everywhere —
        //    sidebar, header, profile page — with no manual refresh needed.
        const userRef = doc(db, COLLECTIONS.USERS, user.uid);
        userDocUnsubscribe = onSnapshot(
          userRef,
          (snap) => {
            const parsed = snapToUser(snap);
            if (!parsed) {
              setError("User profile not found.");
            } else {
              setUserData(parsed);
              setError(null);
            }
            setLoading(false);
          },
          (err) => {
            console.error("[AuthContext] user doc snapshot error:", err);
            setError("Failed to load user profile.");
            setLoading(false);
          }
        );
      } else {
        // Logged out
        setFirebaseUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    // Cleanup both listeners on unmount
    return () => {
      authUnsubscribe();
      if (userDocUnsubscribe) userDocUnsubscribe();
    };
  }, []); // runs once on mount — onSnapshot handles all future updates

  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseUser,
      userData,
      loading,
      error,
      isAdmin:    userData?.role === "admin",
      isCitizen:  userData?.role === "citizen",
      isLoggedIn: !!firebaseUser && !!userData,
      refreshUser,
    }),
    [firebaseUser, userData, loading, error, refreshUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────

export const useAuthContext = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an <AuthProvider>");
  }
  return context;
};