import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken }   from "@/lib/firebase-admin/auth";
import { getUserDocument } from "@/lib/firebase/firestore";
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from "@/app/api/_lib/apiResponse";

// ─── GET /api/auth/session — Verify current session ──────────

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return unauthorizedResponse("No token provided.");
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decoded = await verifyIdToken(token);
    if (!decoded) return unauthorizedResponse("Invalid or expired token.");

    const userData = await getUserDocument(decoded.uid);
    if (!userData)  return unauthorizedResponse("User profile not found.");

    return successResponse(
      { user: userData },
      "Session valid."
    );
  } catch (err) {
    console.error("[API /auth/session]", err);
    return serverErrorResponse();
  }
}

// ─── DELETE /api/auth/session — Clear auth cookies ───────────

export async function DELETE() {
  const response = successResponse(null, "Session cleared.");

  response.cookies.set("auth-token", "", { maxAge: 0, path: "/" });
  response.cookies.set("user-role",  "", { maxAge: 0, path: "/" });

  return response;
}