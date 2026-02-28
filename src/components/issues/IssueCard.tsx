"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { MapPin, Clock, Image as ImageIcon } from "lucide-react";
import { Issue } from "@/types/issue";
import { getCategoryMeta } from "@/lib/constants/categories";
import { formatRelativeTime, truncate } from "@/lib/utils/formatters";
import IssueStatusBadge   from "./IssueStatusBadge";
import IssuePriorityBadge from "./IssuePriorityBadge";
import { cn } from "@/lib/utils/cn";

interface IssueCardProps {
  issue:      Issue;
  showAuthor?: boolean;
  className?: string;
}

export default function IssueCard({
  issue,
  showAuthor = false,
  className,
}: IssueCardProps) {
  const router   = useRouter();
  const category = getCategoryMeta(issue.category);

  const handleClick = () => {
    router.push(`/issues/${issue.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "card hover:shadow-md hover:border-gray-200 cursor-pointer",
        "transition-all duration-200 group",
        className
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      aria-label={`View issue: ${issue.title}`}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              "text-lg shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
              category.bgColor
            )}
            title={category.label}
          >
            {category.icon}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {category.label}
            </p>
            <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
              {issue.title}
            </h3>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <IssueStatusBadge   status={issue.status}   size="sm" />
          <IssuePriorityBadge priority={issue.priority} size="sm" />
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 leading-relaxed mb-3">
        {truncate(issue.description, 120)}
      </p>

      {/* Footer Row */}
      <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <MapPin size={12} className="shrink-0" />
          <span className="truncate">{truncate(issue.location.address, 40)}</span>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-2">
          {issue.images.length > 0 && (
            <span className="flex items-center gap-1">
              <ImageIcon size={12} />
              {issue.images.length}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {formatRelativeTime(issue.createdAt)}
          </span>
        </div>
      </div>

      {/* Author (admin view) */}
      {showAuthor && issue.citizenName && (
        <div className="mt-2 pt-2 border-t border-gray-50">
          <p className="text-xs text-gray-400">
            Reported by{" "}
            <span className="font-medium text-gray-600">
              {issue.citizenName}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}