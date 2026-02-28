"use client";

import React from "react";
import { Search, SlidersHorizontal, RotateCcw } from "lucide-react";
import { IssueFilters as IssueFiltersType } from "@/types/issue";
import { CATEGORIES } from "@/lib/constants/categories";
import { PRIORITIES } from "@/lib/constants/priorities";
import { STATUSES   } from "@/lib/constants/statuses";
import Input  from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

interface IssueFiltersProps {
  filters:       IssueFiltersType;
  onFilterChange: (filters: Partial<IssueFiltersType>) => void;
  onReset:        () => void;
  className?:     string;
  showSearch?:    boolean;
}

const ALL_OPTION = { value: "all", label: "All" };

const categoryOptions = [
  ALL_OPTION,
  ...CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
];

const statusOptions = [
  ALL_OPTION,
  ...STATUSES.map((s) => ({ value: s.value, label: s.label })),
];

const priorityOptions = [
  ALL_OPTION,
  ...PRIORITIES.map((p) => ({ value: p.value, label: p.label })),
];

export default function IssueFilters({
  filters,
  onFilterChange,
  onReset,
  className,
  showSearch = true,
}: IssueFiltersProps) {
  const hasActiveFilters =
    (filters.category && filters.category !== "all") ||
    (filters.status   && filters.status   !== "all") ||
    (filters.priority && filters.priority !== "all") ||
    !!filters.search;

  return (
    <div className={className}>
      {/* Filter Bar */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Search */}
        {showSearch && (
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search issues..."
              value={filters.search ?? ""}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              leftIcon={<Search size={16} />}
            />
          </div>
        )}

        {/* Category */}
        <div className="w-44">
          <Select
            options={categoryOptions}
            value={filters.category ?? "all"}
            onChange={(e) =>
              onFilterChange({ category: e.target.value as IssueFiltersType["category"] })
            }
            placeholder="Category"
          />
        </div>

        {/* Status */}
        <div className="w-40">
          <Select
            options={statusOptions}
            value={filters.status ?? "all"}
            onChange={(e) =>
              onFilterChange({ status: e.target.value as IssueFiltersType["status"] })
            }
            placeholder="Status"
          />
        </div>

        {/* Priority */}
        <div className="w-36">
          <Select
            options={priorityOptions}
            value={filters.priority ?? "all"}
            onChange={(e) =>
              onFilterChange({ priority: e.target.value as IssueFiltersType["priority"] })
            }
            placeholder="Priority"
          />
        </div>

        {/* Reset */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="md"
            onClick={onReset}
            leftIcon={<RotateCcw size={14} />}
            className="text-gray-500"
          >
            Reset
          </Button>
        )}
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <SlidersHorizontal size={12} /> Active filters:
          </span>

          {filters.category && filters.category !== "all" && (
            <FilterTag
              label={`Category: ${filters.category}`}
              onRemove={() => onFilterChange({ category: "all" })}
            />
          )}
          {filters.status && filters.status !== "all" && (
            <FilterTag
              label={`Status: ${filters.status}`}
              onRemove={() => onFilterChange({ status: "all" })}
            />
          )}
          {filters.priority && filters.priority !== "all" && (
            <FilterTag
              label={`Priority: ${filters.priority}`}
              onRemove={() => onFilterChange({ priority: "all" })}
            />
          )}
          {filters.search && (
            <FilterTag
              label={`Search: "${filters.search}"`}
              onRemove={() => onFilterChange({ search: "" })}
            />
          )}
        </div>
      )}
    </div>
  );
}

function FilterTag({
  label,
  onRemove,
}: {
  label:    string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200">
      {label}
      <button
        onClick={onRemove}
        className="ml-0.5 hover:text-primary-900 transition-colors"
        aria-label={`Remove filter: ${label}`}
      >
        ×
      </button>
    </span>
  );
}