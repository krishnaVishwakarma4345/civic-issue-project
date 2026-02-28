"use client";

import { useState, useEffect, useCallback } from "react";
import { getIdToken } from "@/lib/firebase/auth";
import { AnalyticsSummary } from "@/types/analytics";

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
      setState({
        data:    null,
        loading: false,
        error:   err instanceof Error ? err.message : "Failed to load analytics",
      });
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