import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTaskSnapshot,
} from "firebase/storage";
import { storage } from "./config";
import { compressImage, validateImageFile } from "@/lib/utils/imageCompression";

export interface UploadProgressCallback {
  (progress: number): void;
}

export interface UploadResult {
  url:  string;
  path: string;
  name: string;
}

// ─── Single File Upload ──────────────────────────────────────

export const uploadIssueImage = async (
  file: File,
  citizenId: string,
  issueId: string,
  onProgress?: UploadProgressCallback
): Promise<UploadResult> => {
  // 1. Validate
  const validation = validateImageFile(file, 10);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // 2. Compress
  const compressed = await compressImage(file, {
    maxSizeMB:          1,
    maxWidthOrHeight:   1280,
    useWebWorker:       true,
    onProgress,
  });

  // 3. Build a unique storage path
  const timestamp  = Date.now();
  const extension  = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const fileName   = `${timestamp}-${Math.random().toString(36).slice(2)}.${extension}`;
  const storagePath = `issues/${citizenId}/${issueId}/${fileName}`;

  // 4. Upload with progress tracking
  const storageRef  = ref(storage, storagePath);
  const uploadTask  = uploadBytesResumable(storageRef, compressed);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot: UploadTaskSnapshot) => {
        if (onProgress) {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          onProgress(progress);
        }
      },
      (error) => {
        console.error("[Storage] Upload error:", error);
        reject(new Error(`Upload failed: ${error.message}`));
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({ url, path: storagePath, name: fileName });
      }
    );
  });
};

// ─── Multiple File Upload ─────────────────────────────────────

export const uploadMultipleImages = async (
  files: File[],
  citizenId: string,
  issueId: string,
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<UploadResult[]> => {
  const MAX_FILES = 5;
  const filesToUpload = files.slice(0, MAX_FILES);

  const results = await Promise.all(
    filesToUpload.map((file, index) =>
      uploadIssueImage(
        file,
        citizenId,
        issueId,
        onProgress ? (p) => onProgress(index, p) : undefined
      )
    )
  );

  return results;
};

// ─── Delete File ─────────────────────────────────────────────

export const deleteIssueImage = async (storagePath: string): Promise<void> => {
  try {
    const fileRef = ref(storage, storagePath);
    await deleteObject(fileRef);
  } catch (error) {
    // Don't throw if file doesn't exist — idempotent delete
    console.warn("[Storage] Delete skipped (file may not exist):", storagePath);
  }
};

// ─── Extract storage path from URL ───────────────────────────

export const extractStoragePath = (downloadUrl: string): string | null => {
  try {
    const url      = new URL(downloadUrl);
    const pathname = url.pathname;
    // Firebase Storage URLs contain /o/ followed by encoded path
    const match    = pathname.match(/\/o\/(.+)/);
    if (!match) return null;
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
};