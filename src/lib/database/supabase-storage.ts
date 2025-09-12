import { createClient } from "@/lib/database/supabase/client";

export interface ValidateOptions {
  maxSize?: number; // MB
  allowedTypes?: string[]; // e.g., ["image/*", "image/png"]
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFile(
  file: File,
  options: ValidateOptions = {}
): ValidationResult {
  const { maxSize = 5, allowedTypes } = options;

  // Size check
  const maxBytes = maxSize * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, error: `File exceeds ${maxSize}MB` };
  }

  // Type check
  if (allowedTypes && allowedTypes.length > 0) {
    const isAllowed = allowedTypes.some((pattern) => {
      const trimmed = pattern.trim();
      if (trimmed.endsWith("/*")) {
        const prefix = trimmed.slice(0, -1); // keep slash
        return file.type.startsWith(prefix);
      }
      return file.type === trimmed;
    });

    if (!isAllowed) {
      return {
        valid: false,
        error: `Unsupported file type: ${file.type || "unknown"}`,
      };
    }
  }

  return { valid: true };
}

export interface UploadOptions {
  bucket: string;
  folder?: string;
  contentType?: string;
}

export interface UploadResult {
  url: string;
  error?: string;
}

export async function uploadToSupabase(
  file: File,
  options: UploadOptions
): Promise<UploadResult> {
  const { bucket, folder = "", contentType } = options;

  const supabase = createClient();

  const fileExt = file.name.split(".").pop() || "bin";
  const uniqueId =
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const cleanFolder = folder.replace(/^\/+|\/+$/g, "");
  const path = `${cleanFolder ? cleanFolder + "/" : ""}${uniqueId}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: false,
      contentType: contentType || file.type || "application/octet-stream",
    });

  if (uploadError) {
    return { url: "", error: uploadError.message };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl };
}
