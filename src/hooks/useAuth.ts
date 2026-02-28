"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { useAuthStore } from "@/store/authStore";
import {
  registerWithEmail,
  loginWithEmail,
  logoutUser,
  sendPasswordReset,
  getIdToken,
} from "@/lib/firebase/auth";
import { RegisterPayload, LoginPayload } from "@/types/user";
import toast from "react-hot-toast";

export const useAuth = () => {
  const router                    = useRouter();
  const { userData, loading }     = useAuthContext();
  const { setUser, setToken, clearAuth } = useAuthStore();
  const [authLoading, setAuthLoading]   = useState(false);
  const [authError,   setAuthError]     = useState<string | null>(null);

  // ─── Register ──────────────────────────────────────────────

  const register = useCallback(
    async (payload: RegisterPayload): Promise<boolean> => {
      setAuthLoading(true);
      setAuthError(null);

      try {
        const { userData: newUser } = await registerWithEmail(payload);
        setUser(newUser);

        toast.success(
          "Account created! Please verify your email before logging in."
        );
        router.push("/login");
        return true;
      } catch (err: unknown) {
        const message = getFirebaseAuthError(err);
        setAuthError(message);
        toast.error(message);
        return false;
      } finally {
        setAuthLoading(false);
      }
    },
    [router, setUser]
  );

  // ─── Login ─────────────────────────────────────────────────

  const login = useCallback(
    async (payload: LoginPayload): Promise<boolean> => {
      setAuthLoading(true);
      setAuthError(null);

      try {
        const { user, userData: loggedInUser } = await loginWithEmail(payload);

        if (!loggedInUser) {
          throw new Error("User profile not found. Please contact support.");
        }

        // Fetch and store fresh ID token
        const token = await getIdToken(true);
        setUser(loggedInUser);
        setToken(token);

        toast.success(`Welcome back, ${loggedInUser.name}!`);

        // Role-based redirect
        if (loggedInUser.role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/dashboard");
        }

        return true;
      } catch (err: unknown) {
        const message = getFirebaseAuthError(err);
        setAuthError(message);
        toast.error(message);
        return false;
      } finally {
        setAuthLoading(false);
      }
    },
    [router, setUser, setToken]
  );

  // ─── Logout ────────────────────────────────────────────────

  const logout = useCallback(async () => {
    setAuthLoading(true);
    try {
      await logoutUser();
      clearAuth();
      toast.success("Logged out successfully.");
      router.push("/login");
    } catch (err) {
      toast.error("Logout failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }, [router, clearAuth]);

  // ─── Password Reset ────────────────────────────────────────

  const forgotPassword = useCallback(async (email: string): Promise<boolean> => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await sendPasswordReset(email);
      toast.success("Password reset email sent. Check your inbox.");
      return true;
    } catch (err: unknown) {
      const message = getFirebaseAuthError(err);
      setAuthError(message);
      toast.error(message);
      return false;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  return {
    userData,
    loading: loading || authLoading,
    authLoading,
    authError,
    register,
    login,
    logout,
    forgotPassword,
  };
};

// ─── Firebase Error Messages ──────────────────────────────────

const getFirebaseAuthError = (err: unknown): string => {
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = (err as { code: string }).code;
    const messages: Record<string, string> = {
      "auth/email-already-in-use":    "This email is already registered.",
      "auth/invalid-email":           "Please enter a valid email address.",
      "auth/weak-password":           "Password is too weak. Use at least 8 characters.",
      "auth/user-not-found":          "No account found with this email.",
      "auth/wrong-password":          "Incorrect password. Please try again.",
      "auth/invalid-credential":      "Invalid email or password.",
      "auth/too-many-requests":       "Too many attempts. Please try again later.",
      "auth/network-request-failed":  "Network error. Check your connection.",
      "auth/user-disabled":           "This account has been disabled.",
    };
    return messages[code] ?? "An unexpected error occurred. Please try again.";
  }
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred.";
};