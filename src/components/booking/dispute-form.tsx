"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FileSelectionPreview } from "@/components/ui/file-selection-preview";
import { Textarea } from "@/components/ui/textarea";
import { DISPUTE_CATEGORY_GUIDANCE } from "@/lib/constants";

const categories = [
  { value: "damage", label: "Damage" },
  { value: "no_show", label: "No-show or access issue" },
  { value: "late", label: "Timing issue" },
  { value: "wrong_item", label: "Wrong items" },
  { value: "overcharge", label: "Overcharge" },
  { value: "other", label: "Suspicious / other" },
] as const;

const attachmentLabels = {
  damage: "Damage evidence",
  no_show: "Timing or access evidence",
  late: "Timing evidence",
  wrong_item: "Item mismatch evidence",
  overcharge: "Pricing evidence",
  other: "Issue evidence",
} as const;

export function DisputeForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [category, setCategory] =
    useState<(typeof categories)[number]["value"]>("damage");
  const [description, setDescription] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const guidance = DISPUTE_CATEGORY_GUIDANCE[category];

  useEffect(() => {
    if (!photoFile || !photoFile.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(photoFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [photoFile]);

  async function uploadProofIfNeeded() {
    if (!photoFile) {
      return [] as string[];
    }

    const formData = new FormData();
    formData.append("file", photoFile);
    formData.append("bucket", "proof-photos");

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error ?? "Unable to upload dispute proof.");
    }

    return [payload.path as string];
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const photoUrls = await uploadProofIfNeeded();
      const response = await fetch(`/api/bookings/${bookingId}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          description,
          photoUrls,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to raise dispute.");
      }

      setDescription("");
      setPhotoFile(null);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to raise dispute.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <select
        value={category}
        onChange={(event) =>
          setCategory(
            event.target.value as (typeof categories)[number]["value"],
          )
        }
        className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text"
      >
        {categories.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="rounded-xl border border-border bg-black/[0.02] p-3">
        <p className="text-sm font-medium text-text">{guidance.heading}</p>
        <p className="mt-1 text-sm text-text-secondary">{guidance.evidence}</p>
        <p className="mt-2 text-xs text-text-secondary">
          If someone asked to pay outside moverrr, choose Suspicious / other and
          describe exactly what was requested.
        </p>
      </div>
      <Textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder={guidance.prompt}
      />
      <div className="space-y-2">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white active:opacity-80">
            <Camera className="h-4 w-4" />
            Take Photo
            <input
              type="file"
              accept="image/*,image/heic,image/heif"
              capture="environment"
              className="sr-only"
              onChange={(event) =>
                setPhotoFile(event.target.files?.[0] ?? null)
              }
            />
          </label>
          <label className="hidden min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-text active:bg-black/[0.04] sm:flex dark:active:bg-white/[0.08]">
            <Upload className="h-4 w-4" />
            Upload File
            <input
              type="file"
              accept="image/*,image/heic,image/heif"
              capture="environment"
              className="sr-only"
              onChange={(event) =>
                setPhotoFile(event.target.files?.[0] ?? null)
              }
            />
          </label>
        </div>
        {photoFile ? (
          <FileSelectionPreview
            file={photoFile}
            imageUrl={previewUrl}
            label={attachmentLabels[category]}
            onRemove={() => setPhotoFile(null)}
          />
        ) : null}
      </div>
      {error ? <p className="text-sm text-error">{error}</p> : null}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting issue..." : "Report issue"}
      </Button>
    </form>
  );
}
