"use client";

import React, { useEffect, useState } from "react";
import Link                           from "next/link";
import {
  PlusCircle,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  MapPin,
} from "lucide-react";
import { useAuthContext }    from "@/context/AuthContext";
import { useIssues }         from "@/hooks/useIssues";
import PageHeader            from "@/components/layout/PageHeader";
import { Card, CardGrid }    from "@/components/ui/Card";
import Button                from "@/components/ui/Button";
import IssueCard             from "@/components/issues/IssueCard";
import { SkeletonCard }      from "@/components/ui/Spinner";
import { formatDate }        from "@/lib/utils/formatters";
import { cn }                from "@/lib/utils/cn";
import type { IssueStatus }  from "@/types/issue";

// ─── Stats Config ─────────────────────────────────────────────

interface StatCardData {
  label:     string;
  value:     number;
  icon:      React.ReactNode;
  iconBg:    string;
  iconColor: string;
  href:      string;
  filterStatus?: IssueStatus;
}

export default function CitizenDashboardPage() {
  const { userData }         = useAuthContext();
  const { myIssues, loading } = useIssues();

  // ─── Derived Stats ────────────────────────────────────────

  const stats = {
    total:      myIssues.length,
    reported:   myIssues.filter((i) => i.status === "reported").length,
    inProgress: myIssues.filter(
      (i) => i.status === "assigned" || i.status === "in-progress"
    ).length,
    resolved:   myIssues.filter((i) => i.status === "resolved").length,
  };

  const resolutionRate =
    stats.total > 0
      ? Math.round((stats.resolved / stats.total) * 100)
      : 0;

  const STAT_CARDS: StatCardData[] = [
    {
      label:     "Total Reported",
      value:     stats.total,
      icon:      <FileText size={20} />,
      iconBg:    "bg-blue-50",
      iconColor: "text-blue-600",
      href:      "/my-issues",
    },
    {
      label:     "Pending",
      value:     stats.reported,
      icon:      <AlertCircle size={20} />,
      iconBg:    "bg-red-50",
      iconColor: "text-red-600",
      href:      "/my-issues?status=reported",
    },
    {
      label:     "In Progress",
      value:     stats.inProgress,
      icon:      <Clock size={20} />,
      iconBg:    "bg-yellow-50",
      iconColor: "text-yellow-600",
      href:      "/my-issues?status=in-progress",
    },
    {
      label:     "Resolved",
      value:     stats.resolved,
      icon:      <CheckCircle2 size={20} />,
      iconBg:    "bg-green-50",
      iconColor: "text-green-600",
      href:      "/my-issues?status=resolved",
    },
  ];

  const recentIssues = [...myIssues]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 4);

  return (
    <div className="space-y-8">
      {/* ─── Page Header ──────────────────────────────────── */}
      <PageHeader
        title={`Welcome back, ${userData?.name?.split(" ")[0] ?? "Citizen"} 👋`}
        subtitle={`Today is ${formatDate(new Date().toISOString())}. Here's your issue overview.`}
        actions={
          <Link href="/report-issue">
            <Button
              variant="primary"
              leftIcon={<PlusCircle size={16} />}
            >
              Report Issue
            </Button>
          </Link>
        }
      />

      {/* ─── Stats Grid ───────────────────────────────────── */}
      <CardGrid cols={4}>
        {STAT_CARDS.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <div className="card hover:shadow-md hover:border-gray-200 transition-all duration-200 cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    stat.iconBg
                  )}
                >
                  <span className={stat.iconColor}>{stat.icon}</span>
                </div>
                <ArrowRight
                  size={14}
                  className="text-gray-300 group-hover:text-primary-500 transition-colors"
                />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? (
                  <span className="inline-block w-8 h-7 bg-gray-100 rounded animate-pulse" />
                ) : (
                  stat.value
                )}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          </Link>
        ))}
      </CardGrid>

      {/* ─── Resolution Rate + Quick Actions ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resolution Rate */}
        <Card className="lg:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <TrendingUp size={18} className="text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Resolution Rate
              </p>
              <p className="text-xs text-gray-500">Your issues resolved</p>
            </div>
          </div>

          {/* Circle Progress */}
          <div className="flex items-center justify-center py-4">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18" cy="18" r="15.9"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="3"
                />
                <circle
                  cx="18" cy="18" r="15.9"
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth="3"
                  strokeDasharray={`${resolutionRate} ${100 - resolutionRate}`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-gray-900">
                  {resolutionRate}%
                </span>
                <span className="text-xs text-gray-400">Resolved</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="text-center p-2 rounded-lg bg-green-50">
              <p className="text-lg font-bold text-green-700">
                {stats.resolved}
              </p>
              <p className="text-xs text-green-600">Resolved</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-gray-50">
              <p className="text-lg font-bold text-gray-700">
                {stats.total - stats.resolved}
              </p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-2">
          <p className="section-title mb-4">Quick Actions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                href:    "/report-issue",
                icon:    "📝",
                title:   "Report New Issue",
                desc:    "Submit a civic problem in your area",
                bg:      "bg-primary-50 hover:bg-primary-100",
                border:  "border-primary-100 hover:border-primary-200",
              },
              {
                href:    "/my-issues",
                icon:    "📋",
                title:   "View My Issues",
                desc:    "Track status of all your reports",
                bg:      "bg-blue-50 hover:bg-blue-100",
                border:  "border-blue-100 hover:border-blue-200",
              },
              {
                href:    "/map",
                icon:    "🗺️",
                title:   "Issue Map",
                desc:    "See all issues near you on map",
                bg:      "bg-green-50 hover:bg-green-100",
                border:  "border-green-100 hover:border-green-200",
              },
              {
                href:    "/my-issues?status=resolved",
                icon:    "✅",
                title:   "Resolved Issues",
                desc:    "Review your closed reports",
                bg:      "bg-purple-50 hover:bg-purple-100",
                border:  "border-purple-100 hover:border-purple-200",
              },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border",
                  "transition-all duration-200 group",
                  action.bg,
                  action.border
                )}
              >
                <span className="text-2xl">{action.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {action.title}
                  </p>
                  <p className="text-xs text-gray-500">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* ─── Recent Issues ─────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="section-title">Recent Issues</p>
          <Link href="/my-issues">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
              View all
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : recentIssues.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recentIssues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="card text-center py-14">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
        <MapPin size={28} className="text-gray-300" />
      </div>
      <p className="font-semibold text-gray-700 mb-1">No issues reported yet</p>
      <p className="text-sm text-gray-400 mb-5 max-w-xs mx-auto">
        Start by reporting a civic issue in your neighborhood. It takes less
        than 2 minutes.
      </p>
      <Link href="/report-issue">
        <Button variant="primary" leftIcon={<PlusCircle size={16} />}>
          Report Your First Issue
        </Button>
      </Link>
    </div>
  );
}