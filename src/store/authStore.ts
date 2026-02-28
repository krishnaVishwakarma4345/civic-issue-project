import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import { User } from "@/types/user";

// ─── Types ───────────────────────────────────────────────────

interface AuthState {
  userData:   User | null;
  token:      string | null;
  hydrated:   boolean;
  setUser:    (user: User | null) => void;
  setToken:   (token: string | null) => void;
  setHydrated:(v: boolean) => void;
  clearAuth:  () => void;
}

// ─── Store ───────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        userData:    null,
        token:       null,
        hydrated:    false,

        setUser: (user) =>
          set({ userData: user }, false, "auth/setUser"),

        setToken: (token) =>
          set({ token }, false, "auth/setToken"),

        setHydrated: (v) =>
          set({ hydrated: v }, false, "auth/setHydrated"),

        clearAuth: () =>
          set(
            { userData: null, token: null },
            false,
            "auth/clearAuth"
          ),
      }),
      {
        name:    "civic-auth-store",
        // Only persist non-sensitive data
        partialize: (state) => ({
          userData: state.userData
            ? {
                uid:   state.userData.uid,
                name:  state.userData.name,
                email: state.userData.email,
                role:  state.userData.role,
              }
            : null,
        }),
        onRehydrateStorage: () => (state) => {
          state?.setHydrated(true);
        },
      }
    ),
    { name: "AuthStore" }
  )
);