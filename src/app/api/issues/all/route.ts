// src/app/api/issues/all/route.ts
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/firebase-admin/auth";
import { adminDb }     from "@/lib/firebase-admin/config";
import {
  successResponse,
  serverErrorResponse,
  parseAuthError,
} from "@/app/api/_lib/apiResponse";
import { getQueryParams } from "@/app/api/_lib/apiValidation";
import {
  Query,
  CollectionReference,
  DocumentData,
} from "firebase-admin/firestore";

// ─── GET /api/issues/all ──────────────────────────────────────

export async function GET(req: NextRequest) {
  // 1. Authenticate
  let user;
  try {
    user = await requireAuth(req);
  } catch (err) {
    return parseAuthError(err);
  }

  // 2. Parse query params
  const params   = getQueryParams(req.url, [
    "category", "status", "priority",
    "search",   "page",   "limit",
    "dateFrom", "dateTo",
  ]);

  const page      = Math.max(1, parseInt(params.page    ?? "1"));
  const pageLimit = Math.min(50, parseInt(params.limit  ?? "20"));
  const offset    = (page - 1) * pageLimit;

  try {
    const issuesRef: CollectionReference<DocumentData> =
      adminDb.collection("issues");

    let q: Query<DocumentData> = issuesRef;

    // ─── Role-based scoping ───────────────────────────────
    // Citizens only see their own issues
    if (user.role === "citizen") {
      q = q.where("citizenId", "==", user.uid);
    }

    // ─── Filters ──────────────────────────────────────────
    if (params.category && params.category !== "all") {
      q = q.where("category", "==", params.category);
    }
    if (params.status && params.status !== "all") {
      q = q.where("status", "==", params.status);
    }
    if (params.priority && params.priority !== "all") {
      q = q.where("priority", "==", params.priority);
    }

    // ─── Ordering ─────────────────────────────────────────
    q = q.orderBy("createdAt", "desc");

    // ─── Fetch all matching (for count + pagination) ──────
    const fullSnap = await q.get();
    const allDocs  = fullSnap.docs;
    const total    = allDocs.length;

    // ─── Paginate in memory ───────────────────────────────
    const paginated = allDocs.slice(offset, offset + pageLimit);

    let issues = paginated.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id:        doc.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? data.updatedAt,
      };
    });

    // ─── Text search (post-filter, Firestore has no FTS) ──
    if (params.search) {
      const term = params.search.toLowerCase();
      issues = issues.filter(
        (i) =>
          i.title?.toLowerCase().includes(term) ||
          i.description?.toLowerCase().includes(term) ||
          i.location?.address?.toLowerCase().includes(term)
      );
    }

    return successResponse(
      {
        issues,
        total,
        page,
        limit:   pageLimit,
        hasMore: offset + pageLimit < total,
      },
      "Issues fetched successfully."
    );
  } catch (err) {
    console.error("[API /issues/all]", err);
    return serverErrorResponse();
  }
}