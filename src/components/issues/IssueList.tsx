"use client";

import React              from "react";
import IssueCard          from "./IssueCard";
import { SkeletonCard }   from "@/components/ui/Spinner";
import { FileText }       from "lucide-react";
import { cn }             from "@/lib/utils/cn";
import type { Issue }     from "@/types/issue";

interface IssueListProps {
  issues:      Issue[];
  loading?:    boolean;
  showAuthor?: boolean;
  emptyTitle?: string;
  emptyDesc?:  string;
  emptyAction?: React.ReactNode;
  cols?:       1 | 2 | 3;
  className?:  string;
}

const colStyles = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
};

export default function IssueList({
  issues,
  loading      = false,
  showAuthor   = false,
  emptyTitle   = "No issues found",
  emptyDesc    = "There are no issues to display.",
  emptyAction,
  cols         = 2,
  className,
}: IssueListProps) {
  // ─── Loading State ────────────────────────────────────────

  if (loading) {
    return (
      <div className={cn("grid gap-4", colStyles[cols], className)}>
        {Array.from({ length: cols * 2 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  // ─── Empty State ──────────────────────────────────────────

  if (issues.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-card text-center py-16 px-6">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <FileText size={26} className="text-gray-300" />
        </div>
        <p className="font-semibold text-gray-700 mb-1">{emptyTitle}</p>
        <p className="text-sm text-gray-400 max-w-xs mx-auto mb-5">
          {emptyDesc}
        </p>
        {emptyAction && <div>{emptyAction}</div>}
      </div>
    );
  }

  // ─── Issue Grid ───────────────────────────────────────────

  return (
    <div className={cn("grid gap-4", colStyles[cols], className)}>
      {issues.map((issue) => (
        <IssueCard
          key={issue.id}
          issue={issue}
          showAuthor={showAuthor}
        />
      ))}
    </div>
  );
}