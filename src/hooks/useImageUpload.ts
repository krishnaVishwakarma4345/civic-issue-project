"use client";

import { useState, useCallback } from "react";
import {
  validateImageFile,
  fileToDataURL,
  formatFileSize,
} from "@/lib/utils/imageCompression";

export interface UploadFile {
  id:       string;
  file:     File;
  preview:  string;
  size:     string;
  progress: number;
  error?:   string;
}

interface UseImageUploadOptions {
  maxFiles?:  number;
  maxSizeMB?: number;
}

export const useImageUpload = (options: UseImageUploadOptions = {}) => {
  const { maxFiles = 5, maxSizeMB = 10 } = options;
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [error,       setError]       = useState<string | null>(null);

  // ─── Add files ────────────────────────────────────────────

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      const fileArray = Array.from(files);

      // Check max files limit
      const remaining = maxFiles - uploadFiles.length;
      if (remaining <= 0) {
        setError(`Maximum ${maxFiles} images allowed.`);
        return;
      }

      const toAdd = fileArray.slice(0, remaining);
      const results: UploadFile[] = [];

      for (const file of toAdd) {
        const validation = validateImageFile(file, maxSizeMB);
        if (!validation.valid) {
          setError(validation.error ?? "Invalid file");
          continue;
        }

        try {
          const preview = await fileToDataURL(file);
          results.push({
            id:       crypto.randomUUID(),
            file,
            preview,
            size:     formatFileSize(file.size),
            progress: 0,
          });
        } catch {
          setError(`Failed to preview ${file.name}`);
        }
      }

      setUploadFiles((prev) => [...prev, ...results]);
    },
    [uploadFiles.length, maxFiles, maxSizeMB]
  );

  // ─── Remove file ──────────────────────────────────────────

  const removeFile = useCallback((id: string) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== id));
    setError(null);
  }, []);

  // ─── Update progress for a specific file ─────────────────

  const updateProgress = useCallback((id: string, progress: number) => {
    setUploadFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, progress } : f))
    );
  }, []);

  // ─── Mark file as errored ─────────────────────────────────

  const setFileError = useCallback((id: string, error: string) => {
    setUploadFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, error } : f))
    );
  }, []);

  const clearFiles = useCallback(() => {
    setUploadFiles([]);
    setError(null);
  }, []);

  return {
    uploadFiles,
    error,
    canAddMore: uploadFiles.length < maxFiles,
    remaining:  maxFiles - uploadFiles.length,
    addFiles,
    removeFile,
    updateProgress,
    setFileError,
    clearFiles,
    rawFiles: uploadFiles.map((f) => f.file),
  };
};