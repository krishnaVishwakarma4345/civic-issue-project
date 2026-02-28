import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/firebase-admin/auth";
import { adminDb }     from "@/lib/firebase-admin/config";
import {
  successResponse,
  notFoundResponse,
  forbiddenResponse,
  serverErrorResponse,
  parseAuthError,
} from "@/app/api/_lib/apiResponse";

interface RouteParams {
  params: { id: string };
}

// ─── GET /api/issues/[id] ─────────────────────────────────────

export async function GET(req: NextRequest, { params }: RouteParams) {
  // 1. Authenticate
  let user;
  try {
    user = await requireAuth(req);
  } catch (err) {
    return parseAuthError(err);
  }

  const { id } = params;

  if (!id) return notFoundResponse("Issue ID is required.");

  try {
    const docSnap = await adminDb.collection("issues").doc(id).get();

    if (!docSnap.exists) {
      return notFoundResponse(`Issue with ID "${id}" not found.`);
    }

    const data = docSnap.data()!;

    // ─── Access control ───────────────────────────────────
    // Citizens can only view their own issues
    if (user.role === "citizen" && data.citizenId !== user.uid) {
      return forbiddenResponse("You do not have access to this issue.");
    }

    const issue = {
      ...data,
      id:        docSnap.id,
      createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? data.updatedAt,
    };

    return successResponse(issue, "Issue fetched successfully.");
  } catch (err) {
    console.error("[API /issues/[id]]", err);
    return serverErrorResponse();
  }
}

// ─── DELETE /api/issues/[id] — Admin only ─────────────────────

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  let user;
  try {
    user = await requireAuth(req);
  } catch (err) {
    return parseAuthError(err);
  }

  if (user.role !== "admin") {
    return forbiddenResponse("Only admins can delete issues.");
  }

  const { id } = params;
  if (!id) return notFoundResponse("Issue ID is required.");

  try {
    const docRef  = adminDb.collection("issues").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return notFoundResponse(`Issue with ID "${id}" not found.`);
    }

    await docRef.delete();

    return successResponse(
      { id },
      "Issue deleted successfully."
    );
  } catch (err) {
    console.error("[API /issues/[id] DELETE]", err);
    return serverErrorResponse();
  }
}