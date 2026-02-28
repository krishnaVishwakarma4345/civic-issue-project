import React from "react";
import { IssueStatus } from "@/types/issue";
import { getStatusMeta } from "@/lib/constants/statuses";
import { cn } from "@/lib/utils/cn";

interface IssueStatusBadgeProps {
  status:     IssueStatus;
  size?:      "sm" | "md";
  showDot?:   boolean;
  className?: string;
}

export default function IssueStatusBadge({
  status,
  size     = "md",
  showDot  = true,
  className,
}: IssueStatusBadgeProps) {
  const meta = getStatusMeta(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full border",
        meta.bgColor,
        meta.color,
        meta.borderColor,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      {showDot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", meta.dotColor)}
        />
      )}
      {meta.label}
    </span>
  );
}