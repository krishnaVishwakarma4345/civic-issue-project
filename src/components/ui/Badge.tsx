import React from "react";
import { cn } from "@/lib/utils/cn";

type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "outline";

type BadgeSize = "sm" | "md";

interface BadgeProps {
  children:  React.ReactNode;
  variant?:  BadgeVariant;
  size?:     BadgeSize;
  dot?:      boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-100   text-gray-700  border-gray-200",
  primary: "bg-primary-100 text-primary-700 border-primary-200",
  success: "bg-green-100  text-green-700  border-green-200",
  warning: "bg-yellow-100 text-yellow-700 border-yellow-200",
  danger:  "bg-red-100    text-red-700    border-red-200",
  info:    "bg-blue-100   text-blue-700   border-blue-200",
  outline: "bg-transparent text-gray-700  border-gray-300",
};

const dotVariantColors: Record<BadgeVariant, string> = {
  default: "bg-gray-500",
  primary: "bg-primary-600",
  success: "bg-green-600",
  warning: "bg-yellow-500",
  danger:  "bg-red-600",
  info:    "bg-blue-600",
  outline: "bg-gray-500",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
};

export default function Badge({
  children,
  variant  = "default",
  size     = "md",
  dot      = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium",
        "rounded-full border",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            dotVariantColors[variant]
          )}
        />
      )}
      {children}
    </span>
  );
}