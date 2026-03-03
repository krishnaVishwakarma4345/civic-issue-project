"use client";

import React, { useState, useMemo } from "react";
import dynamic                      from "next/dynamic";
import { useIssues }                from "@/hooks/useIssues";
import PageHeader                   from "@/components/layout/PageHeader";
import IssueStatusBadge             from "@/components/issues/IssueStatusBadge";
import IssuePriorityBadge           from "@/components/issues/IssuePriorityBadge";
import { SkeletonCard }             from "@/components/ui/Spinner";
import { getCategoryMeta }          from "@/lib/constants/categories";
import { STATUSES }                 from "@/lib/constants/statuses";
import { formatRelativeTime }       from "@/lib/utils/formatters";
import { cn }                       from "@/lib/utils/cn";
import type { Issue, IssueStatus }  from "@/types/issue";

const IssueMap = dynamic(() => import("@/components/map/MapView"), {
  ssr:     false,
  loading: () => (
    <div className="w-full h-full rounded-xl bg-gray-100 animate-pulse flex items-center justify-center">
      <p className="text-sm text-gray-400">Loading map...</p>
    </div>
  ),
});

// ─── Priority legend config ───────────────────────────────────

const PRIORITY_LEGEND = [
  { label: "High Priority",   color: "#ef4444", size: "w-4 h-5"   },
  { label: "Medium Priority", color: "#f59e0b", size: "w-3.5 h-4" },
  { label: "Low Priority",    color: "#3b82f6", size: "w-3 h-3.5" },
];

export default function MapPage() {
  const { myIssues, loading }             = useIssues();
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [statusFilter,  setStatusFilter]  = useState<IssueStatus | "all">("all");

  const filteredIssues = useMemo(() => {
    if (statusFilter === "all") return myIssues;
    return myIssues.filter((i) => i.status === statusFilter);
  }, [myIssues, statusFilter]);

  return (
    <div className="space-y-4">
      {/* ─── Header ──────────────────────────────────────── */}
      <PageHeader
        title="Issue Map"
        subtitle={`Viewing ${filteredIssues.length} issue${filteredIssues.length !== 1 ? "s" : ""} on map`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Map View" },
        ]}
      />

      {/* ─── Status Filter Tabs ──────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <StatusTab
          label="All"
          count={myIssues.length}
          active={statusFilter === "all"}
          onClick={() => setStatusFilter("all")}
          color="bg-gray-100 text-gray-700 border-gray-200"
          activeColor="bg-gray-800 text-white border-gray-800"
        />
        {STATUSES.map((s) => {
          const count = myIssues.filter((i) => i.status === s.value).length;
          return (
            <StatusTab
              key={s.value}
              label={s.label}
              count={count}
              active={statusFilter === s.value}
              onClick={() => setStatusFilter(s.value as IssueStatus)}
              color={`${s.bgColor} ${s.color} ${s.borderColor}`}
              activeColor={`${s.dotColor.replace("bg-", "bg-")} text-white border-transparent`}
            />
          );
        })}
      </div>

      {/* ─── Priority Pin Legend ─────────────────────────── */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-xs font-semibold text-gray-500 mr-2">Pin legend:</span>
        {PRIORITY_LEGEND.map((item) => (
          <span
            key={item.label}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white
                       border border-gray-100 shadow-sm text-xs text-gray-600 font-medium"
          >
            {/* Pin shape indicator */}
            <svg
              viewBox="0 0 10 14"
              width="8"
              height="11"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              <path
                d="M5 0C2.8 0 1 1.8 1 4c0 2.8 4 10 4 10s4-7.2 4-10C9 1.8 7.2 0 5 0z"
                fill={item.color}
              />
            </svg>
            {item.label}
          </span>
        ))}
        {/* Resolved checkmark pin */}
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white
                         border border-gray-100 shadow-sm text-xs text-gray-600 font-medium">
          <svg viewBox="0 0 10 14" width="8" height="11" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <path d="M5 0C2.8 0 1 1.8 1 4c0 2.8 4 10 4 10s4-7.2 4-10C9 1.8 7.2 0 5 0z" fill="#16a34a"/>
            <polyline points="3,4 4.5,5.5 7,3" fill="none" stroke="white" strokeWidth="1.2"
                      strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Resolved
        </span>
      </div>

      {/* ─── Main Layout ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-320px)] min-h-[500px]">

        {/* Map */}
        <div className="lg:col-span-2 rounded-xl overflow-hidden border border-gray-200 shadow-card bg-gray-100">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-sm text-gray-400">Loading your issues...</p>
            </div>
          ) : (
            <IssueMap
              issues={filteredIssues}
              selectedIssue={selectedIssue}
              onIssueSelect={setSelectedIssue}
            />
          )}
        </div>

        {/* Sidebar Panel */}
        <div className="flex flex-col gap-3 overflow-y-auto">
          {loading ? (
            [1, 2, 3].map((i) => <SkeletonCard key={i} />)
          ) : filteredIssues.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 text-center py-10 px-4">
              <p className="text-4xl mb-3">🗺️</p>
              <p className="text-sm font-medium text-gray-600">No issues to display</p>
              <p className="text-xs text-gray-400 mt-1">
                {statusFilter !== "all"
                  ? `No ${statusFilter} issues found`
                  : "Report an issue to see it here"}
              </p>
            </div>
          ) : (
            filteredIssues.map((issue) => (
              <MapIssueCard
                key={issue.id}
                issue={issue}
                isSelected={selectedIssue?.id === issue.id}
                onClick={() =>
                  setSelectedIssue(selectedIssue?.id === issue.id ? null : issue)
                }
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Status Tab ───────────────────────────────────────────────

function StatusTab({
  label, count, active, onClick, color, activeColor,
}: {
  label: string; count: number; active: boolean;
  onClick: () => void; color: string; activeColor: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
        "border transition-all duration-150 whitespace-nowrap shrink-0",
        active ? activeColor : color
      )}
    >
      {label}
      <span className={cn(
        "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
        active ? "bg-white/20" : "bg-black/5"
      )}>
        {count}
      </span>
    </button>
  );
}

// ─── Map Issue Card ───────────────────────────────────────────

function MapIssueCard({
  issue, isSelected, onClick,
}: {
  issue: Issue; isSelected: boolean; onClick: () => void;
}) {
  const category = getCategoryMeta(issue.category);

  // Priority left-border color
  const priorityBorder: Record<string, string> = {
    high:   "border-l-red-400",
    medium: "border-l-amber-400",
    low:    "border-l-blue-400",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-xl border border-l-4 p-4 cursor-pointer transition-all duration-150",
        priorityBorder[issue.priority] ?? "border-l-gray-200",
        isSelected
          ? "border-primary-400 shadow-md ring-2 ring-primary-200"
          : "border-gray-100 hover:border-gray-200 hover:shadow-sm"
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0",
          category.bgColor
        )}>
          {category.icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{issue.title}</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{issue.location.address}</p>
          <div className="flex items-center gap-2 mt-2">
            <IssueStatusBadge   status={issue.status}   size="sm" />
            <IssuePriorityBadge priority={issue.priority} size="sm" />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">{formatRelativeTime(issue.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}