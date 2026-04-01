"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FileSelectionPreview } from "@/components/ui/file-selection-preview";
import { Textarea } from "@/components/ui/textarea";
import { BOOKING_CANCELLATION_REASONS } from "@/lib/constants";
import { ALLOWED_BOOKING_TRANSITIONS } from "@/lib/status-machine";
import type { BookingStatus } from "@/types/booking";

const CARRIER_MANAGED_TRANSITIONS = new Set<BookingStatus>([
  "confirmed",
  "cancelled",
  "picked_up",
  "in_transit",
  "delivered",
]);

export function StatusUpdateActions({
  bookingId,
  currentStatus,
}: {
  bookingId: string;
  currentStatus: BookingStatus;
}) {
  const router = useRouter();
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancellationReasonCode, setCancellationReasonCode] = useState("carrier_unavailable");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmCancellation, setConfirmCancellation] = useState(false);

  useEffect(() => {
    if (!proofFile || !proofFile.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(proofFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [proofFile]);

  async function uploadProofIfNeeded() {
    if (!proofFile) {
      return null;
    }

    const formData = new FormData();
    formData.append("file", proofFile);
    formData.append("bucket", "proof-photos");

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error ?? "Unable to upload proof photo.");
    }

    return payload.path as string;
  }

  async function update(nextStatus: BookingStatus) {
    setError(null);
    setIsSubmitting(true);

    try {
      let pickupProofPhotoUrl: string | undefined;
      let deliveryProofPhotoUrl: string | undefined;

      if ((nextStatus === "picked_up" || nextStatus === "delivered") && !proofFile) {
        throw new Error("Upload a proof photo before changing that booking status.");
      }

      if (nextStatus === "cancelled" && !cancellationReason.trim()) {
        throw new Error("Add a short cancellation reason for audit history.");
      }

      if (nextStatus === "picked_up") {
        pickupProofPhotoUrl = (await uploadProofIfNeeded()) ?? undefined;
      }

      if (nextStatus === "delivered") {
        deliveryProofPhotoUrl = (await uploadProofIfNeeded()) ?? undefined;
      }

      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nextStatus,
          pickupProofPhotoUrl,
          deliveryProofPhotoUrl,
          cancellationReason: cancellationReason.trim() || undefined,
          cancellationReasonCode,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update booking status.");
      }

      setConfirmCancellation(false);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to update booking status.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const transitions = (ALLOWED_BOOKING_TRANSITIONS[currentStatus] ?? []).filter((status) =>
    CARRIER_MANAGED_TRANSITIONS.has(status),
  );
  const proofChecklist =
    transitions.includes("picked_up") && !transitions.includes("delivered")
      ? {
          title: "Pickup proof pack",
          helper:
            "Capture the loaded item, visible condition, and a clear handoff view before you mark pickup complete.",
          label: "Pickup proof photo",
        }
      : transitions.includes("delivered")
        ? {
            title: "Delivery proof pack",
            helper:
              "Capture the delivered item and handoff area, then keep any access, mismatch, or damage evidence ready for the issue flow.",
            label: "Delivery proof photo",
          }
        : null;

  if (transitions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {proofChecklist ? (
        <div className="space-y-2">
          <div className="rounded-xl border border-border bg-black/[0.02] p-3 text-sm text-text-secondary dark:bg-white/[0.04]">
            <p className="font-medium text-text">{proofChecklist.title}</p>
            <p className="mt-1">{proofChecklist.helper}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white active:opacity-80">
              <Camera className="h-4 w-4" />
              Take Photo
              <input
                type="file"
                accept="image/*,image/heic,image/heif"
                capture="environment"
                className="sr-only"
                onChange={(event) => setProofFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <label className="hidden min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-text active:bg-black/[0.04] sm:flex dark:active:bg-white/[0.08]">
              <Upload className="h-4 w-4" />
              Upload File
              <input
                type="file"
                accept="image/*,image/heic,image/heif"
                className="sr-only"
                onChange={(event) => setProofFile(event.target.files?.[0] ?? null)}
              />
            </label>
          </div>
          {proofFile ? (
            <FileSelectionPreview
              file={proofFile}
              imageUrl={previewUrl}
              label={proofChecklist.label}
              onRemove={() => setProofFile(null)}
            />
          ) : null}
        </div>
      ) : null}
      {transitions.includes("cancelled") ? (
        <div className="space-y-2">
          <select
            value={cancellationReasonCode}
            onChange={(event) => setCancellationReasonCode(event.target.value)}
            className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text"
          >
            {BOOKING_CANCELLATION_REASONS.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
          <Textarea
            value={cancellationReason}
            onChange={(event) => setCancellationReason(event.target.value)}
            placeholder="Add short factual context for ops and the customer."
          />
          {confirmCancellation ? (
            <div className="rounded-xl border border-warning/20 bg-warning/10 p-3 text-sm text-text">
              <p className="font-medium text-warning">Cancel this booking?</p>
              <p className="mt-1 text-text-secondary">
                This action is immediate and cannot be undone from the carrier dashboard.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isSubmitting}
                  onClick={() => setConfirmCancellation(false)}
                >
                  Keep booking
                </Button>
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void update("cancelled")}
                >
                  Confirm cancellation
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {transitions.map((status) => (
          <Button
            key={status}
            type="button"
            variant={status === "cancelled" ? "secondary" : "primary"}
            disabled={isSubmitting}
            onClick={() => {
              if (status === "cancelled") {
                if (!cancellationReason.trim()) {
                  setError("Add a short cancellation reason for audit history.");
                  return;
                }

                setError(null);
                setConfirmCancellation(true);
                return;
              }

              setConfirmCancellation(false);
              void update(status);
            }}
          >
            {status.replace("_", " ")}
          </Button>
        ))}
      </div>
      <p className="text-xs text-text-secondary">
        If access is blocked, the item mismatches the booking, or someone pushes payment
        off-platform, capture evidence right away and keep the report inside moverrr.
      </p>
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  );
}
