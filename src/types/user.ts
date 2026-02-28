export type UserRole = "citizen" | "admin";

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  photoURL?: string;
  phone?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserProfile extends User {
  totalIssuesReported?: number;
  totalIssuesResolved?: number;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}