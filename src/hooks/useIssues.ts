// src/hooks/useIssues.ts
"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAuthContext }    from "@/context/AuthContext";
import { useIssueStore }     from "@/store/issueStore";
import { useNotifications }  from "@/context/NotificationContext";
import {
  createIssue,
  subscribeToUserIssues,
} from "@/lib/firebase/firestore";
import { getIdToken }        from "@/lib/firebase/auth";
import { CreateIssuePayload, Issue } from "@/types/issue";

export const useIssues = () => {
  const { userData }        = useAuthContext();
  const { addNotification } = useNotifications();
  const {
    myIssues,
    loading,
    submitting,
    error,
    setMyIssues,
    addIssue,
    setLoading,
    setSubmitting,
    setError,
  } = useIssueStore();

  // Track mount state so we never call setState after unmount
  // (Firestore snapshot can fire one last time during logout navigation)
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ─── Real-time subscription ───────────────────────────────
  useEffect(() => {
    // FIX: if uid is missing (user logged out or not yet loaded),
    // clear the list and bail — never pass undefined to Firestore
    if (!userData?.uid) {
      setMyIssues([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeToUserIssues(userData.uid, (issues) => {
      // FIX: only update state if still mounted — prevents the crash
      // that happens when Firestore fires its final snapshot during the
      // brief window between logout and the /login redirect completing
      if (mountedRef.current) {
        setMyIssues(issues);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [userData?.uid, setMyIssues, setLoading]);

  // ─── Submit new issue ─────────────────────────────────────
  const submitIssue = useCallback(
    async (
      payload:    CreateIssuePayload,
      imageFiles: File[]
    ): Promise<Issue | null> => {
      if (!userData) {
        setError("You must be logged in to report an issue.");
        return null;
      }

      setSubmitting(true);
      setError(null);

      try {
        const issue = await createIssue({
          ...payload,
          citizenId:    userData.uid,
          citizenName:  userData.name,
          citizenEmail: userData.email,
        });

        // If caller still passes image files (legacy), patch them via API
        if (imageFiles.length > 0) {
          try {
            const token = await getIdToken(true);
            await fetch("/api/issues/update", {
              method:  "PATCH",
              headers: {
                "Content-Type":  "application/json",
                "Authorization": `Bearer ${token}`,
              },
              body: JSON.stringify({ id: issue.id, images: payload.images ?? [] }),
            });
          } catch (patchErr) {
            console.warn("[useIssues] image patch failed:", patchErr);
          }
        }

        addIssue(issue);
        addNotification({
          title:   "Issue Reported Successfully",
          message: `"${issue.title}" has been submitted and is under review.`,
          type:    "success",
          issueId: issue.id,
        });

        return issue;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to submit issue.";
        setError(message);
        addNotification({ title: "Submission Failed", message, type: "error" });
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [userData, setSubmitting, setError, addIssue, addNotification]
  );

  return { myIssues, loading, submitting, error, submitIssue };
};