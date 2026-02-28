"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline";
type ButtonSize    = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:    ButtonVariant;
  size?:       ButtonSize;
  loading?:    boolean;
  leftIcon?:   React.ReactNode;
  rightIcon?:  React.ReactNode;
  fullWidth?:  boolean;
}

// ─── Styles ───────────────────────────────────────────────────

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-600 hover:bg-primary-700 active:bg-primary-800 " +
    "text-white shadow-sm hover:shadow-md",
  secondary:
    "bg-white hover:bg-gray-50 active:bg-gray-100 " +
    "text-gray-700 border border-gray-300 shadow-sm",
  danger:
    "bg-red-600 hover:bg-red-700 active:bg-red-800 " +
    "text-white shadow-sm hover:shadow-md",
  ghost:
    "bg-transparent hover:bg-gray-100 active:bg-gray-200 " +
    "text-gray-600 hover:text-gray-900",
  outline:
    "bg-transparent hover:bg-primary-50 active:bg-primary-100 " +
    "text-primary-600 border border-primary-600",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm:  "px-3 py-1.5 text-sm  gap-1.5 rounded-md",
  md:  "px-4 py-2   text-sm  gap-2   rounded-lg",
  lg:  "px-6 py-2.5 text-base gap-2  rounded-lg",
};

// ─── Component ────────────────────────────────────────────────

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant   = "primary",
      size      = "md",
      loading   = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center justify-center font-semibold",
          "transition-all duration-200 select-none",
          "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="animate-spin shrink-0" size={size === "sm" ? 14 : 16} />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && (
          <span className="shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;