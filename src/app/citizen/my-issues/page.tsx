"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams }                      from "next/navigation";
import Link                                     from "next/link";
import { PlusCircle, FileText }                 from "lucide-react";
import { useIssues }                            from "@/hooks/useIssues";
import PageHeader                               from "@/components/layout/PageHeader";
import IssueCard                                from "@/components/issues/IssueCard";
import IssueFilters                             from "@/components/issues/IssueFilters";
import Button                                   from "@/components/ui/Button";
import { SkeletonCard }                         from "@/components/ui/Spinner";
import { useIssueStore }                        from "@/store/issueStore";
import type { IssueFilters as IssueFiltersType } from "@/types/issue";

export default function MyIssuesPage() {
  const searchParams                  = useSearchParams();
  const { myIssues, loading }         = useIssues();
  const { filters, setFilters, resetFilters } = useIssueStore();

  // Pre-apply status filter from URL query param (?status=resolved)
  useEffect(() => {
    const status = searchParams.get("status");
    if (status) {
      setFilters({ status: status as IssueFiltersType["status"] });
    }
  }, [searchParams, setFilters]);

  // ─── Client-Side Filter ───────────────────────────────────

  const filteredIssues = useMemo(() => {
    let result = [...myIssues];

    if (filters.category && filters.category !== "all") {
      result = result.filter((i) => i.category === filters.category);
    }
    if (filters.status && filters.status !== "all") {
      result = result.filter((i) => i.status === filters.status);
    }
    if (filters.priority && filters.priority !== "all") {
      result = result.filter((i) => i.priority === filters.priority);
    }
    if (filters.search) {
      const term = filters.search.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(term) ||
          i.description.toLowerCase().includes(term) ||
          i.location.address.toLowerCase().includes(term)
      );
    }

    return result;
  }, [myIssues, filters]);

  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────────── */}
      <PageHeader
        title="My Issues"
        subtitle={`${myIssues.length} total issue${myIssues.length !== 1 ? "s" : ""} reported`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "My Issues" },
        ]}
        actions={
          <Link href="/report-issue">
            <Button variant="primary" leftIcon={<PlusCircle size={16} />}>
              Report New
            </Button>
          </Link>
        }
      />

      {/* ─── Filters ─────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4">
        <IssueFilters
          filters={filters}
          onFilterChange={setFilters}
          onReset={resetFilters}
        />
      </div>

      {/* ─── Results Summary ─────────────────────────────── */}
      {!loading && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {filteredIssues.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-900">
              {myIssues.length}
            </span>{" "}
            issues
          </p>
          {filters.search && (
            <p className="text-gray-400 text-xs">
              Results for "{filters.search}"
            </p>
          )}
        </div>
      )}

      {/* ─── Issue Grid ──────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredIssues.length === 0 ? (
        <EmptyState hasFilters={
          !!(filters.category !== "all" ||
            filters.status !== "all" ||
            filters.priority !== "all" ||
            filters.search)
        } />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIssues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Empty States ─────────────────────────────────────────────

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="card text-center py-16">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
        <FileText size={28} className="text-gray-300" />
      </div>
      {hasFilters ? (
        <>
          <p className="font-semibold text-gray-700 mb-1">
            No issues match your filters
          </p>
          <p className="text-sm text-gray-400 mb-5">
            Try adjusting or clearing your filters
          </p>
        </>
      ) : (
        <>
          <p className="font-semibold text-gray-700 mb-1">
            No issues reported yet
          </p>
          <p className="text-sm text-gray-400 mb-5 max-w-xs mx-auto">
            When you report civic issues, they'll appear here for tracking.
          </p>
          <Link href="/report-issue">
            <Button variant="primary" leftIcon={<PlusCircle size={16} />}>
              Report Your First Issue
            </Button>
          </Link>
        </>
      )}
    </div>
  );
}