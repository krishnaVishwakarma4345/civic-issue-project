"use client";

/**
 * Standalone notification bell — used if you want it
 * outside the Navbar (e.g., in a page header).
 * The Navbar already has an inline version.
 */

import React, { useState, useRef, useEffect } from "react";
import { Bell }               from "lucide-react";
import { useNotifications }   from "@/context/NotificationContext";
import { cn }                 from "@/lib/utils/cn";
import { formatRelativeTime } from "@/lib/utils/formatters";
import type { AppNotification } from "@/context/NotificationContext";

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const iconMap: Record<AppNotification["type"], string> = {
    success: "✅",
    error:   "❌",
    warning: "⚠️",
    info:    "ℹ️",
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-semibold text-gray-900">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-bold">
                  {unreadCount}
                </span>
              )}
            </p>
            {unreadCount > 0 && (
              <button
                onClick={() => { markAllAsRead(); setOpen(false); }}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell size={24} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">All caught up!</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <button
                  key={n.id}
                  onClick={() => { markAsRead(n.id); setOpen(false); }}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors",
                    !n.read && "bg-primary-50/40"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-base shrink-0 mt-0.5">
                      {iconMap[n.type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm truncate",
                        n.read ? "text-gray-600" : "text-gray-900 font-medium"
                      )}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatRelativeTime(n.createdAt)}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1.5" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}