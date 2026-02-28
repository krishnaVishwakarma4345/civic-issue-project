"use client";

import { useCallback, useEffect, useState } from "react";
import { useIssueStore } from "@/store/issueStore";
import { useNotifications } from "@/context/NotificationContext";
import { getAllIssues } from "@/lib/firebase/firestore";
import { getIdToken } from "@/lib/firebase/auth";
import { IssueFilters, UpdateIssuePayload, Issue } from "@/types/issue";

export const useAdminIssues = () => {
  const { addNotification } = useNotifications();
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

  const [lastDoc, setLastDoc] = useState<unknown>(null);

  // ─── Load Issues ──────────────────────────────────────────

  const loadIssues = useCallback(
    async (resetPagination = true) => {
      setLoading(true);
      setError(null);

      try {
        const result = await getAllIssues(
          filters,
          50,
          resetPagination ? undefined : (lastDoc as never)
        );

        if (resetPagination) {
          setIssues(result.issues);
        } else {
          setIssues([...issues, ...result.issues]);
        }

        setLastDoc(result.lastDoc);
        setHasMore(result.issues.length === 50);
        setTotal(resetPagination ? result.issues.length : total + result.issues.length);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load issues.";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [filters, lastDoc, issues, total, setIssues, setLoading, setError, setHasMore, setTotal]
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

        // Optimistically update store
        updateIssue(payload.id, {
          ...(payload.status             && { status:             payload.status }),
          ...(payload.assignedDepartment && { assignedDepartment: payload.assignedDepartment }),
          ...(payload.adminRemarks       && { adminRemarks:       payload.adminRemarks }),
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