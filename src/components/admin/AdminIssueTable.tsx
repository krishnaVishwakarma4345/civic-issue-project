"use client";

import React              from "react";
import Link               from "next/link";
import { Eye }            from "lucide-react";
import IssueStatusBadge   from "@/components/issues/IssueStatusBadge";
import IssuePriorityBadge from "@/components/issues/IssuePriorityBadge";
import Button             from "@/components/ui/Button";
import { getCategoryMeta } from "@/lib/constants/categories";
import { formatRelativeTime, truncate } from "@/lib/utils/formatters";
import { cn }             from "@/lib/utils/cn";
import type { Issue }     from "@/types/issue";

interface AdminIssueTableProps {
  issues:     Issue[];
  basePath?:  string;
}

export default function AdminIssueTable({
  issues,
  basePath = "/admin/issues",
}: AdminIssueTableProps) {
  if (issues.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 text-sm">
        No issues to display.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            {["Title", "Category", "Status", "Priority", "Reported By", "Date", ""].map(
              (h) => (
                <th
                  key={h}
                  className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {issues.map((issue) => {
            const cat = getCategoryMeta(issue.category);
            return (
              <tr
                key={issue.id}
                className="hover:bg-gray-50/60 transition-colors"
              >
                <td className="py-3 px-4 max-w-[200px]">
                  <p className="font-medium text-gray-900 truncate">
                    {issue.title}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {truncate(issue.location.address, 35)}
                  </p>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
                      cat.bgColor,
                      cat.color
                    )}
                  >
                    {cat.icon}{" "}
                    <span className="hidden sm:inline">{cat.label}</span>
                  </span>
                </td>
                <td className="py-3 px-4">
                  <IssueStatusBadge status={issue.status} size="sm" />
                </td>
                <td className="py-3 px-4">
                  <IssuePriorityBadge priority={issue.priority} size="sm" />
                </td>
                <td className="py-3 px-4">
                  <p className="text-xs text-gray-700 font-medium">
                    {issue.citizenName ?? "—"}
                  </p>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <p className="text-xs text-gray-500">
                    {formatRelativeTime(issue.createdAt)}
                  </p>
                </td>
                <td className="py-3 px-4">
                  <Link href={`${basePath}/${issue.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Eye size={13} />}
                    >
                      View
                    </Button>
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}