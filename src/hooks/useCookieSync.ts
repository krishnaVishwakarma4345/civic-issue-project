"use client";

/**
 * Syncs Firebase auth state to cookies so Next.js middleware
 * can read role + token for server-side route protection.
 *
 * Call this once inside AuthProvider or root layout.
 */

import { useEffect } from "react";
import { onAuthChange, getIdToken } from "@/lib/firebase/auth";
import { getUserDocument } from "@/lib/firebase/firestore";

const COOKIE_MAX_AGE = 60 * 60; // 1 hour

const setCookie = (name: string, value: string, maxAge: number) => {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax; Secure`;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=; path=/; max-age=0`;
};

export const useCookieSync = () => {
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const [token, userData] = await Promise.all([
            getIdToken(false),
            getUserDocument(firebaseUser.uid),
          ]);

          if (token) {
            setCookie("auth-token", token, COOKIE_MAX_AGE);
          }
          if (userData?.role) {
            setCookie("user-role", userData.role, COOKIE_MAX_AGE);
          }
        } catch (err) {
          console.error("[CookieSync] Failed to sync auth cookies:", err);
        }
      } else {
        deleteCookie("auth-token");
        deleteCookie("user-role");
      }
    });

    return () => unsubscribe();
  }, []);
};