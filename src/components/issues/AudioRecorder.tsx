"use client";

import React, { useRef, useCallback, useState } from "react";
import { Mic, Square, Pause, Play, Trash2, Upload, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";

interface AudioRecorderProps {
  onUploadComplete: (audioUrl: string) => void;
  disabled?: boolean;
  className?: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioRecorder({
  onUploadComplete,
  disabled = false,
  className,
}: AudioRecorderProps) {
  const {
    isRecording,
    isPaused,
    duration,
    recording,
    error: recorderError,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
  } = useAudioRecorder();

  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const MAX_DURATION = 120; // 2 minutes

  // Auto-stop at max duration
  React.useEffect(() => {
    if (isRecording && !isPaused && duration >= MAX_DURATION) {
      stopRecording();
    }
  }, [isRecording, isPaused, duration, stopRecording, MAX_DURATION]);

  const handleUpload = useCallback(async () => {
    if (!recording) return;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";

    if (!cloudName || !uploadPreset) {
      setUploadError("Cloudinary is not configured.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", recording.blob, "audio-description.webm");
      formData.append("upload_preset", uploadPreset);
      formData.append("folder", "civic_issues_audio");
      formData.append("resource_type", "video"); // Cloudinary uses "video" for audio

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
        { method: "POST", body: formData }
      );

      if (!res.ok) throw new Error(`Upload failed (${res.status})`);

      const data = await res.json();
      const secureUrl: string = data.secure_url;
      setUploaded(true);
      onUploadComplete(secureUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Audio upload failed.");
    } finally {
      setUploading(false);
    }
  }, [recording, onUploadComplete]);

  const handleClear = useCallback(() => {
    clearRecording();
    setUploaded(false);
    setUploadError(null);
  }, [clearRecording]);

  const error = recorderError || uploadError;

  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* ── Recording Controls ─────────────────────────────── */}
      {!recording && !uploaded && (
        <div className="space-y-2">
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              disabled={disabled}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
                "border-2 border-dashed border-red-200 bg-red-50/40",
                "text-sm font-medium text-red-600",
                "hover:bg-red-50 hover:border-red-400 transition-all",
                "focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <Mic size={17} />
              Record Audio Description
            </button>
          ) : (
            <div className="p-4 rounded-xl border-2 border-red-300 bg-red-50 space-y-3">
              {/* Recording indicator */}
              <div className="flex items-center justify-center gap-3">
                <span className="relative flex h-3 w-3">
                  {!isPaused && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  )}
                  <span className={cn(
                    "relative inline-flex rounded-full h-3 w-3",
                    isPaused ? "bg-yellow-500" : "bg-red-500"
                  )} />
                </span>
                <span className="text-sm font-semibold text-gray-800">
                  {isPaused ? "Paused" : "Recording..."}
                </span>
                <span className="text-lg font-mono font-bold text-red-600">
                  {formatTime(duration)}
                </span>
                <span className="text-xs text-gray-400">/ {formatTime(MAX_DURATION)}</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-red-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-200"
                  style={{ width: `${Math.min((duration / MAX_DURATION) * 100, 100)}%` }}
                />
              </div>

              {/* Control buttons */}
              <div className="flex items-center justify-center gap-3">
                {!isPaused ? (
                  <button
                    type="button"
                    onClick={pauseRecording}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-100 text-yellow-700 text-sm font-medium hover:bg-yellow-200 transition-colors"
                  >
                    <Pause size={14} />
                    Pause
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={resumeRecording}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-sm font-medium hover:bg-green-200 transition-colors"
                  >
                    <Play size={14} />
                    Resume
                  </button>
                )}
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  <Square size={14} />
                  Stop
                </button>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400 text-center">
            Max {MAX_DURATION / 60} minutes · Tap to start recording your audio description
          </p>
        </div>
      )}

      {/* ── Playback & Upload ──────────────────────────────── */}
      {recording && !uploaded && (
        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Mic size={15} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Audio Recorded ({formatTime(recording.duration)})
            </span>
          </div>

          <audio
            ref={audioRef}
            src={recording.url}
            controls
            className="w-full h-10"
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg",
                "bg-primary-600 text-white text-sm font-medium",
                "hover:bg-primary-700 transition-colors",
                uploading && "opacity-70 cursor-not-allowed"
              )}
            >
              {uploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={14} />
                  Upload Audio
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              <Trash2 size={14} />
              Discard
            </button>
          </div>
        </div>
      )}

      {/* ── Uploaded State ─────────────────────────────────── */}
      {uploaded && (
        <div className="p-3 rounded-xl border border-green-200 bg-green-50 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Audio description uploaded ({formatTime(recording?.duration ?? 0)})
            </span>
          </div>
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="text-xs text-red-500 hover:text-red-700 hover:underline transition-colors"
          >
            Remove & re-record
          </button>
        </div>
      )}

      {/* ── Error ──────────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
