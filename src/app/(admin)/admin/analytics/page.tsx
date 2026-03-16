"use client";

import React            from "react";
import Link             from "next/link";
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useAnalytics }       from "@/hooks/useAnalytics";
import PageHeader             from "@/components/layout/PageHeader";
import { Card, CardGrid }     from "@/components/ui/Card";
import StatsCard              from "@/components/analytics/StatsCard";
import CategoryBarChart       from "@/components/analytics/CategoryBarChart";
import MonthlyTrendChart      from "@/components/analytics/MonthlyTrendChart";
import StatusPieChart         from "@/components/analytics/StatusPieChart";
import Button                 from "@/components/ui/Button";
import Alert                  from "@/components/ui/Alert";
import { SkeletonCard }       from "@/components/ui/Spinner";
import { CATEGORIES, REPORTABLE_CATEGORIES } from "@/lib/constants/categories";
import { PRIORITIES }         from "@/lib/constants/priorities";
import { cn }                 from "@/lib/utils/cn";

export default function AnalyticsPage() {
  const { data, loading, error, refresh } = useAnalytics();

  return (
    <div className="space-y-8">
      {/* ─── Header ──────────────────────────────────────── */}
      <PageHeader
        title="Analytics & Reports"
        subtitle="System-wide issue statistics and trends"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Analytics" },
        ]}
        actions={
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw size={14} />}
            loading={loading}
            onClick={refresh}
          >
            Refresh Data
          </Button>
        }
      />

      {/* ─── Error ───────────────────────────────────────── */}
      {error && (
        <Alert variant="error" title="Failed to load analytics">
          {error}
        </Alert>
      )}

      {/* ─── Key Stats ───────────────────────────────────── */}
      {loading ? (
        <CardGrid cols={4}>
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </CardGrid>
      ) : (
        <CardGrid cols={4}>
          <Link href="/admin/issues?status=all" className="block">
            <StatsCard
              title="Total Issues"
              value={data?.totalIssues ?? 0}
              icon={<FileText size={20} />}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              className="cursor-pointer hover:shadow-md transition-shadow"
            />
          </Link>
          <Link href="/admin/issues?status=pending" className="block">
            <StatsCard
              title="Pending"
              value={data?.pendingIssues ?? 0}
              icon={<AlertCircle size={20} />}
              iconBg="bg-red-50"
              iconColor="text-red-600"
              className="cursor-pointer hover:shadow-md transition-shadow"
            />
          </Link>
          <Link href="/admin/issues?status=in-progress" className="block">
            <StatsCard
              title="In Progress"
              value={data?.inProgressIssues ?? 0}
              icon={<Clock size={20} />}
              iconBg="bg-yellow-50"
              iconColor="text-yellow-600"
              className="cursor-pointer hover:shadow-md transition-shadow"
            />
          </Link>
          <Link href="/admin/issues?status=resolved" className="block">
            <StatsCard
              title="Resolved"
              value={data?.resolvedIssues ?? 0}
              icon={<CheckCircle2 size={20} />}
              iconBg="bg-green-50"
              iconColor="text-green-600"
              className="cursor-pointer hover:shadow-md transition-shadow"
            />
          </Link>
        </CardGrid>
      )}

      {/* ─── KPI Row ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIBlock
          label="Resolution Rate"
          value={`${data?.resolutionRate ?? 0}%`}
          icon="📈"
          color="text-primary-600"
          bg="bg-primary-50"
          loading={loading}
        />
        <KPIBlock
          label="Avg. Resolution Time"
          value={`${data?.avgResolutionDays ?? 0} days`}
          icon="⏱️"
          color="text-blue-600"
          bg="bg-blue-50"
          loading={loading}
        />
        <KPIBlock
          label="Issue Categories"
          value={`${REPORTABLE_CATEGORIES.length} types`}
          icon="📂"
          color="text-purple-600"
          bg="bg-purple-50"
          loading={loading}
        />
        <KPIBlock
          label="Departments Active"
          value={`${
            data?.categoryBreakdown?.filter((c) => c.count > 0).length ?? 0
          } depts`}
          icon="🏢"
          color="text-orange-600"
          bg="bg-orange-50"
          loading={loading}
        />
      </div>

      {/* ─── Charts Row 1 ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="mb-4">
            <p className="section-title">Issues by Category</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Total issues per civic category
            </p>
          </div>
          {loading ? (
            <div className="h-56 bg-gray-50 animate-pulse rounded-lg" />
          ) : data?.categoryBreakdown ? (
            <CategoryBarChart data={data.categoryBreakdown} />
          ) : null}
        </Card>

        <Card>
          <div className="mb-4">
            <p className="section-title">Status Distribution</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Current status of all issues
            </p>
          </div>
          {loading ? (
            <div className="h-56 bg-gray-50 animate-pulse rounded-lg" />
          ) : data?.statusDistribution ? (
            <StatusPieChart data={data.statusDistribution} />
          ) : null}
        </Card>
      </div>

      {/* ─── Monthly Trend ───────────────────────────────── */}
      <Card>
        <div className="mb-4">
          <p className="section-title">Monthly Trend</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Issues reported vs resolved over the last 6 months
          </p>
        </div>
        {loading ? (
          <div className="h-64 bg-gray-50 animate-pulse rounded-lg" />
        ) : data?.monthlyTrend ? (
          <MonthlyTrendChart data={data.monthlyTrend} />
        ) : null}
      </Card>

      {/* ─── Priority Distribution ───────────────────────── */}
      <Card>
        <div className="mb-5">
          <p className="section-title">Priority Breakdown</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Distribution of issue urgency levels
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-gray-50 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {data?.priorityDistribution?.map((p) => {
              const meta       = PRIORITIES.find((pr) => pr.value === p.priority);
              const percentage =
                data.totalIssues > 0
                  ? Math.round((p.count / data.totalIssues) * 100)
                  : 0;

              return (
                <div key={p.priority}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "w-2.5 h-2.5 rounded-full",
                          meta?.dotColor ?? "bg-gray-300"
                        )}
                      />
                      <span className="font-medium text-gray-700 capitalize">
                        {p.priority} Priority
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500">{p.count} issues</span>
                      <span className="font-semibold text-gray-900 w-10 text-right">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        p.priority === "high"   && "bg-red-500",
                        p.priority === "medium" && "bg-yellow-500",
                        p.priority === "low"    && "bg-green-500"
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ─── Category Detail Table ───────────────────────── */}
      <Card>
        <div className="mb-5">
          <p className="section-title">Category Performance</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Detailed breakdown per category
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Category
                </th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Total
                </th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Share
                </th>
                <th className="py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Distribution
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i}>
                      <td colSpan={4} className="py-3 px-2">
                        <div className="h-8 bg-gray-50 animate-pulse rounded" />
                      </td>
                    </tr>
                  ))
                : data?.categoryBreakdown?.map((item) => {
                    const catMeta    = CATEGORIES.find(
                      (c) => c.value === item.category
                    );
                    const percentage =
                      data.totalIssues > 0
                        ? Math.round((item.count / data.totalIssues) * 100)
                        : 0;

                    return (
                      <tr
                        key={item.category}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center text-base",
                                catMeta?.bgColor ?? "bg-gray-100"
                              )}
                            >
                              {catMeta?.icon ?? "📌"}
                            </span>
                            <span className="font-medium text-gray-800">
                              {catMeta?.label ?? item.category}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right font-semibold text-gray-900">
                          {item.count}
                        </td>
                        <td className="py-3 px-2 text-right text-gray-500">
                          {percentage}%
                        </td>
                        <td className="py-3 px-2 min-w-[120px]">
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-500 rounded-full transition-all duration-700"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── KPI Block ────────────────────────────────────────────────

function KPIBlock({
  label,
  value,
  icon,
  color,
  bg,
  loading,
}: {
  label:   string;
  value:   string;
  icon:    string;
  color:   string;
  bg:      string;
  loading: boolean;
}) {
  return (
    <div className={cn("rounded-xl p-5 flex items-center gap-4", bg)}>
      <span className="text-3xl">{icon}</span>
      <div>
        <p className="text-xs font-medium text-gray-500">{label}</p>
        {loading ? (
          <div className="h-7 w-20 bg-white/60 animate-pulse rounded mt-1" />
        ) : (
          <p className={cn("text-xl font-extrabold mt-0.5", color)}>{value}</p>
        )}
      </div>
    </div>
  );
}