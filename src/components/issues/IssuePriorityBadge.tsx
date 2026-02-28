import React from "react";
import { IssuePriority } from "@/types/issue";
import { getPriorityMeta } from "@/lib/constants/priorities";
import { cn } from "@/lib/utils/cn";

interface IssuePriorityBadgeProps {
  priority:   IssuePriority;
  size?:      "sm" | "md";
  className?: string;
}

export default function IssuePriorityBadge({
  priority,
  size     = "md",
  className,
}: IssuePriorityBadgeProps) {
  const meta = getPriorityMeta(priority);

  const arrowIcon: Record<IssuePriority, string> = {
    high:   "↑",
    medium: "→",
    low:    "↓",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium rounded-full border",
        meta.bgColor,
        meta.color,
        meta.borderColor,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      <span className="font-bold">{arrowIcon[priority]}</span>
      {meta.label}
    </span>
  );
}