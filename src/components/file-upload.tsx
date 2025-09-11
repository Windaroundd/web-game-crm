"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  IconUpload,
  IconX,
  IconFile,
  IconCheck,
  IconAlertCircle,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { uploadToSupabase, validateFile } from "@/lib/supabase-storage";

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
    const validFiles: File[] = [];

    // Validate each file
    for (const file of files) {
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
    if (typeof file === "string") return file.includes("image");
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
        <CardContent className="flex flex-col items-center justify-center py-8 px-4">
          <IconUpload
            className={cn(
              "h-8 w-8 mb-4 transition-colors",
              dragActive ? "text-primary" : "text-muted-foreground"
            )}
          />
          <div className="text-center space-y-2">
            <p className="text-sm font-medium">
              {dragActive
                ? "Drop files here"
                : "Click to upload or drag and drop"}
            </p>
            <p className="text-xs text-muted-foreground">
              {accept} up to {maxSize}MB{" "}
              {multiple ? "(multiple files)" : "(single file)"}
            </p>
          </div>
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

      {/* Existing Files (from value prop) */}
      {value.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Current Files</Label>
          <div className="grid gap-3">
            {value.map((url, index) => (
              <div
                key={`existing-${index}`}
                className="flex items-center gap-3 p-3 border rounded-lg"
              >
                {isImage(url) ? (
                  <img
                    src={url}
                    alt="Uploaded file"
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                    <IconFile className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium truncate">
                    {url.split("/").pop()}
                  </p>
                  <p className="text-xs text-muted-foreground">Uploaded</p>
                </div>
                <div className="flex items-center gap-2">
                  <IconCheck className="h-4 w-4 text-green-600" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onRemove) onRemove(index);
                    }}
                    disabled={disabled}
                  >
                    <IconX className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Uploading Files</Label>
          <div className="grid gap-3">
            {uploadedFiles.map((uploadedFile, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 border rounded-lg"
              >
                {isImage(uploadedFile.file) ? (
                  <img
                    src={uploadedFile.url}
                    alt="Uploaded file"
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                    <IconFile className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium truncate">
                    {uploadedFile.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {uploadedFile.status === "uploading" && (
                    <Progress value={uploadedFile.progress} className="h-1" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {uploadedFile.status === "uploading" && (
                    <div className="text-xs text-muted-foreground">
                      {uploadedFile.progress}%
                    </div>
                  )}
                  {uploadedFile.status === "success" && (
                    <IconCheck className="h-4 w-4 text-green-600" />
                  )}
                  {uploadedFile.status === "error" && (
                    <IconAlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    disabled={disabled}
                  >
                    <IconX className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
