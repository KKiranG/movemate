"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FileSelectionPreview } from "@/components/ui/file-selection-preview";
import { Textarea } from "@/components/ui/textarea";
import { BOOKING_CANCELLATION_REASONS } from "@/lib/constants";
import { ALLOWED_BOOKING_TRANSITIONS } from "@/lib/status-machine";
import type {
  BookingExceptionCode,
  BookingProofCondition,
  BookingStatus,
} from "@/types/booking";

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
  const [pickupItemCount, setPickupItemCount] = useState("1");
  const [pickupCondition, setPickupCondition] =
    useState<BookingProofCondition>("no_visible_damage");
  const [pickupHandoffConfirmed, setPickupHandoffConfirmed] = useState(false);
  const [deliveryRecipientConfirmed, setDeliveryRecipientConfirmed] = useState(false);
  const [deliveryExceptionCode, setDeliveryExceptionCode] =
    useState<BookingExceptionCode>("none");
  const [deliveryExceptionNote, setDeliveryExceptionNote] = useState("");
  const [exceptionCode, setExceptionCode] = useState<Exclude<BookingExceptionCode, "none">>("other");
  const [exceptionNote, setExceptionNote] = useState("");
  const [exceptionFiles, setExceptionFiles] = useState<File[]>([]);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancellationReasonCode, setCancellationReasonCode] = useState("carrier_unavailable");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingException, setIsLoggingException] = useState(false);
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

  async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
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

  async function uploadProofIfNeeded() {
    if (!proofFile) {
      return null;
    }

    return uploadFile(proofFile);
  }

  async function uploadExceptionFiles() {
    if (exceptionFiles.length === 0) {
      return [] as string[];
    }

    return Promise.all(exceptionFiles.map((file) => uploadFile(file)));
  }

  function clearProofState() {
    setProofFile(null);
    setPickupItemCount("1");
    setPickupCondition("no_visible_damage");
    setPickupHandoffConfirmed(false);
    setDeliveryRecipientConfirmed(false);
    setDeliveryExceptionCode("none");
    setDeliveryExceptionNote("");
  }

  async function update(nextStatus: BookingStatus) {
    setError(null);
    setIsSubmitting(true);

    try {
      if ((nextStatus === "picked_up" || nextStatus === "delivered") && !proofFile) {
        throw new Error("Upload a proof photo before changing that booking status.");
      }

      if (nextStatus === "cancelled" && !cancellationReason.trim()) {
        throw new Error("Add a short cancellation reason for audit history.");
      }

      let pickupProof:
        | {
            photoUrl: string;
            itemCount: number;
            condition: BookingProofCondition;
            handoffConfirmed: true;
          }
        | undefined;
      let deliveryProof:
        | {
            photoUrl: string;
            recipientConfirmed: true;
            exceptionCode?: BookingExceptionCode;
            exceptionNote?: string;
          }
        | undefined;

      if (nextStatus === "picked_up") {
        if (!pickupHandoffConfirmed) {
          throw new Error("Confirm the pickup handoff before marking the booking as picked up.");
        }

        const uploadedProof = await uploadProofIfNeeded();

        pickupProof = {
          photoUrl: uploadedProof ?? "",
          itemCount: Number(pickupItemCount),
          condition: pickupCondition,
          handoffConfirmed: true,
        };
      }

      if (nextStatus === "delivered") {
        if (!deliveryRecipientConfirmed) {
          throw new Error("Confirm recipient handoff before marking the booking as delivered.");
        }

        if (deliveryExceptionCode !== "none" && !deliveryExceptionNote.trim()) {
          throw new Error("Add a short exception note when delivery proof flags an issue.");
        }

        const uploadedProof = await uploadProofIfNeeded();

        deliveryProof = {
          photoUrl: uploadedProof ?? "",
          recipientConfirmed: true,
          exceptionCode: deliveryExceptionCode,
          exceptionNote:
            deliveryExceptionCode !== "none" ? deliveryExceptionNote.trim() : undefined,
        };
      }

      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nextStatus,
          pickupProof,
          deliveryProof,
          cancellationReason: cancellationReason.trim() || undefined,
          cancellationReasonCode,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update booking status.");
      }

      setConfirmCancellation(false);
      clearProofState();
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to update booking status.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function logException() {
    setError(null);
    setIsLoggingException(true);

    try {
      if (!exceptionNote.trim()) {
        throw new Error("Add a short factual note before logging an exception.");
      }

      const photoUrls = await uploadExceptionFiles();
      const response = await fetch(`/api/bookings/${bookingId}/exception`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: exceptionCode,
          note: exceptionNote.trim(),
          photoUrls,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to log booking exception.");
      }

      setExceptionNote("");
      setExceptionFiles([]);
      setDeliveryExceptionCode(exceptionCode);
      if (!deliveryExceptionNote.trim()) {
        setDeliveryExceptionNote(payload.exception.note);
      }
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to log booking exception.",
      );
    } finally {
      setIsLoggingException(false);
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
            "Capture the loaded item, count what was handed over, note visible condition, and confirm the handoff before you mark pickup complete.",
          label: "Pickup proof photo",
        }
      : transitions.includes("delivered")
        ? {
          title: "Delivery proof pack",
          helper:
            "Capture the delivered item, confirm recipient handoff, and attach an exception note if anything mismatched, was damaged, or could not be completed cleanly.",
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
          {transitions.includes("picked_up") && !transitions.includes("delivered") ? (
            <div className="grid gap-3 rounded-xl border border-border p-3">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-text">How many items were handed over?</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={pickupItemCount}
                  onChange={(event) => setPickupItemCount(event.target.value)}
                  className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-text">Visible condition at pickup</span>
                <select
                  value={pickupCondition}
                  onChange={(event) =>
                    setPickupCondition(event.target.value as BookingProofCondition)
                  }
                  className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text"
                >
                  <option value="no_visible_damage">No visible damage</option>
                  <option value="wear_noted">Existing wear noted</option>
                  <option value="damage_noted">Damage noted at pickup</option>
                </select>
              </label>
              <label className="flex min-h-[44px] items-start gap-3 rounded-xl border border-border p-3 text-sm text-text">
                <input
                  type="checkbox"
                  checked={pickupHandoffConfirmed}
                  onChange={(event) => setPickupHandoffConfirmed(event.target.checked)}
                  className="mt-1 h-4 w-4"
                />
                <span>
                  I confirmed the pickup handoff and the proof photo matches what was loaded.
                </span>
              </label>
            </div>
          ) : null}
          {transitions.includes("delivered") ? (
            <div className="grid gap-3 rounded-xl border border-border p-3">
              <label className="flex min-h-[44px] items-start gap-3 rounded-xl border border-border p-3 text-sm text-text">
                <input
                  type="checkbox"
                  checked={deliveryRecipientConfirmed}
                  onChange={(event) => setDeliveryRecipientConfirmed(event.target.checked)}
                  className="mt-1 h-4 w-4"
                />
                <span>
                  I confirmed the delivery handoff with the recipient or receiving contact.
                </span>
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-text">Delivery exception</span>
                <select
                  value={deliveryExceptionCode}
                  onChange={(event) =>
                    setDeliveryExceptionCode(event.target.value as BookingExceptionCode)
                  }
                  className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text"
                >
                  <option value="none">No issue to note</option>
                  <option value="damage">Damage</option>
                  <option value="no_show">No-show or blocked handoff</option>
                  <option value="late">Timing issue</option>
                  <option value="wrong_item">Wrong item</option>
                  <option value="overcharge">Pricing issue</option>
                  <option value="other">Other issue</option>
                </select>
              </label>
              {deliveryExceptionCode !== "none" ? (
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-text">Exception note</span>
                  <Textarea
                    value={deliveryExceptionNote}
                    onChange={(event) => setDeliveryExceptionNote(event.target.value)}
                    placeholder="Short factual note for ops and the customer timeline."
                  />
                </label>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="rounded-xl border border-border bg-black/[0.02] p-3 dark:bg-white/[0.04]">
        <p className="text-sm font-medium text-text">Log an exception in the moment</p>
        <p className="mt-1 text-sm text-text-secondary">
          Use this for blocked access, item mismatch, damage, no-show, or any suspicious payment
          push so ops gets a timestamped record before the timeline moves on.
        </p>
        <div className="mt-3 grid gap-3">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-text">Exception type</span>
            <select
              value={exceptionCode}
              onChange={(event) =>
                setExceptionCode(event.target.value as Exclude<BookingExceptionCode, "none">)
              }
              className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text"
            >
              <option value="damage">Damage</option>
              <option value="no_show">No-show or blocked handoff</option>
              <option value="late">Timing issue</option>
              <option value="wrong_item">Wrong item</option>
              <option value="overcharge">Pricing issue</option>
              <option value="other">Other issue</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-text">What happened?</span>
            <Textarea
              value={exceptionNote}
              onChange={(event) => setExceptionNote(event.target.value)}
              placeholder="Short factual note with what happened, when, and what was blocked."
            />
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-text active:bg-black/[0.04] dark:active:bg-white/[0.08]">
              <Camera className="h-4 w-4" />
              Add exception photos
              <input
                type="file"
                multiple
                accept="image/*,image/heic,image/heif"
                capture="environment"
                className="sr-only"
                onChange={(event) => setExceptionFiles(Array.from(event.target.files ?? []))}
              />
            </label>
            <Button
              type="button"
              variant="secondary"
              disabled={isLoggingException}
              onClick={() => void logException()}
            >
              {isLoggingException ? "Logging exception..." : "Log exception now"}
            </Button>
          </div>
          {exceptionFiles.length > 0 ? (
            <div className="rounded-xl border border-border px-3 py-2 text-sm text-text-secondary">
              {exceptionFiles.length} photo{exceptionFiles.length === 1 ? "" : "s"} ready for the
              exception record.
            </div>
          ) : null}
        </div>
      </div>
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
                This action is immediate and cannot be undone from carrier home.
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
