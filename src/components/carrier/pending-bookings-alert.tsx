"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { RequestClarificationSheet } from "@/components/carrier/request-clarification-sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import type { CarrierRequestCard } from "@/types/carrier";
import { formatCurrency, formatDateTime } from "@/lib/utils";

const declineOptions = [
  { value: "route_not_viable", label: "Route no longer viable" },
  { value: "item_not_supported", label: "Item not supported" },
  { value: "access_too_complex", label: "Access too complex" },
  { value: "timing_not_workable", label: "Timing not workable" },
  { value: "capacity_no_longer_available", label: "Capacity no longer available" },
] as const;

function formatRemainingTime(value: string | null | undefined, now: number) {
  if (!value) {
    return "No expiry time set";
  }

  const expiry = new Date(value).getTime();
  if (Number.isNaN(expiry)) {
    return "No expiry time set";
  }

  const diff = expiry - now;
  if (diff <= 0) {
    return "Expired";
  }

  const totalMinutes = Math.floor(diff / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }

  return `${minutes}m left`;
}

export function PendingBookingsAlert({
  requests,
  compact = false,
}: {
  requests: CarrierRequestCard[];
  compact?: boolean;
}) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [clarifyingRequestId, setClarifyingRequestId] = useState<string | null>(null);
  const [declineReasons, setDeclineReasons] = useState<Record<string, string>>({});
  const openRequests = useMemo(
    () => requests.filter((request) => ["pending", "clarification_requested"].includes(request.status)),
    [requests],
  );

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  async function updateRequest(
    request: CarrierRequestCard,
    action: "accept" | "decline" | "clarify",
    clarification?: { clarificationReason: string; clarificationMessage: string },
  ) {
    setBusyId(`${request.id}:${action}`);

    try {
      const response = await fetch(`/api/booking-requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          declineReason:
            action === "decline"
              ? declineReasons[request.id] ?? declineOptions[0].value
              : undefined,
          clarificationReason: clarification?.clarificationReason,
          clarificationMessage: clarification?.clarificationMessage,
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update request.");
      }

      router.refresh();
    } catch (error) {
      throw error;
    } finally {
      setBusyId(null);
    }
  }

  if (openRequests.length === 0) {
    return null;
  }

  return (
    <Card className="border-warning/20 bg-warning/10 p-4">
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-label">Requests</p>
            <h2 className="mt-1 text-lg text-text">Answer requests before the response window closes</h2>
            <p className="mt-1 text-sm text-text-secondary">
              {openRequests.length} request{openRequests.length === 1 ? "" : "s"} need a carrier decision now.
            </p>
          </div>
          <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
            Highest trust signal on the supply side
          </p>
        </div>

        <div className="grid gap-3">
          {openRequests.map((request) => (
            <div key={request.id} className="rounded-xl border border-warning/20 bg-background p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={request.status === "clarification_requested" ? "pending" : request.status} />
                    <p className="text-sm font-medium text-text">{request.typeLabel}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-text-secondary">{request.fitLabel}</p>
                  </div>
                  <p className="text-sm text-text">{request.itemDescription}</p>
                  <p className="text-sm text-text-secondary">
                    {request.pickupAddress} to {request.dropoffAddress}
                  </p>
                  <p className="text-xs text-text-secondary">
                    Respond in {formatRemainingTime(request.responseDeadlineAt, now)} · Deadline{" "}
                    {formatDateTime(request.responseDeadlineAt)}
                  </p>
                  {request.urgencyLabel ? (
                    <p className="text-xs uppercase tracking-[0.16em] text-warning">
                      {request.urgencyLabel}
                    </p>
                  ) : null}
                  <p className="text-xs text-text-secondary">{request.fitExplanation}</p>
                  <p className="text-xs text-text-secondary">
                    {request.accessSummary} · {request.photoCount} photo{request.photoCount === 1 ? "" : "s"}
                  </p>
                  {request.photoUrls.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {request.photoUrls.slice(0, 3).map((photoUrl, index) => (
                        <a
                          key={`${request.id}:${photoUrl}:${index}`}
                          href={photoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block min-h-[44px] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 active:opacity-80"
                        >
                          {/* External proof and item-photo URLs are not guaranteed to be whitelisted for next/image. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photoUrl}
                            alt={`Request item photo ${index + 1}`}
                            className="h-16 w-16 rounded-xl object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  ) : null}
                  {request.clarificationMessage ? (
                    <p className="text-xs text-accent">
                      Clarification sent: {request.clarificationMessage}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-2 sm:min-w-[220px]">
                  <div className="rounded-xl border border-border bg-black/[0.02] p-3 dark:bg-white/[0.04]">
                    <p className="text-xs uppercase tracking-[0.16em] text-text-secondary">
                      Carrier payout
                    </p>
                    <p className="mt-1 text-sm font-medium text-text">
                      {formatCurrency(request.carrierPayoutCents)}
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">
                      Customer total {formatCurrency(request.requestedTotalPriceCents)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    className="min-h-[44px]"
                    disabled={busyId === `${request.id}:accept`}
                    onClick={() => void updateRequest(request, "accept")}
                  >
                    Accept
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-[44px]"
                    disabled={busyId === `${request.id}:clarify`}
                    onClick={() => setClarifyingRequestId(request.id)}
                  >
                    Request clarification
                  </Button>
                  <label className="grid gap-1">
                    <span className="text-xs uppercase tracking-[0.16em] text-text-secondary">
                      Decline reason
                    </span>
                    <select
                      className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
                      value={declineReasons[request.id] ?? declineOptions[0].value}
                      onChange={(event) =>
                        setDeclineReasons((current) => ({
                          ...current,
                          [request.id]: event.target.value,
                        }))
                      }
                    >
                      {declineOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-[44px]"
                    disabled={busyId === `${request.id}:decline`}
                    onClick={() => void updateRequest(request, "decline")}
                  >
                    Decline
                  </Button>
                </div>
              </div>
              <div className={compact ? "mt-3" : "mt-4"}>
                <RequestClarificationSheet
                  isOpen={clarifyingRequestId === request.id}
                  busy={busyId === `${request.id}:clarify`}
                  onClose={() => setClarifyingRequestId(null)}
                  onSubmit={(payload) => updateRequest(request, "clarify", payload)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
