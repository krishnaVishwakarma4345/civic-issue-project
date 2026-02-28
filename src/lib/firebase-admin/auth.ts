import { adminAuth, adminDb } from "./config";
import { DecodedIdToken } from "firebase-admin/auth";
import { User } from "@/types/user";

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
      createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt,
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

  if (user.role !== "admin") {
    throw new Error("FORBIDDEN: Admin access required");
  }

  return user;
};

// ─── Set Custom Claims (admin promotion) ─────────────────────

export const setAdminClaim = async (uid: string): Promise<void> => {
  await adminAuth.setCustomUserClaims(uid, { role: "admin" });
};
```

---

## 📁 Firebase Security Rules

---

### `firestore.rules`
```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // ─── Helper Functions ────────────────────────────────────

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(uid) {
      return isAuthenticated() && request.auth.uid == uid;
    }

    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }

    function isAdmin() {
      return isAuthenticated() && getUserRole() == 'admin';
    }

    function isCitizen() {
      return isAuthenticated() && getUserRole() == 'citizen';
    }

    function isValidIssueStatus(status) {
      return status in ['reported', 'assigned', 'in-progress', 'resolved'];
    }

    function isValidCategory(category) {
      return category in ['road', 'garbage', 'water', 'streetlight', 'sanitation'];
    }

    function isValidPriority(priority) {
      return priority in ['low', 'medium', 'high'];
    }

    // ─── Users Collection ─────────────────────────────────────

    match /users/{userId} {

      // Anyone can read their own document; admins can read all
      allow read: if isOwner(userId) || isAdmin();

      // Users can create only their own document
      allow create: if isOwner(userId)
        && request.resource.data.keys().hasAll(['uid', 'name', 'email', 'role', 'createdAt'])
        && request.resource.data.role in ['citizen', 'admin']
        && request.resource.data.uid == userId;

      // Users can update only their own document
      // Role field cannot be changed by users (only by admin SDK)
      allow update: if isOwner(userId)
        && !('role' in request.resource.data.diff(resource.data).affectedKeys())
        && !('uid' in request.resource.data.diff(resource.data).affectedKeys());

      // Only admin SDK can delete users
      allow delete: if false;
    }

    // ─── Issues Collection ────────────────────────────────────

    match /issues/{issueId} {

      // Citizens can read their own issues; admins can read all
      allow read: if isAuthenticated()
        && (resource.data.citizenId == request.auth.uid || isAdmin());

      // Citizens can create issues
      allow create: if isCitizen()
        && request.resource.data.citizenId == request.auth.uid
        && isValidCategory(request.resource.data.category)
        && isValidPriority(request.resource.data.priority)
        && request.resource.data.status == 'reported'
        && request.resource.data.title.size() >= 5
        && request.resource.data.title.size() <= 100
        && request.resource.data.description.size() >= 20
        && request.resource.data.description.size() <= 1000;

      // Citizens can update only their own images; admins can update everything
      allow update: if isAuthenticated()
        && (
          // Admin can update status, department, remarks
          isAdmin()
          ||
          // Citizen can only update images on their own issue
          (
            resource.data.citizenId == request.auth.uid
            && request.resource.data.diff(resource.data).affectedKeys()
               .hasOnly(['images', 'updatedAt'])
          )
        );

      // No direct deletes allowed from client
      allow delete: if false;
    }

    // ─── Deny all other collections ───────────────────────────
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

### `storage.rules`
```
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {

    // ─── Helper Functions ─────────────────────────────────────

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(uid) {
      return request.auth.uid == uid;
    }

    function isValidImageType() {
      return request.resource.contentType.matches('image/(jpeg|jpg|png|webp)');
    }

    function isUnder5MB() {
      return request.resource.size < 5 * 1024 * 1024;
    }

    // ─── Issue Images ─────────────────────────────────────────

    match /issues/{citizenId}/{issueId}/{fileName} {

      // Only the owner can read their own issue images
      // (public URL access is handled via Firestore URL storage)
      allow read: if isAuthenticated();

      // Only the issue's owner can upload images
      // Files must be valid images under 5MB
      allow write: if isAuthenticated()
        && isOwner(citizenId)
        && isValidImageType()
        && isUnder5MB();

      // Citizens can delete their own; admins can delete any
      allow delete: if isAuthenticated()
        && (isOwner(citizenId));
    }

    // ─── Profile Photos (optional future use) ─────────────────

    match /profiles/{userId}/{fileName} {
      allow read:  if isAuthenticated();
      allow write: if isAuthenticated()
        && isOwner(userId)
        && isValidImageType()
        && request.resource.size < 2 * 1024 * 1024;
      allow delete: if isAuthenticated() && isOwner(userId);
    }

    // ─── Deny all other paths ─────────────────────────────────

    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}