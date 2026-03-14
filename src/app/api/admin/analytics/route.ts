import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/firebase-admin/auth";
import { adminDb }      from "@/lib/firebase-admin/config";
import {
  successResponse,
  serverErrorResponse,
  parseAuthError,
  forbiddenResponse,
} from "@/app/api/_lib/apiResponse";
import { AnalyticsSummary, CategoryCount, MonthlyTrend, StatusDistribution, PriorityDistribution } from "@/types/analytics";
import { format, subMonths, parseISO, isValid } from "date-fns";

type AdminAnalyticsIssue = {
  id: string;
  createdAt: string | null;
  updatedAt: string | null;
  status?: string;
  category?: string;
  priority?: string;
};

// ─── GET /api/admin/analytics ─────────────────────────────────

export async function GET(req: NextRequest) {
  // 1. Require admin role
  let user;
  try {
    user = await requireAdmin(req);
  } catch (err) {
    return parseAuthError(err);
  }

  const scopedCategory =
    user.role === "department-admin" ? user.adminCategory : undefined;

  if (user.role === "department-admin" && !scopedCategory) {
    return forbiddenResponse("Your admin category is not assigned.");
  }

  try {
    // 2. Fetch all issues (up to 1000 for analytics)
    let query = adminDb.collection("issues") as FirebaseFirestore.Query;

    if (scopedCategory) {
      query = query.where("category", "==", scopedCategory);
    }

    const snap = await query.orderBy("createdAt", "desc").limit(1000).get();

    const issues: AdminAnalyticsIssue[] = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id:        doc.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? null,
      };
    });

    // ─── Summary Counts ───────────────────────────────────

    const totalIssues    = issues.length;
    const resolvedIssues = issues.filter((i) => i.status === "resolved").length;
    const pendingIssues  = issues.filter(
      (i) => i.status !== "resolved"
    ).length;
    const inProgressIssues = issues.filter(
      (i) => i.status === "in-progress"
    ).length;

    const resolutionRate = totalIssues > 0
      ? Math.round((resolvedIssues / totalIssues) * 100)
      : 0;

    // ─── Average Resolution Time ──────────────────────────

    const resolvedWithDates = issues.filter(
      (i) => i.status === "resolved" && i.createdAt && i.updatedAt
    );

    let avgResolutionDays = 0;
    if (resolvedWithDates.length > 0) {
      const totalDays = resolvedWithDates.reduce((sum, issue) => {
        if (!issue.createdAt || !issue.updatedAt) return sum;
        try {
          const created  = new Date(issue.createdAt).getTime();
          const resolved = new Date(issue.updatedAt).getTime();
          const days     = (resolved - created) / (1000 * 60 * 60 * 24);
          return sum + days;
        } catch {
          return sum;
        }
      }, 0);
      avgResolutionDays = Math.round(totalDays / resolvedWithDates.length);
    }

    // ─── Category Breakdown ───────────────────────────────

    const categoryCountMap: Record<string, number> = {};
    issues.forEach((i) => {
      const cat = i.category ?? "unknown";
      categoryCountMap[cat] = (categoryCountMap[cat] ?? 0) + 1;
    });

    const categoryBreakdown: CategoryCount[] = Object.entries(categoryCountMap)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // ─── Status Distribution ──────────────────────────────

    const statusCountMap: Record<string, number> = {};
    issues.forEach((i) => {
      const s = i.status ?? "unknown";
      statusCountMap[s] = (statusCountMap[s] ?? 0) + 1;
    });

    const statusDistribution: StatusDistribution[] = Object.entries(
      statusCountMap
    ).map(([status, count]) => ({
      status,
      count,
      percentage: totalIssues > 0
        ? Math.round((count / totalIssues) * 100)
        : 0,
    }));

    // ─── Priority Distribution ────────────────────────────

    const priorityCountMap: Record<string, number> = {};
    issues.forEach((i) => {
      const p = i.priority ?? "unknown";
      priorityCountMap[p] = (priorityCountMap[p] ?? 0) + 1;
    });

    const priorityDistribution: PriorityDistribution[] = Object.entries(
      priorityCountMap
    ).map(([priority, count]) => ({ priority, count }));

    // ─── Monthly Trend (last 6 months) ────────────────────

    const monthlyMap: Record<string, { reported: number; resolved: number }> =
      {};

    // Pre-initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthKey = format(subMonths(new Date(), i), "MMM yyyy");
      monthlyMap[monthKey] = { reported: 0, resolved: 0 };
    }

    issues.forEach((issue) => {
      if (!issue.createdAt) return;
      try {
        const date     = parseISO(issue.createdAt);
        if (!isValid(date)) return;
        const monthKey = format(date, "MMM yyyy");
        if (!monthlyMap[monthKey]) return; // outside our 6-month window

        monthlyMap[monthKey].reported += 1;
        if (issue.status === "resolved") {
          monthlyMap[monthKey].resolved += 1;
        }
      } catch {
        // skip malformed dates
      }
    });

    const monthlyTrend: MonthlyTrend[] = Object.entries(monthlyMap).map(
      ([month, counts]) => ({ month, ...counts })
    );

    // ─── Assemble Summary ─────────────────────────────────

    const summary: AnalyticsSummary = {
      totalIssues,
      pendingIssues,
      resolvedIssues,
      inProgressIssues,
      resolutionRate,
      avgResolutionDays,
      categoryBreakdown,
      monthlyTrend,
      statusDistribution,
      priorityDistribution,
    };

    return successResponse(summary, "Analytics fetched successfully.");
  } catch (err) {
    console.error("[API /admin/analytics]", err);
    return serverErrorResponse();
  }
}