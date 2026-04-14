"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter }                    from "next/navigation";
import Image                                       from "next/image";
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Mic,
  ImageIcon,
} from "lucide-react";
import { getIdToken }          from "@/lib/firebase/auth";
import { useAuthContext }      from "@/context/AuthContext";
import { useAdminIssues }      from "@/hooks/useAdminIssues";
import PageHeader              from "@/components/layout/PageHeader";
import { Card }                from "@/components/ui/Card";
import Button                  from "@/components/ui/Button";
import Alert                   from "@/components/ui/Alert";
import ImageUploader           from "@/components/issues/ImageUploader";
import IssueStatusBadge        from "@/components/issues/IssueStatusBadge";
import IssuePriorityBadge      from "@/components/issues/IssuePriorityBadge";
import IssueTimeline           from "@/components/issues/IssueTimeline";
import { SkeletonCard }        from "@/components/ui/Spinner";
import { getCategoryMeta }     from "@/lib/constants/categories";
import { STATUS_TRANSITIONS,
         getStatusMeta }       from "@/lib/constants/statuses";
import { formatDateTime,
         formatRelativeTime }  from "@/lib/utils/formatters";
import type { Issue, IssueStatus } from "@/types/issue";

// ─── Page ─────────────────────────────────────────────────────

export default function AdminIssueDetailPage() {
  const { id }     = useParams<{ id: string }>();
  const router     = useRouter();
  const { updateIssueStatus, submitting } = useAdminIssues();
  const { isMasterAdmin } = useAuthContext();

  const [issue,       setIssue]       = useState<Issue | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);

  // ─── Real-time Subscription ───────────────────────────────

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const fetchIssue = async () => {
      try {
        const token = await getIdToken(true);
        const res = await fetch(`/api/issues/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Issue not found.");
        }

        const json = await res.json();
        const updated = json.data as Issue;
        setIssue(updated);
        setResolvedImageUrl(updated.resolvedImageUrl ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Issue not found.");
      } finally {
        setLoading(false);
      }
    };

    fetchIssue();
  }, [id]);

  // ─── Status Transition ────────────────────────────────────

  const handleStatusChange = useCallback(
    async (newStatus: IssueStatus) => {
      if (!issue) return;
      setSaveSuccess(false);
      setActionError(null);

      if (newStatus === "resolved" && !resolvedImageUrl && !issue.resolvedImageUrl) {
        setActionError("Upload a photo of the resolved site before marking this issue as resolved.");
        return;
      }

      const success = await updateIssueStatus({
        id:     issue.id,
        status: newStatus,
        ...(newStatus === "resolved" && (resolvedImageUrl || issue.resolvedImageUrl)
          ? { resolvedImageUrl: resolvedImageUrl ?? issue.resolvedImageUrl }
          : {}),
      });

      if (success) {
        setSaveSuccess(true);
        setIssue((prev) => prev
          ? {
              ...prev,
              status: newStatus,
              resolvedImageUrl: resolvedImageUrl ?? prev.resolvedImageUrl,
            }
          : prev);
      }
    },
    [issue, resolvedImageUrl, updateIssueStatus]
  );

  // ─── Render ───────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Alert variant="error" title="Issue not found">
          {error ?? "This issue could not be loaded."}
        </Alert>
        <Button
          variant="secondary"
          leftIcon={<ArrowLeft size={16} />}
          onClick={() => router.back()}
        >
          Back to Issues
        </Button>
      </div>
    );
  }

  const category            = getCategoryMeta(issue.category);
  const allowedTransitions  = STATUS_TRANSITIONS[issue.status];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ─── Header ──────────────────────────────────────── */}
      <PageHeader
        title={issue.title}
        subtitle={`Issue ID: ${issue.id}`}
        breadcrumbs={[
          { label: "Dashboard",   href: "/admin/dashboard" },
          { label: "All Issues",  href: "/admin/issues"    },
          { label: "Issue Detail"                          },
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

      {/* ─── Success Alert ────────────────────────────────── */}
      {saveSuccess && (
        <Alert
          variant="success"
          title="Issue updated"
          onDismiss={() => setSaveSuccess(false)}
        >
          Changes have been saved successfully.
        </Alert>
      )}

      {actionError && (
        <Alert
          variant="error"
          title="Action required"
          onDismiss={() => setActionError(null)}
        >
          {actionError}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Left Column ─────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Timeline */}
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

          {/* Details */}
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
              </div >
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100 text-sm">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">📍 Location</p>
                <p className="text-gray-800">{issue.location.address}</p>
                
                <a  href={`https://maps.google.com/?q=${issue.location.latitude},${issue.location.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary-600 mt-1 hover:underline"
                >
                  <ExternalLink size={11} /> Open in Maps
                </a>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">👤 Reported By</p>
                <p className="text-gray-800 font-medium">{issue.citizenName ?? "Unknown"}</p>
                <p className="text-xs text-gray-400">{issue.citizenEmail}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">📅 Reported</p>
                <p className="text-gray-800">{formatDateTime(issue.createdAt)}</p>
                <p className="text-xs text-gray-400">{formatRelativeTime(issue.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">🔄 Last Updated</p>
                <p className="text-gray-800">{formatDateTime(issue.updatedAt)}</p>
                <p className="text-xs text-gray-400">{formatRelativeTime(issue.updatedAt)}</p>
              </div>
            </div>
          </Card>

          {issue.images.length > 0 && (
            <Card>
              <p className="section-title mb-4">
                Evidence Photos ({issue.images.length})
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {issue.images.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative aspect-square rounded-xl overflow-hidden group block bg-gray-100"
                  >
                    <Image
                      src={url}
                      alt={`Evidence ${i + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <ExternalLink
                        size={16}
                        className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                  </a>
                ))}
              </div>
            </Card>
          )}

          {issue.resolvedImageUrl && (
            <Card>
              <p className="section-title mb-4">Resolved Site Photo</p>
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
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <ExternalLink
                    size={18}
                    className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              </a>
            </Card>
          )}
        </div>

        {/* ─── Right Column (Management Panel) ─────────── */}
        <div className="space-y-5">

          {/* Status Actions */}
          <Card>
            <p className="section-title mb-4">Update Status</p>

            {isMasterAdmin && (
              <Alert variant="info" title="Read-only access">
                Master admin can review updates but cannot modify issue status.
              </Alert>
            )}

            {!isMasterAdmin && allowedTransitions.length === 0 ? (
              <Alert variant="success" title="Issue Resolved">
                This issue has been fully resolved. No further status
                changes are available.
              </Alert>
            ) : !isMasterAdmin ? (
              <div className="space-y-4">
                {(allowedTransitions.includes("resolved") || issue.resolvedImageUrl) && (
                  <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center gap-2">
                      <ImageIcon size={15} className="text-primary-600" />
                      <p className="text-sm font-semibold text-gray-900">Resolved Site Image</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      Upload a photo of the fixed site before marking this issue as resolved.
                    </p>

                    {!issue.resolvedImageUrl && (
                      <ImageUploader
                        maxFiles={1}
                        disabled={submitting}
                        onUploadComplete={(urls) => {
                          if (urls[0]) {
                            setResolvedImageUrl(urls[0]);
                            setActionError(null);
                          }
                        }}
                      />
                    )}

                    {(resolvedImageUrl || issue.resolvedImageUrl) && (
                      <a
                        href={resolvedImageUrl ?? issue.resolvedImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative block aspect-video rounded-xl overflow-hidden bg-gray-100 group"
                      >
                        <Image
                          src={resolvedImageUrl ?? issue.resolvedImageUrl ?? ""}
                          alt="Resolved site preview"
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 1024px) 100vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <ExternalLink
                            size={16}
                            className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        </div>
                      </a>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                {allowedTransitions.map((nextStatus) => {
                  const meta = getStatusMeta(nextStatus);
                  const resolveBlocked =
                    nextStatus === "resolved" &&
                    !resolvedImageUrl &&
                    !issue.resolvedImageUrl;
                  return (
                    <button
                      key={nextStatus}
                      onClick={() => handleStatusChange(nextStatus)}
                      disabled={submitting || resolveBlocked}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2
                        border-dashed transition-all duration-200
                        ${meta.bgColor} ${meta.borderColor}
                        hover:border-solid disabled:opacity-50
                        disabled:cursor-not-allowed`}
                    >
                      <span className={`w-3 h-3 rounded-full ${meta.dotColor} shrink-0`} />
                      <div className="text-left flex-1">
                        <p className={`text-sm font-semibold ${meta.color}`}>
                          Mark as {meta.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {resolveBlocked ? "Upload resolved-site photo first." : meta.description}
                        </p>
                      </div>
                      {submitting ? (
                        <RefreshCw size={14} className="animate-spin text-gray-400" />
                      ) : (
                        <CheckCircle2 size={16} className={`${meta.color} opacity-60`} />
                      )}
                    </button>
                  );
                })}
                </div>
              </div>
            ) : null}
          </Card>

        </div>
      </div>
    </div>
  );
}