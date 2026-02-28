"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { User as FirebaseUser } from "firebase/auth";
import { onAuthChange } from "@/lib/firebase/auth";
import { getUserDocument } from "@/lib/firebase/firestore";
import { User } from "@/types/user";

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

// ─── Provider ────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userData,     setUserData]     = useState<User | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  const fetchUserData = useCallback(async (uid: string) => {
    try {
      const data = await getUserDocument(uid);
      setUserData(data);
    } catch (err) {
      console.error("[AuthContext] Failed to fetch user document:", err);
      setError("Failed to load user profile.");
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!firebaseUser) return;
    await fetchUserData(firebaseUser.uid);
  }, [firebaseUser, fetchUserData]);

  useEffect(() => {
    // Subscribe to Firebase Auth state changes
    const unsubscribe = onAuthChange(async (user) => {
      setError(null);

      if (user) {
        setFirebaseUser(user);
        await fetchUserData(user.uid);
      } else {
        setFirebaseUser(null);
        setUserData(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserData]);

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