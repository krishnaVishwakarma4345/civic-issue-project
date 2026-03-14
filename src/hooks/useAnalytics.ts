"use client";

import { useState, useEffect, useCallback } from "react";
import { getIdToken } from "@/lib/firebase/auth";
import { getIssuesForAnalytics } from "@/lib/firebase/firestore";
import { AnalyticsSummary } from "@/types/analytics";
import type { Issue } from "@/types/issue";
import { format, subMonths, parseISO, isValid } from "date-fns";

interface UseAnalyticsState {
  data:    AnalyticsSummary | null;
  loading: boolean;
  error:   string | null;
}

export const useAnalytics = () => {
  const [state, setState] = useState<UseAnalyticsState>({
    data:    null,
    loading: true,
    error:   null,
  });

  const fetchAnalytics = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const token = await getIdToken(true);
      const res   = await fetch("/api/admin/analytics", {
        headers: { "Authorization": `Bearer ${token}` },
        // Revalidate every 5 minutes
        next: { revalidate: 300 },
      } as RequestInit);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to fetch analytics");
      }

      const json = await res.json();
      setState({ data: json.data, loading: false, error: null });
    } catch (err) {
      try {
        // Fallback: build analytics from client-side Firestore query so
        // admin dashboard still works when server admin credentials/env differ.
        const issues = await getIssuesForAnalytics();
        const summary = buildAnalyticsSummary(issues);
        setState({ data: summary, loading: false, error: null });
      } catch {
        setState({
          data:    null,
          loading: false,
          error:   err instanceof Error ? err.message : "Failed to load analytics",
        });
      }
    }
  }, []);

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