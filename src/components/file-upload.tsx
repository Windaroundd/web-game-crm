"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  IconUpload,
  IconX,
  IconFile,
  IconCheck,
  IconAlertCircle,
  IconPlus,
  IconLoader2,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils/utils";
import {
  uploadToSupabase,
  validateFile,
} from "@/lib/database/supabase-storage";

interface FileUploadProps {
  accept?: string;
  maxSize?: number; // in MB
  multiple?: boolean;
  onUpload?: (urls: string[]) => void;
  onRemove?: (index: number) => void;
  className?: string;
  label?: string;
  description?: string;
  disabled?: boolean;
  value?: string[]; // URLs of uploaded files
  bucket?: string; // Supabase bucket name
  folder?: string; // Folder within bucket
}

interface UploadedFile {
  file: File;
  url: string;
  status: "uploading" | "success" | "error";
  progress: number;
  error?: string;
}

// Target size for images: 4MB
const TARGET_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;

async function readImageFromFile(file: File): Promise<HTMLImageElement> {
  const image = new Image();
  image.decoding = "async";
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
  return new Promise((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = dataUrl;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("Compression produced empty blob"));
        resolve(blob);
      },
      type,
      quality
    );
  });
}

function isImageMimeType(mime: string) {
  return mime.startsWith("image/");
}

async function compressImageToTarget(
  file: File,
  targetBytes = TARGET_IMAGE_SIZE_BYTES
): Promise<File> {
  if (!isImageMimeType(file.type)) return file;
  if (file.size <= targetBytes) return file;

  const image = await readImageFromFile(file);

  // Start with a generous max dimension to preserve quality, reduce as needed
  let scale = 1;
  let quality = 0.92;

  // Prefer webp for better compression unless the browser doesn't support it
  // In modern browsers this is fine; fall back to jpeg if needed
  const outputType = "image/webp";

  // Create a canvas once and reuse
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  // Helper to render at current scale and quality
  const attempt = async () => {
    const targetWidth = Math.max(1, Math.round(image.naturalWidth * scale));
    const targetHeight = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    ctx.clearRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
    return await canvasToBlob(canvas, outputType, quality);
  };

  // Iterate reducing quality first, then scale if needed
  // Hard limits to avoid long loops
  for (let i = 0; i < 12; i++) {
    const blob = await attempt();
    if (blob.size <= targetBytes) {
      return new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), {
        type: outputType,
      });
    }
    if (quality > 0.5) {
      quality = Math.max(0.5, quality - 0.1);
    } else {
      // Reduce dimensions by 15% each step once quality is low
      scale = Math.max(0.3, scale * 0.85);
    }
  }

  // Final attempt at minimum settings
  const finalBlob = await canvasToBlob(canvas, outputType, 0.5);
  if (finalBlob.size < file.size) {
    return new File([finalBlob], file.name.replace(/\.[^.]+$/, ".webp"), {
      type: outputType,
    });
  }
  return file;
}

