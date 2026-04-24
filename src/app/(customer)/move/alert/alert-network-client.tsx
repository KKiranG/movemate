"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useMoveRequestDraft } from "@/components/customer/use-move-request-draft";
import { toMoveRequestInputFromDraft } from "@/components/customer/move-request-draft";
import { Button } from "@/components/ui/button";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type AlertMoveSummary = {
  id: string;
  itemDescription: string;
  pickupSuburb: string;
  dropoffSuburb: string;
  preferredDate?: string | null;
};

export function AlertNetworkClient({
  moveRequestId,
  moveRequest,
}: {
  moveRequestId?: string;
  moveRequest?: AlertMoveSummary | null;
}) {
  const { draft, isHydrated } = useMoveRequestDraft();
  const [status, setStatus] = useState<"idle" | "submitting" | "submitted" | "error">("idle");
  const [message, setMessage] = useState("");
  const moveRequestInput = useMemo(() => toMoveRequestInputFromDraft(draft), [draft]);
  const validMoveRequestId =
    moveRequest?.id ??
    (moveRequestId && UUID_PATTERN.test(moveRequestId) ? moveRequestId : undefined);
  const canSubmit = Boolean(validMoveRequestId || moveRequestInput);

  async function handleSubmit() {
    if (!canSubmit) {
      setStatus("error");
      setMessage("Add pickup, drop-off, and item details before alerting the network.");
      return;
    }

    setStatus("submitting");
    setMessage("");

    const response = validMoveRequestId
      ? await fetch("/api/unmatched-requests/from-move-request", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ moveRequestId: validMoveRequestId }),
        })
      : await fetch("/api/unmatched-requests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pickupSuburb: moveRequestInput?.pickupSuburb,
            pickupPostcode: moveRequestInput?.pickupPostcode,
            pickupLatitude: moveRequestInput?.pickupLatitude,
            pickupLongitude: moveRequestInput?.pickupLongitude,
            dropoffSuburb: moveRequestInput?.dropoffSuburb,
            dropoffPostcode: moveRequestInput?.dropoffPostcode,
            dropoffLatitude: moveRequestInput?.dropoffLatitude,
            dropoffLongitude: moveRequestInput?.dropoffLongitude,
            itemCategory: moveRequestInput?.itemCategory,
            itemDescription: moveRequestInput?.itemDescription,
            preferredDate: moveRequestInput?.preferredDate,
            status: "active",
          }),
        });

    const body = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setStatus("error");
      setMessage(body.error ?? "We could not create the route alert.");
      return;
    }

    setStatus("submitted");
    setMessage("We're on it. You'll be notified the moment a matching route appears.");
  }

  if (!isHydrated) {
    return <p className="caption">Loading your move details...</p>;
  }

  return (
    <div className="space-y-5">
      <div className="surface-1">
        {moveRequest ? (
          <>
            <p className="caption">
              {moveRequest.itemDescription} · {moveRequest.pickupSuburb} →{" "}
              {moveRequest.dropoffSuburb}
              {moveRequest.preferredDate ? ` · ${moveRequest.preferredDate}` : ""}
            </p>
            <Link
              href="/move/new"
              className="mt-3 inline-flex min-h-[44px] min-w-[44px] items-center rounded-[var(--radius-pill)] border border-[var(--border-subtle)] px-3 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
            >
              Edit this move
            </Link>
          </>
        ) : moveRequestInput ? (
          <>
            <p className="caption">
              {moveRequestInput.itemDescription} · {moveRequestInput.pickupSuburb} →{" "}
              {moveRequestInput.dropoffSuburb}
              {moveRequestInput.preferredDate ? ` · ${moveRequestInput.preferredDate}` : ""}
            </p>
            <Link
              href="/move/new"
              className="mt-3 inline-flex min-h-[44px] min-w-[44px] items-center rounded-[var(--radius-pill)] border border-[var(--border-subtle)] px-3 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
            >
              Edit this move
            </Link>
          </>
        ) : (
          <>
            <p className="caption">
              We need the move details before we can alert verified drivers.
            </p>
            <Link
              href="/move/new"
              className="mt-3 inline-flex min-h-[44px] min-w-[44px] items-center rounded-[var(--radius-pill)] border border-[var(--border-subtle)] px-3 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
            >
              Add move details
            </Link>
          </>
        )}
      </div>

      <div className="surface-1 space-y-3">
        <p className="title">What happens next</p>
        <p className="caption">1. We store the unmatched move need.</p>
        <p className="caption">2. Verified drivers and operator queues can see the corridor demand.</p>
        <p className="caption">3. If a viable route appears, you come back into the same booking flow.</p>
      </div>

      {message ? (
        <p
          role="status"
          className={`caption ${status === "error" ? "text-[var(--danger)]" : "text-[var(--success)]"}`}
        >
          {message}
        </p>
      ) : null}

      <Button
        type="button"
        className="w-full"
        disabled={!canSubmit || status === "submitting" || status === "submitted"}
        onClick={handleSubmit}
      >
        {status === "submitted"
          ? "Network alerted"
          : status === "submitting"
            ? "Alerting..."
            : "Alert the Network"}
      </Button>
    </div>
  );
}
