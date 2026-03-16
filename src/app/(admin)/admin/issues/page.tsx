"use client";

import React, { useCallback, useEffect }   from "react";
import Link                     from "next/link";
import { useSearchParams }     from "next/navigation";
import {
  Eye,
  RefreshCw,
  ChevronDown,
  FileText,
} from "lucide-react";
import { useAdminIssues }       from "@/hooks/useAdminIssues";
import PageHeader               from "@/components/layout/PageHeader";
import IssueFilters             from "@/components/issues/IssueFilters";
import IssueStatusBadge         from "@/components/issues/IssueStatusBadge";
import IssuePriorityBadge       from "@/components/issues/IssuePriorityBadge";
import Button                   from "@/components/ui/Button";
import { SkeletonRow }          from "@/components/ui/Spinner";
import { getCategoryMeta }      from "@/lib/constants/categories";
import { formatRelativeTime,
         truncate }             from "@/lib/utils/formatters";
import { cn }                   from "@/lib/utils/cn";
import type { Issue }           from "@/types/issue";

export default function AdminIssuesPage() {
  const searchParams = useSearchParams();
  const {
    issues,
    loading,
    filters,
    hasMore,
    total,
    loadIssues,
    loadMore,
    setFilters,
    resetFilters,
  } = useAdminIssues();

  const handleRefresh = useCallback(() => {
    loadIssues(true);
  }, [loadIssues]);

  useEffect(() => {
    const status = searchParams.get("status");
    const validStatuses = new Set([
      "all",
      "pending",
      "reported",
      "assigned",
      "in-progress",
      "resolved",
    ]);

    if (status && validStatuses.has(status) && filters.status !== status) {
      setFilters({
        category: "all",
        priority: "all",
        search: "",
        status: status as typeof filters.status,
      });
    }
  }, [searchParams, filters.status, setFilters]);

  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────────── */}
      <PageHeader
        title="All Issues"
        subtitle={`${total} total issue${total !== 1 ? "s" : ""} in the system`}
        actions={
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw size={14} />}
            loading={loading}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        }
      />

      {/* ─── Filters ─────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4">
        <IssueFilters
          filters={filters}
          onFilterChange={setFilters}
          onReset={resetFilters}
          showSearch
        />
      </div>

      {/* ─── Issues Table ────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <div className="col-span-4">Issue</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1">Priority</div>
          <div className="col-span-2">Reported</div>
          <div className="col-span-1">Action</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-50">
          {loading && issues.length === 0 ? (
            [1, 2, 3, 4, 5, 6, 7, 8].map((i) => <SkeletonRow key={i} />)
          ) : issues.length === 0 ? (
            <EmptyState />
          ) : (
            issues.map((issue) => (
              <IssueTableRow key={issue.id} issue={issue} />
            ))
          )}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-center">
            <Button
              variant="secondary"
              size="sm"
              loading={loading}
              onClick={loadMore}
              leftIcon={<ChevronDown size={14} />}
            >
              Load More Issues
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Table Row ────────────────────────────────────────────────

function IssueTableRow({ issue }: { issue: Issue }) {
  const category = getCategoryMeta(issue.category);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 hover:bg-gray-50/70 transition-colors items-center">
      {/* Issue Title */}
      <div className="col-span-4">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {issue.title}
        </p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">
          {truncate(issue.location.address, 45)}
        </p>
        {issue.citizenName && (
          <p className="text-xs text-gray-400 mt-0.5">
            By: <span className="font-medium">{issue.citizenName}</span>
          </p>
        )}
      </div>

      {/* Category */}
      <div className="col-span-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium",
            category.bgColor,
            category.color
          )}
        >
          <span>{category.icon}</span>
          <span className="hidden sm:inline">{category.label}</span>
        </span>
      </div>

      {/* Status */}
      <div className="col-span-2">
        <IssueStatusBadge status={issue.status} size="sm" />
      </div>

      {/* Priority */}
      <div className="col-span-1">
        <IssuePriorityBadge priority={issue.priority} size="sm" />
      </div>

      {/* Reported */}
      <div className="col-span-2">
        <p className="text-xs text-gray-500">
          {formatRelativeTime(issue.createdAt)}
        </p>
      </div>

      {/* Action */}
      <div className="col-span-1">
        <Link href={`/admin/issues/${issue.id}`}>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Eye size={14} />}
          >
            <span className="hidden sm:inline">View</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="py-20 text-center">
      <FileText size={40} className="text-gray-200 mx-auto mb-4" />
      <p className="text-sm font-semibold text-gray-500 mb-1">
        No issues found
      </p>
      <p className="text-xs text-gray-400">
        Try adjusting your filters or check back later
      </p>
    </div>
  );
}