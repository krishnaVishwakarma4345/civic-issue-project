import React from "react";
import { cn } from "@/lib/utils/cn";

type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";

interface SpinnerProps {
  size?:      SpinnerSize;
  color?:     string;
  className?: string;
  label?:     string;
  center?:    boolean;
}

const sizeStyles: Record<SpinnerSize, string> = {
  xs: "w-3 h-3 border",
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-8 h-8 border-2",
  xl: "w-12 h-12 border-4",
};

export default function Spinner({
  size      = "md",
  className,
  label     = "Loading...",
  center    = false,
}: SpinnerProps) {
  const spinner = (
    <div
      role="status"
      aria-label={label}
      className={cn(
        "rounded-full border-gray-200 border-t-primary-600 animate-spin",
        sizeStyles[size],
        className
      )}
    />
  );

  if (center) {
    return (
      <div className="flex items-center justify-center w-full py-12">
        {spinner}
      </div>
    );
  }

  return spinner;
}

// ─── Full-Page Loading Overlay ────────────────────────────────

export function PageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-gray-100 border-t-primary-600 animate-spin" />
        <p className="text-sm font-medium text-gray-600">{message}</p>
      </div>
    </div>
  );
}

// ─── Section Skeleton Loader ──────────────────────────────────

export function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-100 rounded" />
        <div className="h-3 bg-gray-100 rounded w-5/6" />
        <div className="h-3 bg-gray-100 rounded w-4/6" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
      <div className="w-16 h-6 bg-gray-200 rounded-full" />
    </div>
  );
}