"use client";

import React        from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  X,
} from "lucide-react";
import { cn }       from "@/lib/utils/cn";

// ─── Types ────────────────────────────────────────────────────

type AlertVariant = "success" | "warning" | "error" | "info";

interface AlertProps {
  variant?:    AlertVariant;
  title?:      string;
  children?:   React.ReactNode;
  onDismiss?:  () => void;
  className?:  string;
}

// ─── Config ───────────────────────────────────────────────────

const alertConfig: Record<AlertVariant, { icon: React.ReactNode; containerClass: string; iconClass: string }> = {
  success: {
    icon:           <CheckCircle2 size={18} />,
    containerClass: "bg-green-50 border-green-200 text-green-800",
    iconClass:      "text-green-500",
  },
  warning: {
    icon:           <AlertTriangle size={18} />,
    containerClass: "bg-yellow-50 border-yellow-200 text-yellow-800",
    iconClass:      "text-yellow-500",
  },
  error: {
    icon:           <XCircle size={18} />,
    containerClass: "bg-red-50 border-red-200 text-red-800",
    iconClass:      "text-red-500",
  },
  info: {
    icon:           <Info size={18} />,
    containerClass: "bg-blue-50 border-blue-200 text-blue-800",
    iconClass:      "text-blue-500",
  },
};

// ─── Component ────────────────────────────────────────────────

export default function Alert({
  variant   = "info",
  title,
  children,
  onDismiss,
  className,
}: AlertProps) {
  const config = alertConfig[variant];

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl border text-sm",
        config.containerClass,
        className
      )}
      role="alert"
    >
      {/* Icon */}
      <span className={cn("shrink-0 mt-0.5", config.iconClass)}>
        {config.icon}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <p className="font-semibold mb-0.5">{title}</p>
        )}
        {children && (
          <div className="leading-relaxed">{children}</div>
        )}
      </div>

      {/* Dismiss Button */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={cn(
            "shrink-0 p-0.5 rounded-md hover:bg-black/10 transition-colors",
            config.iconClass
          )}
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}