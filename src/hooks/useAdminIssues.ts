"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useIssueStore } from "@/store/issueStore";
import { useNotifications } from "@/context/NotificationContext";
import { getIdToken } from "@/lib/firebase/auth";
import { getAllIssues } from "@/lib/firebase/firestore";
import { useAuthContext } from "@/context/AuthContext";
import { UpdateIssuePayload } from "@/types/issue";

export const useAdminIssues = () => {
  const { addNotification } = useNotifications();
  const { userData } = useAuthContext();
  const {
    issues,
    loading,
    submitting,
    error,
    filters,
    hasMore,
    total,
    setIssues,
    updateIssue,
    setLoading,
    setSubmitting,
    setError,
    setFilters,
    resetFilters,
    setHasMore,
    setTotal,
  } = useIssueStore();

  const [currentPage, setCurrentPage] = useState(1);
  const latestRequestIdRef = useRef(0);

  // ─── Load Issues ──────────────────────────────────────────

  const loadIssues = useCallback(
    async (resetPagination = true) => {
      const requestId = ++latestRequestIdRef.current;
      setLoading(true);
      setError(null);

      try {
        const token = await getIdToken(true);
        const page = resetPagination ? 1 : currentPage + 1;

        const query = new URLSearchParams({
          page: String(page),
          limit: "50",
        });

        if (filters.category && filters.category !== "all") {
          query.set("category", filters.category);
        }
        if (filters.status && filters.status !== "all") {
          query.set("status", filters.status);
        }
        if (filters.priority && filters.priority !== "all") {
          query.set("priority", filters.priority);
        }
        if (filters.search?.trim()) {
          query.set("search", filters.search.trim());
        }

        const res = await fetch(`/api/admin/issues?${query.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to load issues.");
        }

        const json = await res.json();
        const result = json.data as {
          issues: typeof issues;
          total: number;
          hasMore: boolean;
          page: number;
        };

        if (requestId !== latestRequestIdRef.current) return;

        if (resetPagination) {
          setIssues(result.issues);
        } else {
          setIssues([...issues, ...result.issues]);
        }

        setCurrentPage(result.page);
        setHasMore(result.hasMore);
        setTotal(result.total);
      } catch {
        // API failed (e.g. Firebase Admin key not configured) — try Firestore directly.
        console.warn("[useAdminIssues] API unavailable, falling back to Firestore.");
        try {
          const categoryFilter =
            userData?.role === "department-admin" ? userData.adminCategory : undefined;

          const fallbackFilters = {
            ...filters,
            status: filters.status === "pending" ? "all" : filters.status,
            ...(categoryFilter ? { category: categoryFilter } : {}),
          };

          const { issues: fallbackIssues } = await getAllIssues(
            fallbackFilters,
            50
          );

          const finalFallbackIssues =
            filters.status === "pending"
              ? fallbackIssues.filter((i) => i.status !== "resolved")
              : fallbackIssues;

          setIssues(resetPagination ? finalFallbackIssues : [...issues, ...finalFallbackIssues]);
          setTotal(finalFallbackIssues.length);
          setHasMore(false);
          setCurrentPage(1);
        } catch (fallbackErr) {
          if (requestId !== latestRequestIdRef.current) return;
          const message =
            fallbackErr instanceof Error ? fallbackErr.message : "Failed to load issues.";
          setError(message);
        }
      } finally {
        if (requestId === latestRequestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [
      filters,
      currentPage,
      issues,
      userData,
      setIssues,
      setLoading,
      setError,
      setHasMore,
      setTotal,
    ]
  );

  // ─── Load more (pagination) ───────────────────────────────

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await loadIssues(false);
  }, [hasMore, loading, loadIssues]);

  // ─── Reload when filters change ───────────────────────────

  useEffect(() => {
    loadIssues(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // ─── Update Issue ─────────────────────────────────────────

  const updateIssueStatus = useCallback(
    async (payload: UpdateIssuePayload): Promise<boolean> => {
      setSubmitting(true);
      setError(null);

      try {
        const token = await getIdToken(true);
        const res   = await fetch("/api/issues/update", {
          method: "PATCH",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Update failed");
        }

        const json = await res.json();
        const updatedIssue = json.data as { [key: string]: unknown };

        // Optimistically update store
        updateIssue(payload.id, {
          ...updatedIssue,
          ...(payload.status && { status: payload.status }),
          ...(payload.assignedDepartment && { assignedDepartment: payload.assignedDepartment }),
          ...(payload.adminRemarks && { adminRemarks: payload.adminRemarks }),
          ...(payload.resolvedImageUrl && { resolvedImageUrl: payload.resolvedImageUrl }),
          updatedAt: new Date().toISOString(),
        });

        addNotification({
          title:   "Issue Updated",
          message: `Issue has been updated successfully.`,
          type:    "success",
          issueId: payload.id,
        });

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Update failed.";
        setError(message);
        addNotification({ title: "Update Failed", message, type: "error" });
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [updateIssue, setSubmitting, setError, addNotification]
  );

  return {
    issues,
    loading,
    submitting,
    error,
    filters,
    hasMore,
    total,
    loadIssues,
    loadMore,
    updateIssueStatus,
    setFilters,
    resetFilters,
  };
};