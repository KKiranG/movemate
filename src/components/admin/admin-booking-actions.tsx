"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Booking } from "@/types/booking";

export function AdminBookingActions({ booking }: { booking: Booking }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function runStatusOverride(nextStatus: "completed" | "cancelled") {
    if (reason.trim().length < 8) {
      setError("Add a short reason before forcing a booking change.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorRole: "admin",
          nextStatus,
          reason: reason.trim(),
          cancellationReason:
            nextStatus === "cancelled"
              ? `Admin override: ${reason.trim()}`
              : undefined,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update booking.");
      }

      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to update booking.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function runManualCapture() {
    if (reason.trim().length < 8) {
      setError("Add a short reason before manually capturing a payment.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/admin/bookings/${booking.id}/capture`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: reason.trim(),
          }),
        },
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to capture payment.");
      }

      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to capture payment.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const canCapture =
    booking.status === "completed" && booking.paymentStatus === "authorized";
  const canForceComplete =
    booking.status !== "completed" &&
    booking.status !== "cancelled" &&
    booking.status !== "disputed";
  const canCancel = booking.status !== "cancelled";

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="space-y-3">
        <div>
          <p className="section-label">Admin actions</p>
          <h2 className="mt-1 text-lg text-text">
            Manual recovery and audit-safe overrides
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Every admin action writes a reason into the booking audit trail.
          </p>
        </div>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-text">Reason</span>
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Explain why this override or payment recovery is needed."
            maxLength={280}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {canCapture ? (
            <Button
              type="button"
              onClick={() => void runManualCapture()}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Capturing..." : "Capture payment"}
            </Button>
          ) : null}
          {canForceComplete ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => void runStatusOverride("completed")}
              disabled={isSubmitting}
            >
              Mark completed
            </Button>
          ) : null}
          {canCancel ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => void runStatusOverride("cancelled")}
              disabled={isSubmitting}
            >
              Cancel booking
            </Button>
          ) : null}
        </div>
        {error ? <p className="text-sm text-error">{error}</p> : null}
      </div>
    </div>
  );
}
