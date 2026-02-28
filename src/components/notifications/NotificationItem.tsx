import React from "react";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime } from "@/lib/utils/formatters";
import type { AppNotification } from "@/context/NotificationContext";

interface NotificationItemProps {
  notification: AppNotification;
  onRead:       (id: string) => void;
}

const iconMap: Record<AppNotification["type"], string> = {
  success: "✅",
  error:   "❌",
  warning: "⚠️",
  info:    "ℹ️",
};

const bgMap: Record<AppNotification["type"], string> = {
  success: "bg-green-50  border-green-100",
  error:   "bg-red-50    border-red-100",
  warning: "bg-yellow-50 border-yellow-100",
  info:    "bg-blue-50   border-blue-100",
};

export default function NotificationItem({
  notification,
  onRead,
}: NotificationItemProps) {
  return (
    <div
      onClick={() => onRead(notification.id)}
      className={cn(
        "flex items-start gap-3 p-3 rounded-xl border cursor-pointer",
        "hover:shadow-sm transition-all duration-150",
        !notification.read
          ? bgMap[notification.type]
          : "bg-white border-gray-100",
      )}
    >
      <span className="text-lg shrink-0 mt-0.5">
        {iconMap[notification.type]}
      </span>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm",
          notification.read ? "text-gray-600" : "text-gray-900 font-medium"
        )}>
          {notification.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 mt-1.5">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
      {!notification.read && (
        <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1.5" />
      )}
    </div>
  );
}