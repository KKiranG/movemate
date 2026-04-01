"use client";

import { FileImage, FileText, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/utils";

export function FileSelectionPreview({
  file,
  imageUrl,
  label,
  onRemove,
}: {
  file: File;
  imageUrl?: string | null;
  label?: string;
  onRemove: () => void;
}) {
  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);

  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="flex items-start gap-3">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-border bg-black/[0.03]">
          {isImage && imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={label ?? file.name} className="h-full w-full object-cover" />
          ) : isPdf ? (
            <FileText className="h-6 w-6 text-text-secondary" />
          ) : (
            <FileImage className="h-6 w-6 text-text-secondary" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text">{label ?? "Selected file"}</p>
          <p className="mt-1 truncate text-sm text-text-secondary">{file.name}</p>
          <p className="text-xs text-text-secondary">{formatFileSize(file.size)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="min-w-[44px]"
              onClick={onRemove}
            >
              <X className="mr-1 h-4 w-4" />
              Remove
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
