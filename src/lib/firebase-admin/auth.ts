import { adminAuth, adminDb } from "./config";
import { DecodedIdToken } from "firebase-admin/auth";
import { User } from "@/types/user";
import { IssueCategory } from "@/types/issue";

// ─── Verify ID Token ─────────────────────────────────────────

export const verifyIdToken = async (
  token: string
): Promise<DecodedIdToken | null> => {
  try {
    const decoded = await adminAuth.verifyIdToken(token, true);
    return decoded;
  } catch (error) {
    console.error("[Admin Auth] Token verification failed:", error);
    return null;
  }
};

// ─── Get User from Token ──────────────────────────────────────

export const getUserFromToken = async (
  token: string
): Promise<User | null> => {
  const decoded = await verifyIdToken(token);
  if (!decoded) return null;

  try {
    const userSnap = await adminDb
      .collection("users")
      .doc(decoded.uid)
      .get();

    if (!userSnap.exists) return null;

    const data = userSnap.data()!;
    return {
      uid:       userSnap.id,
      name:      data.name,
      email:     data.email,
      role:      data.role,
      adminCategory: data.adminCategory,
      createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? data.updatedAt,
    } as User;
  } catch (error) {
    console.error("[Admin Auth] Failed to fetch user document:", error);
    return null;
  }
};

// ─── Extract Token from Request ──────────────────────────────

export const extractTokenFromRequest = (
  request: Request
): string | null => {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.split("Bearer ")[1].trim();
};

// ─── Require Auth (throws if invalid) ────────────────────────

export const requireAuth = async (
  request: Request
): Promise<User> => {
  const token = extractTokenFromRequest(request);
  if (!token) {
    throw new Error("UNAUTHORIZED: No token provided");
  }

  const user = await getUserFromToken(token);
  if (!user) {
    throw new Error("UNAUTHORIZED: Invalid or expired token");
  }

  return user;
};

// ─── Require Admin Role ───────────────────────────────────────

export const requireAdmin = async (
  request: Request
): Promise<User> => {
  const user = await requireAuth(request);

  if (user.role !== "department-admin" && user.role !== "master-admin") {
    throw new Error("FORBIDDEN: Admin access required");
  }

  return user;
};

export const isDepartmentAdmin = (user: User): boolean =>
  user.role === "department-admin";

export const isMasterAdmin = (user: User): boolean =>
  user.role === "master-admin";

export const requireDepartmentScope = (user: User): IssueCategory => {
  if (user.role !== "department-admin") {
    throw new Error("FORBIDDEN: Department admin access required");
  }

  if (!user.adminCategory) {
    throw new Error("FORBIDDEN: Admin category is not assigned");
  }

  return user.adminCategory;
};

// ─── Set Custom Claims (admin promotion) ─────────────────────

export const setAdminClaim = async (uid: string): Promise<void> => {
  await adminAuth.setCustomUserClaims(uid, { role: "admin" });
};


export const removeAdminClaim = async (uid: string): Promise<void> => {
  await adminAuth.setCustomUserClaims(uid, { role: "user" });
}