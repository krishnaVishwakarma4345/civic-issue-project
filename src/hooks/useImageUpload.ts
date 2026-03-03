"use client";

import { useState, useCallback } from "react";
import {
  validateImageFile,
  fileToDataURL,
  formatFileSize,
} from "@/lib/utils/imageCompression";

export interface UploadFile {
  id:        string;
  file:      File;
  preview:   string;
  size:      string;
  progress:  number;  // 0-100; 100 = upload complete
  url?:      string;  // Cloudinary secure_url once uploaded
  error?:    string;
}

interface UseImageUploadOptions {
  maxFiles?:  number;
  maxSizeMB?: number;
}

// ─── Cloudinary Upload ────────────────────────────────────────
// Uploads a single file to Cloudinary using an unsigned preset.
// Uses XMLHttpRequest so we can track upload progress per file.

function uploadFileToCloudinary(
  file:        File,
  cloudName:   string,
  uploadPreset: string,
  onProgress:  (pct: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url  = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
    const form = new FormData();
    form.append("file",           file);
    form.append("upload_preset",  uploadPreset);
    // Store under a folder so your Cloudinary media library stays tidy
    form.append("folder",         "civic_issues");

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 95)); // cap at 95 until response
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as { secure_url: string };
          onProgress(100);
          resolve(data.secure_url);
        } catch {
          reject(new Error("Invalid response from Cloudinary."));
        }
      } else {
        reject(new Error(`Upload failed (${xhr.status}).`));
      }
    });

    xhr.addEventListener("error",  () => reject(new Error("Network error during upload.")));
    xhr.addEventListener("abort",  () => reject(new Error("Upload cancelled.")));

    xhr.open("POST", url);
    xhr.send(form);
  });
}

// ─── Hook ─────────────────────────────────────────────────────

export const useImageUpload = (options: UseImageUploadOptions = {}) => {
  const { maxFiles = 5, maxSizeMB = 10 } = options;

  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [error,       setError]       = useState<string | null>(null);
  const [uploading,   setUploading]   = useState(false);

  // ─── Helpers ──────────────────────────────────────────────

  const updateProgress = useCallback((id: string, progress: number) => {
    setUploadFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, progress } : f))
    );
  }, []);

  const setFileError = useCallback((id: string, err: string) => {
    setUploadFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, error: err } : f))
    );
  }, []);

  const setFileUrl = useCallback((id: string, url: string) => {
    setUploadFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, url, progress: 100 } : f))
    );
  }, []);

  // ─── Add files + upload to Cloudinary ─────────────────────

  const addFiles = useCallback(
    async (files: FileList | File[]): Promise<string[]> => {
      setError(null);

      const cloudName    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME    ?? "";
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";

      if (!cloudName || !uploadPreset) {
        setError("Cloudinary is not configured. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET to .env.local");
        return [];
      }

      const fileArray = Array.from(files);
      const remaining = maxFiles - uploadFiles.length;

      if (remaining <= 0) {
        setError(`Maximum ${maxFiles} images allowed.`);
        return [];
      }

      const toAdd = fileArray.slice(0, remaining);

      // 1. Validate + generate previews, add to state immediately so user sees them
      const newEntries: UploadFile[] = [];
      for (const file of toAdd) {
        const validation = validateImageFile(file, maxSizeMB);
        if (!validation.valid) {
          setError(validation.error ?? "Invalid file.");
          continue;
        }
        try {
          const preview = await fileToDataURL(file);
          newEntries.push({
            id:       crypto.randomUUID(),
            file,
            preview,
            size:     formatFileSize(file.size),
            progress: 0,
          });
        } catch {
          setError(`Failed to preview ${file.name}.`);
        }
      }

      if (newEntries.length === 0) return [];

      setUploadFiles((prev) => [...prev, ...newEntries]);
      setUploading(true);

      // 2. Upload all files in parallel, track per-file progress
      const uploadedUrls: string[] = [];

      await Promise.all(
        newEntries.map(async (entry) => {
          try {
            const url = await uploadFileToCloudinary(
              entry.file,
              cloudName,
              uploadPreset,
              (pct) => updateProgress(entry.id, pct)
            );
            setFileUrl(entry.id, url);
            uploadedUrls.push(url);
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Upload failed.";
            setFileError(entry.id, msg);
          }
        })
      );

      setUploading(false);
      return uploadedUrls;
    },
    [uploadFiles.length, maxFiles, maxSizeMB, updateProgress, setFileUrl, setFileError]
  );

  // ─── Remove file ──────────────────────────────────────────

  const removeFile = useCallback((id: string) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== id));
    setError(null);
  }, []);

  const clearFiles = useCallback(() => {
    setUploadFiles([]);
    setError(null);
  }, []);

  return {
    uploadFiles,
    error,
    uploading,
    canAddMore:    uploadFiles.length < maxFiles,
    remaining:     maxFiles - uploadFiles.length,
    addFiles,
    removeFile,
    updateProgress,
    setFileError,
    clearFiles,
    // Convenience: only return URLs of successfully uploaded files
    uploadedUrls:  uploadFiles.filter((f) => f.url).map((f) => f.url as string),
    rawFiles:      uploadFiles.map((f) => f.file),
  };
};