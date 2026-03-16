"use client";

import React, { useEffect, useState } from "react";
import Link                           from "next/link";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Users,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { getIdToken }          from "@/lib/firebase/auth";
import { useAnalytics }        from "@/hooks/useAnalytics";
import PageHeader              from "@/components/layout/PageHeader";
import { Card, CardGrid }      from "@/components/ui/Card";
import Button                  from "@/components/ui/Button";
import StatsCard               from "@/components/analytics/StatsCard";
import IssueCard               from "@/components/issues/IssueCard";
import { SkeletonCard }        from "@/components/ui/Spinner";
import CategoryBarChart        from "@/components/analytics/CategoryBarChart";
import StatusPieChart          from "@/components/analytics/StatusPieChart";
import { formatDate }          from "@/lib/utils/formatters";
import { REPORTABLE_CATEGORIES } from "@/lib/constants/categories";
import { cn }                  from "@/lib/utils/cn";
import type { Issue }          from "@/types/issue";

export default function AdminDashboardPage() {
  const { data: analytics, loading, refresh } = useAnalytics();
  const [recentIssues, setRecentIssues]        = useState<Issue[]>([]);
  const [recentLoading, setRecentLoading]      = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const token = await getIdToken(true);
        const res = await fetch("/api/admin/issues?page=1&limit=6", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch recent issues");
        }

        const json = await res.json();
        setRecentIssues(json.data?.issues ?? []);
      } catch (err) {
        console.error("Failed to fetch recent issues:", err);
      } finally {
        setRecentLoading(false);
      }
    };
    fetchRecent();
  }, []);

  return (
    <div className="space-y-8">
      {/* ─── Header ──────────────────────────────────────── */}
      <PageHeader
        title="Admin Dashboard"
        subtitle={`Overview as of ${formatDate(new Date().toISOString())}`}
        actions={
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw size={14} />}
            loading={loading}
            onClick={refresh}
          >
            Refresh
          </Button>
        }
      />

      {/* ─── Stats Grid ───────────────────────────────────── */}
      <CardGrid cols={4}>
        <Link href="/admin/issues?status=all" className="block">
          <StatsCard
            title="Total Issues"
            value={analytics?.totalIssues ?? 0}
            icon={<FileText size={20} />}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            className="cursor-pointer hover:shadow-md transition-shadow"
          />
        </Link>
        <Link href="/admin/issues?status=pending" className="block">
          <StatsCard
            title="Pending Issues"
            value={analytics?.pendingIssues ?? 0}
            icon={<AlertCircle size={20} />}
            iconBg="bg-red-50"
            iconColor="text-red-600"
            className="cursor-pointer hover:shadow-md transition-shadow"
          />
        </Link>
        <Link href="/admin/issues?status=in-progress" className="block">
          <StatsCard
            title="In Progress"
            value={analytics?.inProgressIssues ?? 0}
            icon={<Clock size={20} />}
            iconBg="bg-yellow-50"
            iconColor="text-yellow-600"
            className="cursor-pointer hover:shadow-md transition-shadow"
          />
        </Link>
        <Link href="/admin/issues?status=resolved" className="block">
          <StatsCard
            title="Resolved"
            value={analytics?.resolvedIssues ?? 0}
            icon={<CheckCircle2 size={20} />}
            iconBg="bg-green-50"
            iconColor="text-green-600"
            className="cursor-pointer hover:shadow-md transition-shadow"
          />
        </Link>
      </CardGrid>

      {/* ─── KPI Row ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Resolution Rate */}
        <Card className="text-center">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center mx-auto mb-3">
            <TrendingUp size={18} className="text-primary-600" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900">
            {analytics?.resolutionRate ?? 0}%
          </p>
          <p className="text-sm text-gray-500 mt-1">Resolution Rate</p>
        </Card>

        {/* Avg Resolution Days */}
        <Card className="text-center">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
            <Clock size={18} className="text-blue-600" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900">
            {analytics?.avgResolutionDays ?? 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">Avg. Days to Resolve</p>
        </Card>

        {/* Categories */}
        <Card className="text-center">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mx-auto mb-3">
            <BarChart3 size={18} className="text-purple-600" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{REPORTABLE_CATEGORIES.length}</p>
          <p className="text-sm text-gray-500 mt-1">Issue Categories</p>
        </Card>
      </div>

      {/* ─── Charts Row ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="section-title">Issues by Category</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Distribution across all categories
              </p>
            </div>
            <Link href="/admin/analytics">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
                Full Report
              </Button>
            </Link>
          </div>
          {analytics?.categoryBreakdown ? (
            <CategoryBarChart data={analytics.categoryBreakdown} />
          ) : (
            <div className="h-48 bg-gray-50 animate-pulse rounded-lg" />
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="section-title">Status Distribution</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Current issue status breakdown
              </p>
            </div>
          </div>
          {analytics?.statusDistribution ? (
            <StatusPieChart data={analytics.statusDistribution} />
          ) : (
            <div className="h-48 bg-gray-50 animate-pulse rounded-lg" />
          )}
        </Card>
      </div>

      {/* ─── Recent Issues ────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="section-title">Recent Issues</p>
          <Link href="/admin/issues">
            <Button
              variant="ghost"
              size="sm"
              rightIcon={<ArrowRight size={14} />}
            >
              View All
            </Button>
          </Link>
        </div>

        {recentLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : recentIssues.length === 0 ? (
          <div className="card text-center py-12">
            <FileText size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No issues reported yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentIssues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                showAuthor
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}