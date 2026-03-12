"use client";

import React from "react";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils/cn";

const ISSUE_CATEGORIES = [
  {
    value: "road",
    label: "Road & Infrastructure",
    icon: "🛣️",
    description: "Potholes, broken roads, damaged pavements, bridges",
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    hoverBg: "hover:bg-orange-100",
    hoverBorder: "hover:border-orange-400",
  },
  {
    value: "water",
    label: "Water Supply",
    icon: "💧",
    description: "Water leaks, supply issues, contamination, pipeline damage",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    hoverBg: "hover:bg-blue-100",
    hoverBorder: "hover:border-blue-400",
  },
  {
    value: "streetlight",
    label: "Street Lighting",
    icon: "💡",
    description: "Broken street lights, dark areas, faulty wiring",
    color: "text-yellow-700",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    hoverBg: "hover:bg-yellow-100",
    hoverBorder: "hover:border-yellow-400",
  },
  {
    value: "garbage",
    label: "Garbage & Waste",
    icon: "🗑️",
    description: "Uncollected garbage, illegal dumping, overflowing bins",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    hoverBg: "hover:bg-red-100",
    hoverBorder: "hover:border-red-400",
  },
] as const;

export default function ReportIssueCategoryPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Report a Civic Issue"
        subtitle="What type of issue would you like to report?"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Report Issue" },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ISSUE_CATEGORIES.map((cat) => (
          <Link
            key={cat.value}
            href={`/report-issue/${cat.value}`}
            className={cn(
              "group relative flex flex-col items-center text-center p-6 rounded-2xl border-2 transition-all duration-200",
              cat.bgColor,
              cat.borderColor,
              cat.hoverBg,
              cat.hoverBorder,
              "focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2"
            )}
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-200">
              {cat.icon}
            </div>
            <h3 className={cn("text-base font-bold mb-1", cat.color)}>
              {cat.label}
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              {cat.description}
            </p>
            <div className="mt-3 px-3 py-1 rounded-full bg-white/70 text-xs font-medium text-gray-600 group-hover:bg-white group-hover:text-primary-700 transition-colors">
              Select →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}