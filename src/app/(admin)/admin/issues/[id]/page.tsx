"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter }                    from "next/navigation";
import Image                                       from "next/image";
import { useForm }                                 from "react-hook-form";
import { zodResolver }                             from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Building2,
  MessageSquare,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Save,
  Mic,
} from "lucide-react";
import { subscribeToIssue }    from "@/lib/firebase/firestore";
import { useAdminIssues }      from "@/hooks/useAdminIssues";
import PageHeader              from "@/components/layout/PageHeader";
import { Card }                from "@/components/ui/Card";
import Button                  from "@/components/ui/Button";
import Select                  from "@/components/ui/Select";
import Textarea                from "@/components/ui/Textarea";
import Alert                   from "@/components/ui/Alert";
import IssueStatusBadge        from "@/components/issues/IssueStatusBadge";
import IssuePriorityBadge      from "@/components/issues/IssuePriorityBadge";
import IssueTimeline           from "@/components/issues/IssueTimeline";
import { SkeletonCard }        from "@/components/ui/Spinner";
import { getCategoryMeta }     from "@/lib/constants/categories";
import { DEPARTMENTS }         from "@/lib/constants/departments";
import { STATUS_TRANSITIONS,
         getStatusMeta }       from "@/lib/constants/statuses";
import { formatDateTime,
         formatRelativeTime }  from "@/lib/utils/formatters";
import {
  updateIssueSchema,
  type UpdateIssueFormData,
} from "@/lib/utils/validators";
import type { Issue, IssueStatus } from "@/types/issue";

// ─── Department Options ───────────────────────────────────────

const DEPT_OPTIONS = DEPARTMENTS.map((d) => ({
  value: d.id,
  label: d.name,
}));

// ─── Page ─────────────────────────────────────────────────────

export default function AdminIssueDetailPage() {
  const { id }     = useParams<{ id: string }>();
  const router     = useRouter();
  const { updateIssueStatus, submitting } = useAdminIssues();

  const [issue,       setIssue]       = useState<Issue | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<UpdateIssueFormData>({
    resolver: zodResolver(updateIssueSchema),
  });

  // ─── Real-time Subscription ───────────────────────────────

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const unsubscribe = subscribeToIssue(id, (updated) => {
      if (!updated) {
        setError("Issue not found.");
      } else {
        setIssue(updated);
        // Pre-fill form
        setValue("assignedDepartment", updated.assignedDepartment ?? "");
        setValue("adminRemarks",       updated.adminRemarks       ?? "");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, setValue]);

  // ─── Submit Update ────────────────────────────────────────

  const onSubmit = useCallback(
    async (data: UpdateIssueFormData) => {
      if (!issue) return;
      setSaveSuccess(false);

      const success = await updateIssueStatus({
        id:                 issue.id,
        ...(data.assignedDepartment && {
          assignedDepartment: data.assignedDepartment,
        }),
        ...(data.adminRemarks && { adminRemarks: data.adminRemarks }),
      });

      if (success) setSaveSuccess(true);
    },
    [issue, updateIssueStatus]
  );

  // ─── Status Transition ────────────────────────────────────

  const handleStatusChange = useCallback(
    async (newStatus: IssueStatus) => {
      if (!issue) return;
      setSaveSuccess(false);

      const success = await updateIssueStatus({
        id:     issue.id,
        status: newStatus,
      });

      if (success) setSaveSuccess(true);
    },
    [issue, updateIssueStatus]
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
              </div>
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
        </div>

        {/* ─── Right Column (Management Panel) ─────────── */}
        <div className="space-y-5">

          {/* Status Actions */}
          <Card>
            <p className="section-title mb-4">Update Status</p>

            {allowedTransitions.length === 0 ? (
              <Alert variant="success" title="Issue Resolved">
                This issue has been fully resolved. No further status
                changes are available.
              </Alert>
            ) : (
              <div className="space-y-2">
                {allowedTransitions.map((nextStatus) => {
                  const meta = getStatusMeta(nextStatus);
                  return (
                    <button
                      key={nextStatus}
                      onClick={() => handleStatusChange(nextStatus)}
                      disabled={submitting}
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
                          {meta.description}
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
            )}
          </Card>

          {/* Department & Remarks Form */}
          <Card>
            <p className="section-title mb-4">Assign & Remark</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Select
                label="Assign Department"
                options={DEPT_OPTIONS}
                placeholder="Select department"
                error={errors.assignedDepartment?.message}
                {...register("assignedDepartment")}
              />

              <Textarea
                label="Admin Remarks"
                placeholder="Add internal notes or public remarks for this issue..."
                rows={4}
                showCount
                maxLength={500}
                value={watch("adminRemarks") ?? ""}
                error={errors.adminRemarks?.message}
                {...register("adminRemarks")}
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={submitting}
                leftIcon={<Save size={15} />}
                disabled={!isDirty && !submitting}
              >
                Save Changes
              </Button>
            </form>
          </Card>

          {/* Current Assignment */}
          {(issue.assignedDepartment || issue.adminRemarks) && (
            <Card>
              <p className="section-title mb-3">Current Assignment</p>
              {issue.assignedDepartment && (
                <div className="flex items-center gap-2 mb-3">
                  <Building2 size={15} className="text-blue-500 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Department</p>
                    <p className="text-sm font-medium text-gray-800">
                      {DEPARTMENTS.find(
                        (d) => d.id === issue.assignedDepartment
                      )?.name ?? issue.assignedDepartment}
                    </p>
                  </div>
                </div>
              )}
              {issue.adminRemarks && (
                <div className="flex items-start gap-2">
                  <MessageSquare size={15} className="text-purple-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Remarks</p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {issue.adminRemarks}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}