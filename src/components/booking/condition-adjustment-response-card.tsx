"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getConditionAdjustmentReasonLabel } from "@/lib/validation/condition-adjustment";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { ConditionAdjustment } from "@/types/condition-adjustment";

function getStatusCopy(adjustment: ConditionAdjustment) {
  if (adjustment.status === "pending") {
    return "One structured response only: accept the controlled amount or reject it and let MoveMate close the booking under the misdescription policy.";
  }

  if (adjustment.status === "accepted") {
    return "The updated total is now attached to the booking. If payment recovery is required, MoveMate will show it on this page.";
  }

  if (adjustment.status === "rejected") {
    return "The booking was cancelled under the misdescription policy after the adjustment was rejected.";
  }

  if (adjustment.status === "expired") {
    return "The response window closed before the customer answered. Use support if this booking still needs manual ops review.";
  }

  return "This adjustment is closed.";
}

export function ConditionAdjustmentResponseCard({
  adjustment,
}: {
  adjustment: ConditionAdjustment;
}) {
  const router = useRouter();
  const [customerResponseNote, setCustomerResponseNote] = useState("");
  const [busyAction, setBusyAction] = useState<"accept" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRespond(action: "accept" | "reject") {
    setBusyAction(action);
    setError(null);

    try {
      const response = await fetch(`/api/condition-adjustments/${adjustment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          customerResponseNote: customerResponseNote.trim() || undefined,
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to respond to the condition adjustment.");
      }

      setCustomerResponseNote("");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to respond to the condition adjustment.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-warning/20 bg-warning/10 p-4">
      <div>
        <p className="section-label">Condition adjustment</p>
        <h2 className="mt-1 text-lg text-text">{getConditionAdjustmentReasonLabel(adjustment.reasonCode)}</h2>
      </div>
      <div className="grid gap-2 text-sm text-text-secondary">
        <p>Amount: {formatCurrency(adjustment.amountCents)}</p>
        <p>Status: {adjustment.status.replaceAll("_", " ")}</p>
        <p>Respond by {formatDateTime(adjustment.responseDeadlineAt)}</p>
        {adjustment.note ? <p>Carrier note: {adjustment.note}</p> : null}
        <p>{getStatusCopy(adjustment)}</p>
      </div>

      {adjustment.status === "pending" ? (
        <>
          <label className="grid gap-2 text-sm text-text-secondary">
            <span className="text-text">Customer note</span>
            <Textarea
              value={customerResponseNote}
              onChange={(event) => setCustomerResponseNote(event.target.value)}
              placeholder="Optional factual note for the booking record."
              maxLength={280}
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              className="min-h-[44px]"
              disabled={busyAction !== null}
              onClick={() => void handleRespond("accept")}
            >
              {busyAction === "accept" ? "Accepting..." : "Accept adjustment"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="min-h-[44px]"
              disabled={busyAction !== null}
              onClick={() => void handleRespond("reject")}
            >
              {busyAction === "reject" ? "Rejecting..." : "Reject and cancel booking"}
            </Button>
          </div>
        </>
      ) : null}

      {adjustment.customerResponseNote ? (
        <p className="text-sm text-text-secondary">
          Customer note: {adjustment.customerResponseNote}
        </p>
      ) : null}
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  );
}
