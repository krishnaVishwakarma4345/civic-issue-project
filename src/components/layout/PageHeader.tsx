import React    from "react";
import Link     from "next/link";
import { ChevronRight } from "lucide-react";
import { cn }   from "@/lib/utils/cn";

// ─── Types ────────────────────────────────────────────────────

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title:        string;
  subtitle?:    string;
  breadcrumbs?: Breadcrumb[];
  actions?:     React.ReactNode;
  icon?:        React.ReactNode;
  className?:   string;
}

// ─── Component ────────────────────────────────────────────────

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  icon,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1 text-xs text-gray-500 mb-2"
        >
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <ChevronRight size={12} className="text-gray-300 shrink-0" />
              )}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-primary-600 transition-colors truncate max-w-[160px]"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-gray-700 font-medium truncate max-w-[160px]">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Title Row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          {/* Icon */}
          {icon && (
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 shrink-0 mt-0.5">
              {icon}
            </div>
          )}

          {/* Text */}
          <div className="min-w-0">
            <h1 className="page-title truncate">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        {actions && (
          <div className="shrink-0 flex items-center gap-2 mt-1">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}