import { NextRequest } from "next/server";
import { z }           from "zod";
import {
  successResponse,
  errorResponse,
  serverErrorResponse,
} from "@/app/api/_lib/apiResponse";
import { validateBody }   from "@/app/api/_lib/apiValidation";
import { rateLimit }      from "@/app/api/_lib/rateLimit";
import { adminDb }        from "@/lib/firebase-admin/config";
import { adminAuth }      from "@/lib/firebase-admin/config";

// ─── Schema ───────────────────────────────────────────────────

const registerSchema = z.object({
  uid:   z.string().min(1),
  name:  z.string().min(2).max(50),
  email: z.string().email(),
  role:  z.enum(["citizen", "admin"]).default("citizen"),
});

// ─── POST /api/auth/register ──────────────────────────────────

export async function POST(req: NextRequest) {
  // Rate limit by IP
  const ip    = req.headers.get("x-forwarded-for") ?? "unknown";
  const limit = rateLimit(`register:${ip}`, { windowMs: 60_000, maxRequests: 5 });

  if (!limit.allowed) {
    return errorResponse("Too many registration attempts. Please wait.", 429);
  }

  const validation = await validateBody(req, registerSchema);
  if (!validation.success) return validation.response;

  const { uid, name, email, role } = validation.data;

  try {
    // Verify uid actually exists in Firebase Auth
    await adminAuth.getUser(uid);

    // Write user document
    await adminDb.collection("users").doc(uid).set({
      uid,
      name,
      email,
      role,
      createdAt: new Date().toISOString(),
    });

    return successResponse(
      { uid, name, email, role },
      "User registered successfully.",
      201
    );
  } catch (err) {
    console.error("[API /auth/register]", err);
    if (err instanceof Error && err.message.includes("There is no user record")) {
      return errorResponse("Invalid user token.", 400);
    }
    return serverErrorResponse();
  }
}