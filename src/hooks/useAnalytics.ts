"use client";

import { useState, useEffect, useCallback } from "react";
import { getIdToken } from "@/lib/firebase/auth";
import { getIssuesForAnalytics } from "@/lib/firebase/firestore";
import { useAuthContext } from "@/context/AuthContext";
import { AnalyticsSummary } from "@/types/analytics";
import type { Issue } from "@/types/issue";
import { format, subMonths, parseISO, isValid } from "date-fns";

interface UseAnalyticsState {
  data:    AnalyticsSummary | null;
  loading: boolean;
  error:   string | null;
}

export const useAnalytics = () => {
  const { userData } = useAuthContext();
  const [state, setState] = useState<UseAnalyticsState>({
    data:    null,
    loading: true,
    error:   null,
  });

  const fetchAnalytics = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    // 1. Try the server-side API (requires Firebase Admin SDK to be configured).
    try {
      const token = await getIdToken(true);
      const res = await fetch("/api/admin/analytics", {
        headers: { "Authorization": `Bearer ${token ?? ""}` },
      });

      if (res.ok) {
        const json = await res.json();
        setState({ data: json.data, loading: false, error: null });
        return;
      }
      // Non-2xx (e.g. 401 when Firebase Admin key is not configured): fall through.
      console.warn("[useAnalytics] API returned non-OK, falling back to Firestore.");
    } catch {
      // Network error — fall through to Firestore fallback.
      console.warn("[useAnalytics] API unreachable, falling back to Firestore.");
    }

    // 2. Client-side Firestore fallback — works once Firestore rules are deployed.
    // Guard: only fetch once userData has loaded (avoid unscoped query for dept admins).
    if (!userData) {
      setState({ data: null, loading: false, error: "Not authenticated." });
      return;
    }
    try {
      const scopedCategory =
        userData.role === "department-admin" ? userData.adminCategory : undefined;
      const issues = await getIssuesForAnalytics(scopedCategory);
      const summary = buildAnalyticsSummary(issues);
      setState({ data: summary, loading: false, error: null });
    } catch (fallbackErr) {
      setState({
        data:    null,
        loading: false,
        error:   fallbackErr instanceof Error ? fallbackErr.message : "Failed to load analytics",
      });
    }
  }, [userData?.role, userData?.adminCategory]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    ...state,
    refresh: fetchAnalytics,
  };
};

const buildAnalyticsSummary = (issues: Issue[]): AnalyticsSummary => {
  const totalIssues = issues.length;
  const resolvedIssues = issues.filter((i) => i.status === "resolved").length;
  const inProgressIssues = issues.filter((i) => i.status === "in-progress").length;
  const pendingIssues = issues.filter((i) => i.status !== "resolved").length;

  const resolutionRate = totalIssues > 0
    ? Math.round((resolvedIssues / totalIssues) * 100)
    : 0;

  const resolvedWithDates = issues.filter(
    (i) => i.status === "resolved" && i.createdAt && i.updatedAt
  );

  let avgResolutionDays = 0;
  if (resolvedWithDates.length > 0) {
    const totalDays = resolvedWithDates.reduce((sum, issue) => {
      const created = new Date(issue.createdAt).getTime();
      const resolved = new Date(issue.updatedAt).getTime();
      if (!Number.isFinite(created) || !Number.isFinite(resolved)) return sum;
      return sum + (resolved - created) / (1000 * 60 * 60 * 24);
    }, 0);
    avgResolutionDays = Math.round(totalDays / resolvedWithDates.length);
  }

  const categoryCountMap: Record<string, number> = {};
  issues.forEach((i) => {
    const category = i.category ?? "unknown";
    categoryCountMap[category] = (categoryCountMap[category] ?? 0) + 1;
  });

  const categoryBreakdown = Object.entries(categoryCountMap)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  const statusCountMap: Record<string, number> = {};
  issues.forEach((i) => {
    const status = i.status ?? "unknown";
    statusCountMap[status] = (statusCountMap[status] ?? 0) + 1;
  });

  const statusDistribution = Object.entries(statusCountMap).map(
    ([status, count]) => ({
      status,
      count,
      percentage: totalIssues > 0 ? Math.round((count / totalIssues) * 100) : 0,
    })
  );

  const priorityCountMap: Record<string, number> = {};
  issues.forEach((i) => {
    const priority = i.priority ?? "unknown";
    priorityCountMap[priority] = (priorityCountMap[priority] ?? 0) + 1;
  });

  const priorityDistribution = Object.entries(priorityCountMap).map(
    ([priority, count]) => ({ priority, count })
  );

  const monthlyMap: Record<string, { reported: number; resolved: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const monthKey = format(subMonths(new Date(), i), "MMM yyyy");
    monthlyMap[monthKey] = { reported: 0, resolved: 0 };
  }

  issues.forEach((issue) => {
    if (!issue.createdAt) return;
    const date = parseISO(issue.createdAt);
    if (!isValid(date)) return;

    const monthKey = format(date, "MMM yyyy");
    if (!monthlyMap[monthKey]) return;

    monthlyMap[monthKey].reported += 1;
    if (issue.status === "resolved") {
      monthlyMap[monthKey].resolved += 1;
    }
  });

  const monthlyTrend = Object.entries(monthlyMap).map(([month, counts]) => ({
    month,
    ...counts,
  }));

  return {
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
};