export function FileUpload({
  accept = "image/*",
  maxSize = 5,
  multiple = false,
  onUpload,
  onRemove,
  className,
  label,
  description,
  disabled = false,
  value = [],
  bucket = "uploads",
  folder = "",
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    // First, compress images over 4MB
    const processedFiles = await Promise.all(
      files.map(async (file) => {
        try {
          if (
            isImageMimeType(file.type) &&
            file.size > TARGET_IMAGE_SIZE_BYTES
          ) {
            const compressed = await compressImageToTarget(file);
            return compressed;
          }
          return file;
        } catch {
          return file;
        }
      })
    );

    const validFiles: File[] = [];

    // Validate each processed file
    for (const file of processedFiles) {
      const validation = validateFile(file, {
        maxSize,
        allowedTypes: accept.split(",").map((type) => type.trim()),
      });

      if (!validation.valid) {
        toast.error(`${file.name}: ${validation.error}`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    if (!multiple && validFiles.length > 1) {
      validFiles.splice(1);
    }

    const newFiles: UploadedFile[] = validFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file), // Temporary preview URL
      status: "uploading",
      progress: 0,
    }));

    setUploadedFiles((prev) => (multiple ? [...prev, ...newFiles] : newFiles));
    console.log("newFiles: ", newFiles);

    // Upload files to Supabase
    const uploadPromises = newFiles.map(async (uploadedFile, index) => {
      const actualIndex = multiple ? uploadedFiles.length + index : index;
      return uploadFileToSupabase(uploadedFile, actualIndex);
    });

    const uploadedUrls = await Promise.all(uploadPromises);
    const successfulUrls = uploadedUrls.filter(
      (url) => url !== null
    ) as string[];

    if (onUpload && successfulUrls.length > 0) {
      onUpload(successfulUrls);
      setUploadedFiles((prev) => prev.filter((f) => f.status !== "success"));
    }
  };

  const uploadFileToSupabase = async (
    uploadedFile: UploadedFile,
    index: number
  ): Promise<string | null> => {
    try {
      // Update progress periodically
      const progressInterval = setInterval(() => {
        setUploadedFiles((prev) =>
          prev.map((file, i) =>
            i === index
              ? { ...file, progress: Math.min(file.progress + 20, 90) }
              : file
          )
        );
      }, 500);

      const result = await uploadToSupabase(uploadedFile.file, {
        bucket,
        folder,
        contentType: uploadedFile.file.type,
      });

      clearInterval(progressInterval);

      if (result.error) {
        setUploadedFiles((prev) =>
          prev.map((file, i) =>
            i === index
              ? { ...file, status: "error", error: result.error, progress: 0 }
              : file
          )
        );
        toast.error(`Upload failed: ${result.error}`);
        return null;
      }

      // Update with success
      setUploadedFiles((prev) =>
        prev.map((file, i) =>
          i === index
            ? { ...file, status: "success", progress: 100, url: result.url }
            : file
        )
      );

      toast.success(`${uploadedFile.file.name} uploaded successfully`);
      return result.url;
    } catch {
      setUploadedFiles((prev) =>
        prev.map((file, i) =>
          i === index
            ? { ...file, status: "error", error: "Upload failed", progress: 0 }
            : file
        )
      );
      toast.error(`Upload failed for ${uploadedFile.file.name}`);
      return null;
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => {
      const newFiles = prev.filter((_, i) => i !== index);
      return newFiles;
    });
    if (onRemove) {
      onRemove(index);
    }
  };

  const openFileDialog = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const isImage = (file: File | string) => {
    if (typeof file === "string") {
      const lower = file.toLowerCase();
      const byExt = /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(lower);
      const byAccept = accept.includes("image/");
      return byExt || byAccept;
    }
    return file.type.startsWith("image/");
  };

  return (
    <div className={cn("space-y-4", className)}>
      {label && <Label>{label}</Label>}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {/* Upload Area */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          dragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <CardContent className="py-5 px-5">
          {value.length === 0 && uploadedFiles.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="rounded-full bg-muted/50 p-3 mb-3">
                <IconUpload
                  className={cn(
                    "h-6 w-6 transition-colors",
                    dragActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
              </div>
              <p className="text-sm font-medium">
                {dragActive
                  ? "Drop file here"
                  : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {accept} {multiple ? "• nhiều file" : ""}
              </p>
            </div>
          )}

          {(value.length > 0 || uploadedFiles.length > 0) && (
            <div
              className={
                multiple
                  ? `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3`
                  : ""
              }
            >
              {value.map((url, index) => (
                <div
                  key={`existing-${index}`}
                  className="group relative aspect-square overflow-hidden rounded-xl ring-1 ring-border bg-background shadow-sm"
                >
                  {isImage(url) ? (
                    <img
                      src={url}
                      alt="Uploaded file"
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="h-full w-full bg-muted flex items-center justify-center">
                      <IconFile className="h-7 w-7 text-muted-foreground" />
                    </div>
                  )}
                  {onRemove && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(index);
                      }}
                      disabled={disabled}
                      className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-background/80 shadow ring-1 ring-border opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <IconX className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}

              {uploadedFiles.map((uploadedFile, index) => (
                <div
                  key={`new-${index}`}
                  className="group relative aspect-square overflow-hidden rounded-xl ring-1 ring-border bg-background shadow-sm"
                >
                  {isImage(uploadedFile.file) ? (
                    <img
                      src={uploadedFile.url}
                      alt="Uploading file"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-muted flex items-center justify-center">
                      <IconFile className="h-7 w-7 text-muted-foreground" />
                    </div>
                  )}
                  {uploadedFile.status === "uploading" && (
                    <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2">
                      <IconLoader2 className="h-5 w-5 text-white/90 animate-spin" />
                      <Progress
                        value={uploadedFile.progress}
                        className="h-1 w-3/4"
                      />
                      <span className="text-[10px] tracking-wide text-white/90">
                        {uploadedFile.progress}%
                      </span>
                    </div>
                  )}
                  {uploadedFile.status === "success" && (
                    <div className="absolute top-2 right-2 rounded-full bg-background/90 shadow ring-1 ring-border p-1">
                      <IconCheck className="h-4 w-4 text-green-600" />
                    </div>
                  )}
                  {uploadedFile.status === "error" && (
                    <div className="absolute inset-0 bg-red-500/15 flex items-center justify-center">
                      <IconAlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    disabled={disabled}
                    className="absolute top-2 left-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-background/80 shadow ring-1 ring-border opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <IconX className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {multiple && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openFileDialog();
                  }}
                  className="aspect-square rounded-xl ring-1 ring-dashed ring-muted-foreground/40 text-muted-foreground hover:text-foreground hover:ring-foreground/40 transition-colors flex items-center justify-center"
                  disabled={disabled}
                >
                  <div className="flex flex-col items-center gap-1">
                    <IconPlus className="h-5 w-5" />
                    <span className="text-[11px]">Add</span>
                  </div>
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
