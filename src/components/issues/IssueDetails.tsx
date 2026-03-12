"use client";

import React                from "react";
import Image                from "next/image";
import Link                 from "next/link";
import {
  MapPin,
  Calendar,
  User,
  Building2,
  MessageSquare,
  RefreshCw,
  ExternalLink,
  ArrowLeft,
  Mic,
} from "lucide-react";
import { Card }             from "@/components/ui/Card";
import IssueStatusBadge     from "./IssueStatusBadge";
import IssuePriorityBadge   from "./IssuePriorityBadge";
import IssueTimeline        from "./IssueTimeline";
import Alert                from "@/components/ui/Alert";
import Button               from "@/components/ui/Button";
import { getCategoryMeta }  from "@/lib/constants/categories";
import { getDepartmentById } from "@/lib/constants/departments";
import {
  formatDateTime,
  formatRelativeTime,
} from "@/lib/utils/formatters";
import { cn }               from "@/lib/utils/cn";
import type { Issue }       from "@/types/issue";

// ─── Props ────────────────────────────────────────────────────

interface IssueDetailsProps {
  issue:           Issue;
  backHref?:       string;
  backLabel?:      string;
  showManagement?: boolean;
  managementSlot?: React.ReactNode;
  className?:      string;
}

// ─── Component ────────────────────────────────────────────────

export default function IssueDetails({
  issue,
  backHref       = "/my-issues",
  backLabel      = "Back",
  showManagement = false,
  managementSlot,
  className,
}: IssueDetailsProps) {
  const category   = getCategoryMeta(issue.category);
  const department = issue.assignedDepartment
    ? getDepartmentById(issue.assignedDepartment)
    : null;

  return (
    <div className={cn("space-y-6", className)}>
      {/* ─── Back Button ─────────────────────────────────── */}
      <Link href={backHref}>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft size={14} />}
        >
          {backLabel}
        </Button>
      </Link>

      <div
        className={cn(
          "grid gap-6",
          showManagement
            ? "grid-cols-1 lg:grid-cols-3"
            : "grid-cols-1"
        )}
      >
        {/* ─── Main Content ─────────────────────────────── */}
        <div
          className={cn(
            "space-y-6",
            showManagement ? "lg:col-span-2" : "max-w-3xl mx-auto w-full"
          )}
        >
          {/* Timeline */}
          <Card>
            <div className="flex items-center justify-between mb-5">
              <p className="section-title">Progress</p>
              <div className="flex items-center gap-2">
                <IssueStatusBadge   status={issue.status} />
                <IssuePriorityBadge priority={issue.priority} />
              </div>
            </div>
            <IssueTimeline currentStatus={issue.status} />
          </Card>

          {/* Issue Info */}
          <Card>
            {/* Category + Title */}
            <div className="flex items-start gap-3 mb-5">
              <div
                className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0",
                  category.bgColor
                )}
              >
                {category.icon}
              </div>
              <div>
                <p
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wide",
                    category.color
                  )}
                >
                  {category.label}
                </p>
                <h2 className="text-lg font-bold text-gray-900 mt-0.5">
                  {issue.title}
                </h2>
              </div>
            </div>

            {/* Description */}
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
              {/* FIX 1: <a> opening tag was stripped by chat renderer */}
              <MetaRow
                icon={<MapPin size={15} />}
                label="Location"
                value={issue.location.address}
                subValue={
                  <a
                    href={`https://maps.google.com/?q=${issue.location.latitude},${issue.location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary-600 hover:underline"
                  >
                    <ExternalLink size={11} />
                    Open in Maps
                  </a>
                }
              />
              <MetaRow
                icon={<Calendar size={15} />}
                label="Reported"
                value={formatDateTime(issue.createdAt)}
                subValue={formatRelativeTime(issue.createdAt)}
              />
              <MetaRow
                icon={<User size={15} />}
                label="Reported By"
                value={issue.citizenName ?? "Citizen"}
                subValue={issue.citizenEmail}
              />
              <MetaRow
                icon={<RefreshCw size={15} />}
                label="Last Updated"
                value={formatDateTime(issue.updatedAt)}
                subValue={formatRelativeTime(issue.updatedAt)}
              />
            </div>
          </Card>

          {/* Authority Response */}
          {(issue.assignedDepartment || issue.adminRemarks) && (
            <Card>
              <p className="section-title mb-4">Authority Response</p>

              {issue.assignedDepartment && (
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Building2 size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Assigned Department</p>
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
                    <p className="text-xs text-gray-500">Admin Remarks</p>
                    <p className="text-sm text-gray-800 leading-relaxed mt-0.5">
                      {issue.adminRemarks}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Images */}
          {issue.images.length > 0 && (
            <Card>
              <p className="section-title mb-4">
                Photos ({issue.images.length})
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* FIX 2: <a> opening tag was stripped by chat renderer */}
                {issue.images.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group block"
                  >
                    <Image
                      src={url}
                      alt={`Issue photo ${i + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <ExternalLink
                        size={16}
                        className="text-white opacity-0 group-hover:opacity-100"
                      />
                    </div>
                  </a>
                ))}
              </div>
            </Card>
          )}

          {/* Issue ID */}
          <p className="text-center text-xs font-mono text-gray-300">
            Issue ID: {issue.id}
          </p>
        </div>

        {/* ─── Management Slot (admin only) ─────────────── */}
        {showManagement && managementSlot && (
          <div className="space-y-5">{managementSlot}</div>
        )}
      </div>
    </div>
  );
}

// ─── Meta Row ─────────────────────────────────────────────────

function MetaRow({
  icon,
  label,
  value,
  subValue,
}: {
  icon:      React.ReactNode;
  label:     string;
  value:     string;
  subValue?: React.ReactNode;
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
          <div className="text-xs text-gray-400 mt-0.5">{subValue}</div>
        )}
      </div>
    </div>
  );
}
