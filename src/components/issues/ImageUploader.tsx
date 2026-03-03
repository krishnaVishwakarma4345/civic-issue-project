"use client";

import React, { useRef, useCallback }  from "react";
import {
  Upload,
  X,
  Image     as ImageIcon,
  Camera,
  FolderOpen,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { cn }                           from "@/lib/utils/cn";
import { useImageUpload, UploadFile }   from "@/hooks/useImageUpload";

interface ImageUploaderProps {
  /** Called every time a batch of files finishes uploading — receives the NEW urls from this batch */
  onUploadComplete: (urls: string[]) => void;
  maxFiles?:        number;
  className?:       string;
  disabled?:        boolean;
}

export default function ImageUploader({
  onUploadComplete,
  maxFiles  = 5,
  className,
  disabled  = false,
}: ImageUploaderProps) {
  // Two separate hidden inputs — one for gallery (multiple), one for camera
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef  = useRef<HTMLInputElement>(null);

  const {
    uploadFiles,
    uploading,
    error,
    canAddMore,
    remaining,
    addFiles,
    removeFile,
  } = useImageUpload({ maxFiles });

  // ─── Shared handler ───────────────────────────────────────
  const handleFilesAdded = useCallback(
    async (newFiles: FileList | File[]) => {
      if (!newFiles || newFiles.length === 0) return;
      const urls = await addFiles(newFiles);
      if (urls.length > 0) {
        onUploadComplete(urls);
      }
    },
    [addFiles, onUploadComplete]
  );

  // ─── Drag and drop ────────────────────────────────────────
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

  const hasFiles = uploadFiles.length > 0;

  return (
    <div className={cn("w-full space-y-3", className)}>

      {/* ── Source Buttons ──────────────────────────────────── */}
      {canAddMore && !disabled && (
        <div className="space-y-2">
          {/* Button row: Camera + Gallery */}
          <div className="grid grid-cols-2 gap-2">
            {/* Camera button */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
                "border-2 border-dashed border-primary-200 bg-primary-50/40",
                "text-sm font-medium text-primary-700",
                "hover:bg-primary-50 hover:border-primary-400 transition-all",
                "focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-1"
              )}
            >
              <Camera size={17} />
              Take Photo
            </button>

            {/* Gallery button */}
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
                "border-2 border-dashed border-gray-200 bg-gray-50",
                "text-sm font-medium text-gray-600",
                "hover:bg-gray-100 hover:border-gray-400 transition-all",
                "focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1"
              )}
            >
              <FolderOpen size={17} />
              Choose from Gallery
            </button>
          </div>

          {/* Drag-and-drop zone (desktop) */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => galleryInputRef.current?.click()}
            className={cn(
              "hidden sm:flex flex-col items-center justify-center",
              "border border-dashed border-gray-200 rounded-xl py-4 px-3 text-center",
              "cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-all group"
            )}
          >
            <Upload size={16} className="text-gray-300 group-hover:text-primary-400 mb-1 transition-colors" />
            <p className="text-xs text-gray-400 group-hover:text-primary-500 transition-colors">
              or drag & drop images here
            </p>
          </div>

          <p className="text-xs text-gray-400 text-center">
            JPG, PNG, WebP · Max 10 MB each ·{" "}
            <span className="font-medium text-gray-500">
              {remaining} slot{remaining !== 1 ? "s" : ""} remaining
            </span>
          </p>
        </div>
      )}

      {/* Hidden inputs */}
      {/* Camera — opens device camera directly on mobile */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"        // rear camera; use "user" for selfie
        className="hidden"
        onChange={(e) => e.target.files && handleFilesAdded(e.target.files)}
      />
      {/* Gallery — allows multiple picks */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFilesAdded(e.target.files);
          // Reset so same file can be picked again if removed
          e.target.value = "";
        }}
      />

      {/* ── Global error ─────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Uploading indicator ───────────────────────────────── */}
      {uploading && (
        <div className="flex items-center gap-2 text-sm text-primary-600 bg-primary-50 border border-primary-100 rounded-lg px-3 py-2">
          <Loader2 size={14} className="animate-spin shrink-0" />
          <span>Uploading photos...</span>
        </div>
      )}

      {/* ── Preview grid ──────────────────────────────────────── */}
      {hasFiles && (
        <div className="grid grid-cols-3 gap-2">
          {uploadFiles.map((file) => (
            <PreviewItem
              key={file.id}
              file={file}
              onRemove={() => removeFile(file.id)}
              disabled={disabled || uploading}
            />
          ))}
        </div>
      )}

      {/* ── Max reached notice ───────────────────────────────── */}
      {!canAddMore && !disabled && (
        <p className="text-xs text-center text-gray-400">
          Maximum {maxFiles} images attached.
        </p>
      )}
    </div>
  );
}

// ─── Preview Item ─────────────────────────────────────────────

function PreviewItem({
  file,
  onRemove,
  disabled,
}: {
  file:     UploadFile;
  onRemove: () => void;
  disabled: boolean;
}) {
  const isUploading = file.progress > 0  && file.progress < 100 && !file.error;
  const isDone      = file.progress === 100 && !file.error;
  const hasError    = !!file.error;

  return (
    <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-square">
      {/* Preview image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={file.preview}
        alt={file.file.name}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-200",
          (isUploading || hasError) && "opacity-60"
        )}
      />

      {/* Uploading overlay — progress bar + spinner */}
      {isUploading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 p-2">
          <Loader2 size={18} className="text-white animate-spin mb-1.5" />
          <span className="text-white text-xs font-semibold">{file.progress}%</span>
          {/* Progress bar at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
            <div
              className="h-full bg-primary-400 transition-all duration-200"
              style={{ width: `${file.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Done badge */}
      {isDone && (
        <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow">
          <CheckCircle2 size={11} className="text-white" />
        </div>
      )}

      {/* Error overlay */}
      {hasError && (
        <div className="absolute inset-0 bg-red-500/80 flex flex-col items-center justify-center p-2">
          <AlertCircle size={16} className="text-white mb-1" />
          <p className="text-white text-xs text-center leading-tight">{file.error}</p>
        </div>
      )}

      {/* Hover info overlay */}
      {!isUploading && !hasError && (
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-end justify-start p-1">
          <span className="text-white/80 text-[10px] mt-auto">{file.size}</span>
        </div>
      )}

      {/* Remove button */}
      {!disabled && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className={cn(
            "absolute top-1.5 right-1.5 w-5 h-5 rounded-full",
            "bg-red-500 hover:bg-red-600 text-white shadow",
            "flex items-center justify-center",
            "opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity",
            "focus:outline-none"
          )}
          aria-label="Remove image"
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
}