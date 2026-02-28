import imageCompression from "browser-image-compression";

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  onProgress?: (progress: number) => void;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1280,
  useWebWorker: true,
};

/**
 * Compress a single image file before upload
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<File> => {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: mergedOptions.maxSizeMB,
      maxWidthOrHeight: mergedOptions.maxWidthOrHeight,
      useWebWorker: mergedOptions.useWebWorker,
      onProgress: mergedOptions.onProgress,
    });
    return compressed;
  } catch (error) {
    console.error("Image compression failed:", error);
    // Return original file if compression fails
    return file;
  }
};

/**
 * Compress multiple image files
 */
export const compressImages = async (
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> => {
  return Promise.all(files.map((file) => compressImage(file, options)));
};

/**
 * Validate image file type and size
 */
export const validateImageFile = (
  file: File,
  maxSizeMB: number = 10
): { valid: boolean; error?: string } => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `${file.name} is not a supported format. Use JPG, PNG or WebP.`,
    };
  }

  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `${file.name} exceeds ${maxSizeMB}MB limit.`,
    };
  }

  return { valid: true };
};

/**
 * Convert a File to a Base64 data URL for preview
 */
export const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

/**
 * Get human-readable file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};