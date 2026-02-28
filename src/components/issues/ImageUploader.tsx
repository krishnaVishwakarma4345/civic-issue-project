"use client";

import React, { useRef, useCallback } from "react";
import { Upload, X, Image as ImageIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useImageUpload, UploadFile } from "@/hooks/useImageUpload";
import Button from "@/components/ui/Button";

interface ImageUploaderProps {
  onFilesChange:  (files: File[]) => void;
  maxFiles?:      number;
  className?:     string;
  disabled?:      boolean;
}

export default function ImageUploader({
  onFilesChange,
  maxFiles  = 5,
  className,
  disabled  = false,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    uploadFiles,
    error,
    canAddMore,
    remaining,
    addFiles,
    removeFile,
    rawFiles,
  } = useImageUpload({ maxFiles });

  // Notify parent whenever files change
  const handleFilesAdded = useCallback(
    async (newFiles: FileList | File[]) => {
      await addFiles(newFiles);
      onFilesChange(rawFiles);
    },
    [addFiles, onFilesChange, rawFiles]
  );

  // Keep parent in sync on removal
  const handleRemove = useCallback(
    (id: string) => {
      removeFile(id);
      // rawFiles updates after re-render, so filter manually
      setTimeout(() => onFilesChange(rawFiles.filter((_, i) => {
        return uploadFiles[i]?.id !== id;
      })), 0);
    },
    [removeFile, rawFiles, uploadFiles, onFilesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!disabled && e.dataTransfer.files.length > 0) {
        handleFilesAdded(e.dataTransfer.files);
      }
    },
    [disabled, handleFilesAdded]
  );

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  return (
    <div className={cn("w-full", className)}>
      {/* Drop Zone */}
      {canAddMore && !disabled && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative border-2 border-dashed border-gray-300 rounded-xl p-6",
            "flex flex-col items-center justify-center text-center",
            "cursor-pointer hover:border-primary-400 hover:bg-primary-50/50",
            "transition-all duration-200 group",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-primary-100 flex items-center justify-center mb-3 transition-colors">
            <Upload
              size={20}
              className="text-gray-400 group-hover:text-primary-600 transition-colors"
            />
          </div>
          <p className="text-sm font-medium text-gray-700">
            Drop images here or{" "}
            <span className="text-primary-600 underline underline-offset-2">
              browse
            </span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            JPG, PNG, WebP · Max 10 MB each · {remaining} slot
            {remaining !== 1 ? "s" : ""} remaining
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) =>
              e.target.files && handleFilesAdded(e.target.files)
            }
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Preview Grid */}
      {uploadFiles.length > 0 && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {uploadFiles.map((file) => (
            <ImagePreviewItem
              key={file.id}
              file={file}
              onRemove={() => handleRemove(file.id)}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Preview Item ─────────────────────────────────────────────

function ImagePreviewItem({
  file,
  onRemove,
  disabled,
}: {
  file:     UploadFile;
  onRemove: () => void;
  disabled: boolean;
}) {
  return (
    <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-square">
      {/* Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={file.preview}
        alt={file.file.name}
        className="w-full h-full object-cover"
      />

      {/* Overlay with meta */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
        <ImageIcon size={16} className="text-white mb-1" />
        <p className="text-white text-xs font-medium text-center truncate w-full px-1">
          {file.file.name}
        </p>
        <p className="text-white/80 text-xs">{file.size}</p>
      </div>

      {/* Remove Button */}
      {!disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={cn(
            "absolute top-1.5 right-1.5 w-6 h-6 rounded-full",
            "bg-red-500 hover:bg-red-600 text-white",
            "flex items-center justify-center shadow-md",
            "opacity-0 group-hover:opacity-100 transition-all duration-150",
            "focus:opacity-100 focus:outline-none"
          )}
          aria-label="Remove image"
        >
          <X size={12} />
        </button>
      )}

      {/* Progress Bar */}
      {file.progress > 0 && file.progress < 100 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
          <div
            className="h-full bg-primary-500 transition-all duration-200"
            style={{ width: `${file.progress}%` }}
          />
        </div>
      )}

      {/* Error Overlay */}
      {file.error && (
        <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center p-2">
          <p className="text-white text-xs text-center">{file.error}</p>
        </div>
      )}
    </div>
  );
}