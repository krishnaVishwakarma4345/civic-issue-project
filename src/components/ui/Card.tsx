import React from "react";
import { cn } from "@/lib/utils/cn";

interface CardProps {
  children:   React.ReactNode;
  className?: string;
  padding?:   "none" | "sm" | "md" | "lg";
  hover?:     boolean;
  onClick?:   () => void;
}

interface CardHeaderProps {
  title:       string;
  subtitle?:   string;
  action?:     React.ReactNode;
  icon?:       React.ReactNode;
  className?:  string;
}

interface CardSectionProps {
  children:   React.ReactNode;
  className?: string;
}

const paddingStyles = {
  none: "",
  sm:   "p-4",
  md:   "p-6",
  lg:   "p-8",
};

export function Card({
  children,
  className,
  padding  = "md",
  hover    = false,
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-xl border border-gray-100 shadow-card",
        paddingStyles[padding],
        hover && "hover:shadow-md hover:border-gray-200 transition-all duration-200",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
  className,
}: CardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between mb-4", className)}>
      <div className="flex items-start gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h3 className="section-title">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0 ml-4">{action}</div>}
    </div>
  );
}

export function CardSection({ children, className }: CardSectionProps) {
  return (
    <div className={cn("pt-4 mt-4 border-t border-gray-100", className)}>
      {children}
    </div>
  );
}

export function CardGrid({
  children,
  cols = 3,
  className,
}: {
  children:   React.ReactNode;
  cols?:      2 | 3 | 4;
  className?: string;
}) {
  const colStyles = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };
  return (
    <div className={cn("grid gap-4", colStyles[cols], className)}>
      {children}
    </div>
  );
}