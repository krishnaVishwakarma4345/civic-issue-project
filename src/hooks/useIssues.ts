"use client";

import { useCallback, useEffect } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { useIssueStore } from "@/store/issueStore";
import { useNotifications } from "@/context/NotificationContext";
import {
  createIssue,
  getIssuesByUser,
  subscribeToUserIssues,
} from "@/lib/firebase/firestore";
import { CreateIssuePayload, Issue } from "@/types/issue";
import { getIdToken } from "@/lib/firebase/auth";

export const useIssues = () => {
  const { userData }         = useAuthContext();
  const { addNotification }  = useNotifications();
  const {
    myIssues,
    loading,
    submitting,
    error,
    setMyIssues,
    addIssue,
    updateIssue,
    setLoading,
    setSubmitting,
    setError,
  } = useIssueStore();

  // ─── Real-time subscription to user's own issues ──────────

  useEffect(() => {
    if (!userData?.uid) return;

    setLoading(true);

    const unsubscribe = subscribeToUserIssues(userData.uid, (issues) => {
      setMyIssues(issues);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData?.uid, setMyIssues, setLoading]);

  // ─── Submit new issue ─────────────────────────────────────

  const submitIssue = useCallback(
    async (
      payload: CreateIssuePayload,
      imageFiles: File[]
    ): Promise<Issue | null> => {
      if (!userData) {
        setError("You must be logged in to report an issue.");
        return null;
      }

      setSubmitting(true);
      setError(null);

      try {
        // 1. Create issue doc first to get the ID
        const issue = await createIssue({
          ...payload,
          citizenId:    userData.uid,
          citizenName:  userData.name,
          citizenEmail: userData.email,
        });

        // 2. Upload images if any
        if (imageFiles.length > 0) {
        const imageUrls: string[] = []; 

          // 3. Update issue with image URLs via API
          const token = await getIdToken(true);
          await fetch("/api/issues/update", {
            method: "PATCH",
            headers: {
              "Content-Type":  "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ id: issue.id, images: imageUrls }),
          });

          issue.images = imageUrls;
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
        addNotification({
          title:   "Submission Failed",
          message,
          type:    "error",
        });
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [userData, setSubmitting, setError, addIssue, addNotification]
  );

  return {
    myIssues,
    loading,
    submitting,
    error,
    submitIssue,
  };
};