import { NextRequest }  from "next/server";
import { z }            from "zod";
import { requireAuth }  from "@/lib/firebase-admin/auth";
import { adminDb }      from "@/lib/firebase-admin/config";
import {
  successResponse,
  notFoundResponse,
  forbiddenResponse,
  serverErrorResponse,
  validationErrorResponse,
  parseAuthError,
} from "@/app/api/_lib/apiResponse";
import { validateBody } from "@/app/api/_lib/apiValidation";
import { FieldValue }   from "firebase-admin/firestore";

// ─── Schemas ──────────────────────────────────────────────────

// What admin can update
const adminUpdateSchema = z.object({
  id: z.string().min(1, "Issue ID is required"),
  status: z
    .enum(["reported", "assigned", "in-progress", "resolved"])
    .optional(),
  assignedDepartment: z
    .string()
    .max(100)
    .optional()
    .nullable(),
  adminRemarks: z
    .string()
    .max(500, "Remarks must be under 500 characters")
    .optional()
    .nullable(),
  priority: z.enum(["low", "medium", "high"]).optional(),
});

// What citizen can update (only images)
const citizenUpdateSchema = z.object({
  id:     z.string().min(1, "Issue ID is required"),
  images: z.array(z.string().url()).max(5),
});

// ─── PATCH /api/issues/update ─────────────────────────────────

export async function PATCH(req: NextRequest) {
  // 1. Authenticate
  let user;
  try {
    user = await requireAuth(req);
  } catch (err) {
    return parseAuthError(err);
  }

  // 2. Parse body (read once)
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return validationErrorResponse("Invalid JSON body.");
  }

  // 3. Validate by role
  let updateData: Record<string, unknown> = {};
  let issueId: string;
  const isDepartmentAdmin = user.role === "department-admin";
  const isMasterAdmin = user.role === "master-admin";
  const isCitizen = user.role === "citizen";

  if (isDepartmentAdmin || isMasterAdmin) {
    if (isMasterAdmin) {
      return forbiddenResponse("Master admin is read-only and cannot modify issues.");
    }

    const result = adminUpdateSchema.safeParse(body);
    if (!result.success) {
      const msg = result.error.errors[0]?.message ?? "Validation failed.";
      return validationErrorResponse(msg);
    }
    const { id, ...rest } = result.data;
    issueId    = id;
    updateData = Object.fromEntries(
      Object.entries(rest).filter(([, v]) => v !== undefined)
    );
  } else {
    // Citizen
    const result = citizenUpdateSchema.safeParse(body);
    if (!result.success) {
      const msg = result.error.errors[0]?.message ?? "Validation failed.";
      return validationErrorResponse(msg);
    }
    const { id, images } = result.data;
    issueId    = id;
    updateData = { images };
  }

  if (Object.keys(updateData).length === 0) {
    return validationErrorResponse("No valid fields to update.");
  }

  try {
    const docRef  = adminDb.collection("issues").doc(issueId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return notFoundResponse(`Issue "${issueId}" not found.`);
    }

    const existingData = docSnap.data()!;

    // Citizens can only update their own issues
    if (isCitizen && existingData.citizenId !== user.uid) {
      return forbiddenResponse("You cannot modify this issue.");
    }

    if (isDepartmentAdmin) {
      if (!user.adminCategory) {
        return forbiddenResponse("Your admin category is not assigned.");
      }
      if (existingData.category !== user.adminCategory) {
        return forbiddenResponse("You can only modify issues in your assigned category.");
      }
    }

    // ─── Status transition validation ─────────────────────
    if (updateData.status && isDepartmentAdmin) {
      const validTransitions: Record<string, string[]> = {
        reported:    ["assigned"],
        assigned:    ["in-progress"],
        "in-progress": ["resolved"],
        resolved:    [],
      };

      const currentStatus = existingData.status as string;
      const nextStatus    = updateData.status   as string;
      const allowed       = validTransitions[currentStatus] ?? [];

      if (!allowed.includes(nextStatus)) {
        return validationErrorResponse(
          `Cannot transition issue from "${currentStatus}" to "${nextStatus}".`
        );
      }
    }

    // ─── Write update ─────────────────────────────────────
    await docRef.update({
      ...updateData,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // ─── Return updated doc ───────────────────────────────
    const updatedSnap = await docRef.get();
    const updatedData = updatedSnap.data()!;

    return successResponse(
      {
        ...updatedData,
        id:        issueId,
        createdAt: updatedData.createdAt?.toDate?.()?.toISOString() ?? updatedData.createdAt,
        updatedAt: new Date().toISOString(),
      },
      "Issue updated successfully."
    );
  } catch (err) {
    console.error("[API /issues/update]", err);
    return serverErrorResponse();
  }
}