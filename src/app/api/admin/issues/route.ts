import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/firebase-admin/auth";
import { adminDb }      from "@/lib/firebase-admin/config";
import {
  successResponse,
  serverErrorResponse,
  parseAuthError,
  forbiddenResponse,
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
  let user;
  try {
    user = await requireAdmin(req);
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

    const scopedCategory =
      user.role === "department-admin" ? user.adminCategory : undefined;

    if (user.role === "department-admin" && !scopedCategory) {
      return forbiddenResponse("Your admin category is not assigned.");
    }

    if (scopedCategory) {
      q = q.where("category", "==", scopedCategory);
    }

    if (params.category && params.category !== "all" && !scopedCategory) {
      q = q.where("category", "==", params.category);
    }
    if (params.status && params.status !== "all" && params.status !== "pending") {
      q = q.where("status", "==", params.status);
    }
    if (params.priority && params.priority !== "all") {
      q = q.where("priority", "==", params.priority);
    }

    q = q.orderBy("createdAt", "desc");

    const fullSnap = await q.get();

    let issues: AdminIssueListItem[] = fullSnap.docs.map((doc) => {
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

    if (params.status === "pending") {
      issues = issues.filter((i) => i.status !== "resolved");
    }

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

    const total  = issues.length;
    const offset = (page - 1) * pageLimit;
    const pagedIssues = issues.slice(offset, offset + pageLimit);

    return successResponse(
      {
        issues: pagedIssues,
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