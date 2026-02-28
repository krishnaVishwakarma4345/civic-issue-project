"use client";

import React, { useEffect, useCallback } from "react";
import { cn }  from "@/lib/utils/cn";
import { X }   from "lucide-react";
import Button  from "./Button";

type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

interface ModalProps {
  isOpen:      boolean;
  onClose:     () => void;
  title?:      string;
  subtitle?:   string;
  children:    React.ReactNode;
  footer?:     React.ReactNode;
  size?:       ModalSize;
  closable?:   boolean;
  className?:  string;
}

const sizeStyles: Record<ModalSize, string> = {
  sm:   "max-w-sm",
  md:   "max-w-md",
  lg:   "max-w-lg",
  xl:   "max-w-2xl",
  full: "max-w-4xl",
};

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size     = "md",
  closable = true,
  className,
}: ModalProps) {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && closable) onClose();
    },
    [onClose, closable]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closable ? onClose : undefined}
      />

      {/* Modal Panel */}
      <div
        className={cn(
          "relative w-full bg-white rounded-2xl shadow-2xl",
          "flex flex-col max-h-[90vh]",
          "animate-in fade-in zoom-in-95 duration-200",
          sizeStyles[size],
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {/* Header */}
        {(title || closable) && (
          <div className="flex items-start justify-between p-6 border-b border-gray-100 shrink-0">
            <div>
              {title && (
                <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
            {closable && (
              <button
                onClick={onClose}
                className="ml-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="p-6 pt-0 border-t border-gray-100 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}