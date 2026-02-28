"use client";

import { useCookieSync } from "@/hooks/useCookieSync";

/**
 * Mounts the cookie sync hook inside the client tree.
 * Keeps middleware auth cookies in sync with Firebase Auth state.
 * Renders nothing — purely a side-effect component.
 */
export default function CookieSyncWrapper() {
  useCookieSync();
  return null;
}