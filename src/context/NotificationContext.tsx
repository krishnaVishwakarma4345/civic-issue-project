"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "./AuthContext";
import { subscribeToUserIssues } from "@/lib/firebase/firestore";
import { Issue } from "@/types/issue";

// ─── Types ───────────────────────────────────────────────────

export interface AppNotification {
  id:        string;
  title:     string;
  message:   string;
  type:      "info" | "success" | "warning" | "error";
  read:      boolean;
  issueId?:  string;
  createdAt: string;
}

interface NotificationContextValue {
  notifications:    AppNotification[];
  unreadCount:      number;
  addNotification:  (n: Omit<AppNotification, "id" | "read" | "createdAt">) => void;
  markAsRead:       (id: string) => void;
  markAllAsRead:    () => void;
  clearAll:         () => void;
}

// ─── Context ─────────────────────────────────────────────────

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);

// ─── Provider ─────────────────────────────────────────────────

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { userData, isLoggedIn } = useAuthContext();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Track previous issue statuses to detect changes
  const prevIssueStatuses = useRef<Record<string, string>>({});

  const addNotification = useCallback(
    (n: Omit<AppNotification, "id" | "read" | "createdAt">) => {
      const notification: AppNotification = {
        ...n,
        id:        crypto.randomUUID(),
        read:      false,
        createdAt: new Date().toISOString(),
      };

      setNotifications((prev) => [notification, ...prev].slice(0, 50));

      // Show toast
      switch (n.type) {
        case "success": toast.success(n.message); break;
        case "error":   toast.error(n.message);   break;
        case "warning": toast(n.message, { icon: "⚠️" }); break;
        default:        toast(n.message, { icon: "ℹ️" }); break;
      }
    },
    []
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // ─── Real-time issue status change detection ───────────────
  useEffect(() => {
    if (!isLoggedIn || !userData || userData.role !== "citizen") return;

    const unsubscribe = subscribeToUserIssues(
      userData.uid,
      (issues: Issue[]) => {
        issues.forEach((issue) => {
          const prevStatus = prevIssueStatuses.current[issue.id];

          // First load — just record statuses, don't notify
          if (!prevStatus) {
            prevIssueStatuses.current[issue.id] = issue.status;
            return;
          }

          // Status changed
          if (prevStatus !== issue.status) {
            prevIssueStatuses.current[issue.id] = issue.status;

            const statusLabels: Record<string, string> = {
              assigned:    "assigned to a department",
              "in-progress": "now being worked on",
              resolved:    "resolved ✅",
            };

            const label = statusLabels[issue.status];
            if (label) {
              addNotification({
                title:   `Issue Update: ${issue.title}`,
                message: `Your issue "${issue.title}" has been ${label}.`,
                type:    issue.status === "resolved" ? "success" : "info",
                issueId: issue.id,
              });
            }
          }
        });
      }
    );

    return () => unsubscribe();
  }, [isLoggedIn, userData, addNotification]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount:  notifications.filter((n) => !n.read).length,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearAll,
    }),
    [notifications, addNotification, markAsRead, markAllAsRead, clearAll]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────

export const useNotifications = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a <NotificationProvider>"
    );
  }
  return context;
};