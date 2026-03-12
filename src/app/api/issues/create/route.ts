// src/app/api/issues/create/route.ts
import { NextRequest } from "next/server";
import { z }           from "zod";
import { requireAuth } from "@/lib/firebase-admin/auth";
import { adminDb }     from "@/lib/firebase-admin/config";
import {
  successResponse,
  serverErrorResponse,
  forbiddenResponse,
  parseAuthError,
} from "@/app/api/_lib/apiResponse";
import { validateBody } from "@/app/api/_lib/apiValidation";
import { rateLimit }    from "@/app/api/_lib/rateLimit";
import { FieldValue }   from "firebase-admin/firestore";

// ─── Schema ───────────────────────────────────────────────────

const createIssueSchema = z.object({
  title: z
    .string()
    .min(5,   "Title must be at least 5 characters")
    .max(100, "Title must be at most 100 characters"),
  description: z
    .string()
    .min(20,   "Description must be at least 20 characters")
    .max(1000, "Description must be at most 1000 characters"),
  category: z.enum([
    "road", "garbage", "water", "streetlight", "sanitation",
  ]),
  priority: z.enum(["low", "medium", "high"]),
  location: z.object({
    latitude:  z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address:   z.string().min(5).max(300),
  }),
  images: z.array(z.string().url()).max(5).default([]),
  audioUrl: z.string().url().optional(),
});

// ─── POST /api/issues/create ──────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Authenticate
  let user;
  try {
    user = await requireAuth(req);
  } catch (err) {
    return parseAuthError(err);
  }

  // 2. Only citizens can create issues
  if (user.role !== "citizen") {
    return forbiddenResponse("Only citizens can report issues.");
  }

  // 3. Rate limit — 10 issues per hour per user
  const limit = rateLimit(`create-issue:${user.uid}`, {
    windowMs:    60 * 60_000,
    maxRequests: 10,
  });
  if (!limit.allowed) {
    return serverErrorResponse(
      "You have reached the issue submission limit. Try again later."
    );
  }

  // 4. Validate body
  const validation = await validateBody(req, createIssueSchema);
  if (!validation.success) return validation.response;

  const body = validation.data;

  try {
    // 5. Write to Firestore via Admin SDK
    const now     = FieldValue.serverTimestamp();
    const docRef  = adminDb.collection("issues").doc();

    const issueData = {
      id:                 docRef.id,
      ...body,
      audioUrl:           body.audioUrl ?? null,
      status:             "reported",
      citizenId:          user.uid,
      citizenName:        user.name,
      citizenEmail:       user.email,
      assignedDepartment: null,
      adminRemarks:       null,
      createdAt:          now,
      updatedAt:          now,
    };

    await docRef.set(issueData);

    // 6. Return with serializable timestamps
    return successResponse(
      {
        ...issueData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      "Issue reported successfully.",
      201
    );
  } catch (err) {
    console.error("[API /issues/create]", err);
    return serverErrorResponse();
  }
}