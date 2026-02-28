import React from "react";
import { cn } from "@/lib/utils/cn";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  X,
} from "lucide-react";

type AlertVariant = "success" | "warning" | "error" | "info";

interface AlertProps {
  variant?:    AlertVariant;
  title?:      string;
  children:    React.ReactNode;
  onDismiss?:  () => void;
  className?:  string;
}

const alertConfig: Record
  AlertVariant,
  { icon: React.ReactNode; containerClass: string; iconClass: string }
> = {
  success: {
    icon:           <CheckCircle2 size={18} />,
    containerClass: "bg-green-50  border-green-200  text-green-800",
    iconClass:      "text-green-600",
  },
  warning: {
    icon:           <AlertTriangle size={18} />,
    containerClass: "bg-yellow-50 border-yellow-200 text-yellow-800",
    iconClass:      "text-yellow-600",
  },
  error: {
    icon:           <XCircle size={18} />,
    containerClass: "bg-red-50    border-red-200    text-red-800",
    iconClass:      "text-red-600",
  },
  info: {
    icon:           <Info size={18} />,
    containerClass: "bg-blue-50   border-blue-200   text-blue-800",
    iconClass:      "text-blue-600",
  },
};

export default function Alert({
  variant   = "info",
  title,
  children,
  onDismiss,
  className,
}: AlertProps) {
  const { icon, containerClass, iconClass } = alertConfig[variant];

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border text-sm",
        containerClass,
        className
      )}
    >
      <span className={cn("shrink-0 mt-0.5", iconClass)}>{icon}</span>
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div>{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss alert"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}