import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/firebase-admin/auth";
import { adminDb }      from "@/lib/firebase-admin/config";
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

type AdminIssueListItem = DocumentData & {
  id: string;
  createdAt: string | null;
  updatedAt: string | null;
  images: string[];
  audioUrl: string | null;
};

// ─── GET /api/admin/issues — Paginated + filtered ─────────────

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (err) {
    return parseAuthError(err);
  }

  const params = getQueryParams(req.url, [
    "category", "status", "priority",
    "search",   "page",   "limit",
  ]);

  const page      = Math.max(1, parseInt(params.page  ?? "1"));
  const pageLimit = Math.min(50, parseInt(params.limit ?? "20"));

  try {
    const issuesRef: CollectionReference<DocumentData> =
      adminDb.collection("issues");

    let q: Query<DocumentData> = issuesRef;

    if (params.category && params.category !== "all") {
      q = q.where("category", "==", params.category);
    }
    if (params.status && params.status !== "all") {
      q = q.where("status", "==", params.status);
    }
    if (params.priority && params.priority !== "all") {
      q = q.where("priority", "==", params.priority);
    }

    q = q.orderBy("createdAt", "desc");

    const fullSnap = await q.get();
    const total    = fullSnap.size;
    const offset   = (page - 1) * pageLimit;

    let issues: AdminIssueListItem[] = fullSnap.docs
      .slice(offset, offset + pageLimit)
      .map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id:        doc.id,
          createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt ?? null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? data.updatedAt ?? null,
          images:    Array.isArray(data.images) ? data.images : [],
          audioUrl:  typeof data.audioUrl === "string" ? data.audioUrl : null,
          location:  data.location ?? { address: "" },
          title:     data.title ?? "",
          description: data.description ?? "",
          citizenName: data.citizenName ?? "",
        };
      });

    // Client-side text search
    if (params.search) {
      const term = params.search.toLowerCase();
      issues = issues.filter(
        (i) =>
          i.title?.toLowerCase().includes(term) ||
          i.description?.toLowerCase().includes(term) ||
          i.location?.address?.toLowerCase().includes(term) ||
          i.citizenName?.toLowerCase().includes(term)
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
    console.error("[API /admin/issues]", err);
    return serverErrorResponse();
  }
}