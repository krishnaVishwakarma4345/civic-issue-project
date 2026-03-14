"use client";

import React, { useEffect, useState }   from "react";
import { useParams, useRouter }         from "next/navigation";
import Image                            from "next/image";
import {
  MapPin,
  Calendar,
  User,
  Building2,
  MessageSquare,
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  Mic,
  CheckCircle2,
} from "lucide-react";
import { subscribeToIssue }   from "@/lib/firebase/firestore";
import { useAuthContext }     from "@/context/AuthContext";
import PageHeader             from "@/components/layout/PageHeader";
import { Card }               from "@/components/ui/Card";
import Button                 from "@/components/ui/Button";
import IssueStatusBadge       from "@/components/issues/IssueStatusBadge";
import IssuePriorityBadge     from "@/components/issues/IssuePriorityBadge";
import IssueTimeline          from "@/components/issues/IssueTimeline";
import { SkeletonCard }       from "@/components/ui/Spinner";
import Alert                  from "@/components/ui/Alert";
import { getCategoryMeta }    from "@/lib/constants/categories";
import { getDepartmentById }  from "@/lib/constants/departments";
import { formatDateTime, formatRelativeTime } from "@/lib/utils/formatters";
import type { Issue }         from "@/types/issue";

export default function IssueDetailPage() {
  const { id }       = useParams<{ id: string }>();
  const router       = useRouter();
  const { userData } = useAuthContext();

  const [issue,   setIssue]   = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // ─── Real-time subscription ───────────────────────────────

  useEffect(() => {
    if (!id) return;

    setLoading(true);

    const unsubscribe = subscribeToIssue(id, (updatedIssue) => {
      if (!updatedIssue) {
        setError("Issue not found or you don't have access.");
      } else {
        setIssue(updatedIssue);
        setError(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Alert variant="error" title="Issue not found">
          {error ?? "This issue doesn't exist or has been removed."}
        </Alert>
        <Button
          variant="secondary"
          leftIcon={<ArrowLeft size={16} />}
          onClick={() => router.back()}
        >
          Go Back
        </Button>
      </div>
    );
  }

  const category   = getCategoryMeta(issue.category);
  const department = issue.assignedDepartment
    ? getDepartmentById(issue.assignedDepartment)
    : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ─── Page Header ─────────────────────────────────── */}
      <PageHeader
        title={issue.title}
        breadcrumbs={[
          { label: "Dashboard",  href: "/dashboard"  },
          { label: "My Issues",  href: "/my-issues"  },
          { label: "Issue Details" },
        ]}
        actions={
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<ArrowLeft size={14} />}
            onClick={() => router.back()}
          >
            Back
          </Button>
        }
      />

      {/* ─── Status Timeline ─────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <p className="section-title">Issue Progress</p>
          <div className="flex items-center gap-2">
            <IssueStatusBadge   status={issue.status}   />
            <IssuePriorityBadge priority={issue.priority} />
          </div>
        </div>
        <IssueTimeline currentStatus={issue.status} />
      </Card>

      {/* ─── Issue Details ───────────────────────────────── */}
      <Card>
        <div className="flex items-start gap-3 mb-5">
          <div className={`w-11 h-11 rounded-xl ${category.bgColor} flex items-center justify-center text-xl shrink-0`}>
            {category.icon}
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wide ${category.color}`}>
              {category.label}
            </p>
            <h2 className="text-lg font-bold text-gray-900 mt-0.5">
              {issue.title}
            </h2>
          </div>
        </div>

        <p className="text-sm text-gray-700 leading-relaxed mb-5">
          {issue.description}
        </p>

        {/* Audio Description */}
        {issue.audioUrl && (
          <div className="mb-5 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                <Mic size={15} className="text-red-500" />
              </div>
              <p className="text-xs font-semibold text-gray-700">Audio Description</p>
            </div>
            <audio
              src={issue.audioUrl}
              controls
              className="w-full h-10"
              preload="metadata"
            />
          </div>
        )}

        {/* Meta Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <MetaItem
            icon={<MapPin size={15} />}
            label="Location"
            value={issue.location.address}
            subValue={`${issue.location.latitude.toFixed(4)}, ${issue.location.longitude.toFixed(4)}`}
          />
          <MetaItem
            icon={<Calendar size={15} />}
            label="Reported"
            value={formatDateTime(issue.createdAt)}
            subValue={formatRelativeTime(issue.createdAt)}
          />
          <MetaItem
            icon={<User size={15} />}
            label="Reported By"
            value={issue.citizenName ?? "Citizen"}
            subValue={issue.citizenEmail}
          />
          <MetaItem
            icon={<RefreshCw size={15} />}
            label="Last Updated"
            value={formatDateTime(issue.updatedAt)}
            subValue={formatRelativeTime(issue.updatedAt)}
          />
        </div>

        {/* Open in Maps */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          {/* FIX: was missing the opening <a tag — started directly with href= */}
          <a
            href={`https://maps.google.com/?q=${issue.location.latitude},${issue.location.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <ExternalLink size={14} />
            View on Google Maps
          </a>
        </div>
      </Card>

      {/* ─── Department & Remarks ────────────────────────── */}
      {(issue.assignedDepartment || issue.adminRemarks || issue.resolvedImageUrl) && (
        <Card>
          <p className="section-title mb-4">Authority Response</p>

          {issue.assignedDepartment && (
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Building2 size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Assigned Department
                </p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {department?.name ?? issue.assignedDepartment}
                </p>
                {department?.contact && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {department.contact}
                  </p>
                )}
              </div>
            </div>
          )}

          {issue.adminRemarks && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                <MessageSquare size={16} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Admin Remarks
                </p>
                <p className="text-sm text-gray-800 mt-0.5 leading-relaxed">
                  {issue.adminRemarks}
                </p>
              </div>
            </div>
          )}

          {issue.resolvedImageUrl && (
            <div className="flex items-start gap-3 mt-4">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} className="text-emerald-600" />
              </div>
              <div className="w-full">
                <p className="text-xs font-medium text-gray-500 mb-2">
                  Resolved Site Photo
                </p>
                <a
                  href={issue.resolvedImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative block aspect-video rounded-xl overflow-hidden bg-gray-100 group"
                >
                  <Image
                    src={issue.resolvedImageUrl}
                    alt="Resolved site"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <ExternalLink
                      size={18}
                      className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                </a>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ─── Image Gallery ───────────────────────────────── */}
      {issue.images.length > 0 && (
        <Card>
          <p className="section-title mb-4">
            Attached Photos ({issue.images.length})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {issue.images.map((url, index) => (
              // FIX: was missing the opening <a tag — started directly with key={index}
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group block"
              >
                <Image
                  src={url}
                  alt={`Issue photo ${index + 1}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <ExternalLink
                    size={18}
                    className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* ─── Issue ID Footer ─────────────────────────────── */}
      <div className="text-center py-2">
        <p className="text-xs text-gray-300 font-mono">
          Issue ID: {issue.id}
        </p>
      </div>
    </div>
  );
}

// ─── Meta Item ────────────────────────────────────────────────

function MetaItem({
  icon,
  label,
  value,
  subValue,
}: {
  icon:      React.ReactNode;
  label:     string;
  value:     string;
  subValue?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-sm text-gray-900 font-medium mt-0.5 break-words">
          {value}
        </p>
        {subValue && (
          <p className="text-xs text-gray-400 mt-0.5">{subValue}</p>
        )}
      </div>
    </div>
  );
}