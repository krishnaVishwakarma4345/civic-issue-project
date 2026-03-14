"use client";

import React, { useRef, useCallback, useEffect, useState }  from "react";
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
  const videoRef        = useRef<HTMLVideoElement>(null);
  const streamRef       = useRef<MediaStream | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);

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

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const closeCamera = useCallback(() => {
    stopCameraStream();
    setCameraOpen(false);
    setCameraBusy(false);
  }, [stopCameraStream]);

  const openCamera = useCallback(async () => {
    if (disabled || uploading || !canAddMore) return;

    // Mobile browsers usually honor capture attr and open camera directly.
    const isMobileDevice =
      typeof navigator !== "undefined" &&
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

    if (isMobileDevice) {
      cameraInputRef.current?.click();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      cameraInputRef.current?.click();
      return;
    }

    try {
      setCameraBusy(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      // Permission denied or camera unavailable — fallback to file input.
      cameraInputRef.current?.click();
    } finally {
      setCameraBusy(false);
    }
  }, [canAddMore, disabled, uploading]);

  const capturePhoto = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !streamRef.current) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        const file = new File([blob], `camera-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        await handleFilesAdded([file]);
        closeCamera();
      },
      "image/jpeg",
      0.9
    );
  }, [closeCamera, handleFilesAdded]);

  useEffect(() => {
    if (!cameraOpen || !videoRef.current || !streamRef.current) return;

    const video = videoRef.current;
    video.srcObject = streamRef.current;
    void video.play().catch(() => {
      closeCamera();
    });
  }, [cameraOpen, closeCamera]);

  useEffect(() => {
    return () => stopCameraStream();
  }, [stopCameraStream]);

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
              onClick={openCamera}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
                "border-2 border-dashed border-primary-200 bg-primary-50/40",
                "text-sm font-medium text-primary-700",
                "hover:bg-primary-50 hover:border-primary-400 transition-all",
                "focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-1"
              )}
              disabled={cameraBusy}
            >
              {cameraBusy ? <Loader2 size={17} className="animate-spin" /> : <Camera size={17} />}
              {cameraBusy ? "Opening Camera..." : "Take Photo"}
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

      {/* Desktop Camera Modal */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Take Photo</p>
              <button
                type="button"
                onClick={closeCamera}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close camera"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4">
              <div className="rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeCamera}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700"
                >
                  Capture
                </button>
              </div>
            </div>
          </div>
        </div>
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