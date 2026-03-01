"use client";

import React, { useState, useCallback } from "react";
import {
  CheckCircle2,
  Building2,
  MessageSquare,
  RefreshCw,
  Save,
  ChevronDown,
} from "lucide-react";
import { useForm }           from "react-hook-form";
import { zodResolver }       from "@hookform/resolvers/zod";
import { Card }              from "@/components/ui/Card";
import Button                from "@/components/ui/Button";
import Select                from "@/components/ui/Select";
import Textarea              from "@/components/ui/Textarea";
import Alert                 from "@/components/ui/Alert";
import IssueStatusBadge      from "@/components/issues/IssueStatusBadge";
import { DEPARTMENTS }       from "@/lib/constants/departments";
import {
  STATUS_TRANSITIONS,
  getStatusMeta,
}                            from "@/lib/constants/statuses";
import {
  updateIssueSchema,
  type UpdateIssueFormData,
}                            from "@/lib/utils/validators";
import { cn }                from "@/lib/utils/cn";
import type { Issue, IssueStatus } from "@/types/issue";

// ─── Props ────────────────────────────────────────────────────

interface IssueManagementPanelProps {
  issue:              Issue;
  onStatusChange:     (status: IssueStatus) => Promise<boolean>;
  onSaveDetails:      (data: UpdateIssueFormData) => Promise<boolean>;
  loading?:           boolean;
  className?:         string;
}

const DEPT_OPTIONS = DEPARTMENTS.map((d) => ({
  value: d.id,
  label: d.name,
}));

// ─── Component ────────────────────────────────────────────────

export default function IssueManagementPanel({
  issue,
  onStatusChange,
  onSaveDetails,
  loading   = false,
  className,
}: IssueManagementPanelProps) {
  const [success, setSuccess] = useState<string | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<UpdateIssueFormData>({
    resolver:      zodResolver(updateIssueSchema),
    defaultValues: {
      assignedDepartment: issue.assignedDepartment ?? "",
      adminRemarks:       issue.adminRemarks       ?? "",
    },
  });

  const allowedTransitions = STATUS_TRANSITIONS[issue.status];

  // ─── Handle status change ─────────────────────────────────

  const handleStatusClick = useCallback(
    async (newStatus: IssueStatus) => {
      setSuccess(null);
      setError(null);
      const ok = await onStatusChange(newStatus);
      if (ok) {
        setSuccess(`Status updated to "${getStatusMeta(newStatus).label}"`);
      } else {
        setError("Status update failed. Please try again.");
      }
    },
    [onStatusChange]
  );

  // ─── Handle form save ─────────────────────────────────────

  const onSubmit = useCallback(
    async (data: UpdateIssueFormData) => {
      setSuccess(null);
      setError(null);
      const ok = await onSaveDetails(data);
      if (ok) {
        setSuccess("Changes saved successfully.");
      } else {
        setError("Save failed. Please try again.");
      }
    },
    [onSaveDetails]
  );

  return (
    <div className={cn("space-y-5", className)}>
      {/* Feedback */}
      {success && (
        <Alert
          variant="success"
          onDismiss={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}
      {error && (
        <Alert
          variant="error"
          onDismiss={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* ─── Current Status ──────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <p className="section-title">Current Status</p>
          <IssueStatusBadge status={issue.status} />
        </div>

        {/* Status Transition Buttons */}
        {allowedTransitions.length === 0 ? (
          <Alert variant="success" title="Fully Resolved">
            No further status changes are available.
          </Alert>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 mb-3">
              Move issue to:
            </p>
            {allowedTransitions.map((nextStatus) => {
              const meta = getStatusMeta(nextStatus);
              return (
                <button
                  key={nextStatus}
                  type="button"
                  onClick={() => handleStatusClick(nextStatus)}
                  disabled={loading}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl",
                    "border-2 border-dashed hover:border-solid",
                    "transition-all duration-200 text-left",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    meta.bgColor,
                    meta.borderColor
                  )}
                >
                  <span
                    className={cn(
                      "w-3 h-3 rounded-full shrink-0",
                      meta.dotColor
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-semibold", meta.color)}>
                      Mark as {meta.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {meta.description}
                    </p>
                  </div>
                  {loading ? (
                    <RefreshCw
                      size={14}
                      className="animate-spin text-gray-400 shrink-0"
                    />
                  ) : (
                    <CheckCircle2
                      size={16}
                      className={cn(meta.color, "opacity-50 shrink-0")}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* ─── Assign & Remark Form ────────────────────────── */}
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
            placeholder="Add remarks for the citizen or internal notes..."
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
            loading={loading}
            leftIcon={<Save size={15} />}
            disabled={!isDirty}
          >
            Save Changes
          </Button>
        </form>
      </Card>

      {/* ─── Current Assignment Summary ──────────────────── */}
      {(issue.assignedDepartment || issue.adminRemarks) && (
        <Card>
          <p className="section-title mb-3">Saved Assignment</p>
          {issue.assignedDepartment && (
            <div className="flex items-center gap-2 mb-3">
              <Building2 size={14} className="text-blue-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-500">Department</p>
                <p className="text-sm font-medium text-gray-800 truncate">
                  {DEPARTMENTS.find(
                    (d) => d.id === issue.assignedDepartment
                  )?.name ?? issue.assignedDepartment}
                </p>
              </div>
            </div>
          )}
          {issue.adminRemarks && (
            <div className="flex items-start gap-2">
              <MessageSquare size={14} className="text-purple-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
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
  );
}