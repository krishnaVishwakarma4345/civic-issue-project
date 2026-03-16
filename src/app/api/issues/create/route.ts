// src/app/api/issues/create/route.ts
import { NextRequest } from "next/server";
import { z }           from "zod";
import { requireAuth } from "@/lib/firebase-admin/auth";
import { adminDb }     from "@/lib/firebase-admin/config";
import type { IssueCategory, IssuePriority } from "@/types/issue";
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
  location: z.object({
    latitude:  z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address:   z.string().min(5).max(300),
  }),
  images: z.array(z.string().url()).max(5).default([]),
  audioUrl: z.string().url().optional(),
});

const CATEGORY_MINIMUM_PRIORITY: Record<IssueCategory, IssuePriority> = {
  water: "high",
  road: "medium",
  streetlight: "low",
  garbage: "low",
  sanitation: "low",
};

const PRIORITY_WEIGHT: Record<IssuePriority, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

const ACTIVE_STATUSES = new Set(["reported", "assigned", "in-progress"]);

function normalizeArea(address: string): string {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const primary = parts[0] ?? address;

  return primary
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getAreaPriority(count: number, rankedCounts: number[]): IssuePriority {
  const rankIndex = rankedCounts.findIndex((value) => value === count);

  if (rankIndex <= 0) return "high";
  if (rankIndex === 1) return "medium";
  return "low";
}

function getHigherPriority(
  left: IssuePriority,
  right: IssuePriority
): IssuePriority {
  return PRIORITY_WEIGHT[left] >= PRIORITY_WEIGHT[right] ? left : right;
}

async function calculateAutoPriority(input: {
  category: IssueCategory;
  address: string;
}): Promise<IssuePriority> {
  const newIssueArea = normalizeArea(input.address);

  const snapshot = await adminDb.collection("issues").select("status", "location").get();
  const areaCounts = new Map<string, number>();

  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data() as {
      status?: string;
      location?: { address?: string | null } | null;
    };

    if (!data.status || !ACTIVE_STATUSES.has(data.status)) {
      return;
    }

    const address = data.location?.address;
    if (typeof address !== "string" || address.trim().length === 0) {
      return;
    }

    const area = normalizeArea(address);
    if (!area) {
      return;
    }

    areaCounts.set(area, (areaCounts.get(area) ?? 0) + 1);
  });

  areaCounts.set(newIssueArea, (areaCounts.get(newIssueArea) ?? 0) + 1);

  const rankedCounts = Array.from(new Set(areaCounts.values())).sort((a, b) => b - a);
  const areaPriority = getAreaPriority(areaCounts.get(newIssueArea) ?? 1, rankedCounts);
  const categoryPriority = CATEGORY_MINIMUM_PRIORITY[input.category];

  return getHigherPriority(areaPriority, categoryPriority);
}

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
    const priority = await calculateAutoPriority({
      category: body.category,
      address: body.location.address,
    });

    const issueData = {
      id:                 docRef.id,
      ...body,
      priority,
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