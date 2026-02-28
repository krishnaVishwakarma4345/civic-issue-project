"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?:    string;
  error?:    string;
  hint?:     string;
  required?: boolean;
  showCount?: boolean;
  maxLength?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      required,
      showCount = false,
      maxLength,
      className,
      id,
      value,
      ...props
    },
    ref
  ) => {
    const inputId   = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    const charCount = typeof value === "string" ? value.length : 0;

    return (
      <div className="w-full">
        {label && (
          <div className="flex items-center justify-between mb-1">
            <label htmlFor={inputId} className="label mb-0">
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {showCount && maxLength && (
              <span
                className={cn(
                  "text-xs",
                  charCount > maxLength * 0.9
                    ? "text-red-500"
                    : "text-gray-400"
                )}
              >
                {charCount}/{maxLength}
              </span>
            )}
          </div>
        )}

        <textarea
          ref={ref}
          id={inputId}
          value={value}
          maxLength={maxLength}
          className={cn(
            "input-field resize-none min-h-[100px]",
            error &&
              "border-red-400 focus:ring-red-400 bg-red-50",
            className
          )}
          aria-invalid={!!error}
          {...props}
        />

        {error && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        )}
        {hint && !error && (
          <p className="mt-1 text-sm text-gray-500">{hint}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
export default Textarea;