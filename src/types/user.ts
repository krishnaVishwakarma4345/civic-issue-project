// src/types/user.ts

import type { IssueCategory } from "@/types/issue";

export type UserRole = "citizen" | "department-admin" | "master-admin";

export interface User {
  uid:       string;
  name:      string;
  email:     string;
  role:      UserRole;
  photoURL?: string;
  phone?:    string;
  createdAt: string;
  updatedAt?: string;

  // ── Extended profile fields (added for profile page) ────────
  age?:           number;
  gender?:        "male" | "female" | "other" | "prefer_not_to_say";
  occupation?:    string;
  qualification?: string;
  address?:       string;
  city?:          string;
  state?:         string;
  pincode?:       string;
  bio?:           string;

  // Admin scope (used when role = "department-admin")
  adminCategory?: IssueCategory;
}

// ── Kept exactly as-is from your original file ────────────────

export interface UserProfile extends User {
  totalIssuesReported?: number;
  totalIssuesResolved?: number;
}

export interface AuthUser {
  uid:           string;
  email:         string | null;
  displayName:   string | null;
  photoURL:      string | null;
  emailVerified: boolean;
}

export interface RegisterPayload {
  name:     string;
  email:    string;
  password: string;
  role?:    UserRole;
}

export interface LoginPayload {
  email:    string;
  password: string;
}