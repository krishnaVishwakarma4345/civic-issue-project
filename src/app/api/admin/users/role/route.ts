import { NextRequest } from "next/server";
import { z } from "zod";
import { adminAuth, adminDb } from "@/lib/firebase-admin/config";
import { requireAdmin } from "@/lib/firebase-admin/auth";
import {
  forbiddenResponse,
  notFoundResponse,
  parseAuthError,
  serverErrorResponse,
  successResponse,
} from "@/app/api/_lib/apiResponse";
import { validateBody } from "@/app/api/_lib/apiValidation";
import { FieldValue } from "firebase-admin/firestore";

const updateUserRoleSchema = z
  .object({
    email: z.string().trim().email(),
    role: z.enum(["citizen", "master-admin", "department-admin"]),
    adminCategory: z
      .enum(["road", "garbage", "water", "streetlight"])
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "department-admin" && !data.adminCategory) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["adminCategory"],
        message: "adminCategory is required for department-admin.",
      });
    }

    if (data.role !== "department-admin" && data.adminCategory) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["adminCategory"],
        message: "adminCategory must be empty unless role is department-admin.",
      });
    }
  });

// PATCH /api/admin/users/role
export async function PATCH(req: NextRequest) {
  let requester;
  try {
    requester = await requireAdmin(req);
  } catch (err) {
    return parseAuthError(err);
  }

  if (requester.role !== "master-admin") {
    return forbiddenResponse("Only master-admin can change user roles.");
  }

  const validation = await validateBody(req, updateUserRoleSchema);
  if (!validation.success) return validation.response;

  const { email, role, adminCategory } = validation.data;

  if (
    requester.email.toLowerCase() === email.toLowerCase() &&
    role !== "master-admin"
  ) {
    return forbiddenResponse("You cannot demote your own master-admin account.");
  }

  try {
    const authUser = await adminAuth.getUserByEmail(email).catch(() => null);
    if (!authUser) return notFoundResponse("No registered user found for this email.");

    const userRef = adminDb.collection("users").doc(authUser.uid);
    const existingSnap = await userRef.get();
    if (!existingSnap.exists) {
      return notFoundResponse("User profile document not found.");
    }

    const prevData = existingSnap.data() as {
      role?: string;
      adminCategory?: string | null;
    };

    await userRef.set(
      {
        role,
        adminCategory: role === "department-admin" ? adminCategory : null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Keep claims aligned for future middleware/authorization use.
    await adminAuth.setCustomUserClaims(authUser.uid, {
      role,
    });

    return successResponse(
      {
        uid: authUser.uid,
        email: authUser.email,
        previousRole: prevData?.role ?? null,
        previousAdminCategory: prevData?.adminCategory ?? null,
        role,
        adminCategory: role === "department-admin" ? adminCategory : null,
      },
      "User role updated successfully."
    );
  } catch (err) {
    console.error("[API /admin/users/role]", err);
    return serverErrorResponse();
  }
}
