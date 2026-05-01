"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getBookingPaymentLifecycleLabel, getBookingPaymentStateSummary } from "@/lib/booking-presenters";
import { getProofSummary } from "@/lib/booking-proof-ui";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Booking } from "@/types/booking";

type ProofCaptureStep =
  | "awaiting_confirmation"
  | "gps_acquiring"
  | "camera_ready"
  | "uploading"
  | "patching"
  | "error";

type ProofCaptureState = {
  bookingId: string;
  proofType: "pickup" | "delivery";
  step: ProofCaptureStep;
  confirmed: boolean;
  errorMessage?: string;
  uploadedPath?: string;
  gps?: { latitude: number; longitude: number };
};

const PROOF_BLOCKED_STATUSES: Booking["status"][] = ["disputed", "cancelled", "completed"];

type CarrierTripBookingsPanelProps = {
  listingId: string;
  carrierId: string;
  initialBookings: Booking[];
  focusBookingId?: string | null;
  variant?: "detail" | "runsheet";
  tripStatus?: "active" | "draft";
};

const detailStatusOrder: Record<Booking["status"], number> = {
  pending: 0,
  confirmed: 1,
  picked_up: 2,
  in_transit: 3,
  delivered: 4,
  completed: 5,
  disputed: 6,
  cancelled: 7,
};

const runsheetStatusOrder: Record<Booking["status"], number> = {
  confirmed: 0,
  picked_up: 1,
  in_transit: 2,
  delivered: 3,
  completed: 4,
  pending: 5,
  disputed: 6,
  cancelled: 7,
};

function buildMapHref(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function sortBookings(bookings: Booking[], variant: "detail" | "runsheet") {
  const statusOrder = variant === "runsheet" ? runsheetStatusOrder : detailStatusOrder;

  return [...bookings].sort((left, right) => {
    const statusDelta = statusOrder[left.status] - statusOrder[right.status];

    if (statusDelta !== 0) {
      return statusDelta;
    }

    const leftTime = new Date(left.createdAt ?? 0).getTime();
    const rightTime = new Date(right.createdAt ?? 0).getTime();

    return rightTime - leftTime;
  });
}

function filterTripBookings(bookings: Booking[], listingId: string, variant: "detail" | "runsheet") {
  return sortBookings(
    bookings.filter((booking) => booking.listingId === listingId),
    variant,
  );
}

function getBookingNextAction(booking: Booking) {
  switch (booking.status) {
    case "pending":
      return {
        title: "Watch the authorization hold",
        description: "Do not load this stop until MoveMate confirms the booking is no longer pending.",
      };
    case "confirmed":
      return {
        title: "Head to pickup",
        description: "This stop is confirmed. Capture pickup proof as soon as handoff is complete.",
      };
    case "picked_up":
      return {
        title: "Travel to dropoff",
        description: "Pickup is recorded. Delivery proof and recipient confirmation are next.",
      };
    case "in_transit":
      return {
        title: "Finish dropoff cleanly",
        description: "Keep delivery proof ready so payout release is not blocked later.",
      };
    case "delivered":
      return {
        title: "Wait for release steps",
        description: "Delivery is logged. Customer confirmation and payout release are the next system steps.",
      };
    case "completed":
      return {
        title: "Job complete",
        description: "Proof and payment are already far enough along for this stop to count as complete.",
      };
    case "disputed":
      return {
        title: "Keep evidence on-platform",
        description: "Do not resolve this off-platform. MoveMate needs the proof trail intact for support.",
      };
    case "cancelled":
      return {
        title: "Stop removed",
        description: "This booking is cancelled and should not stay on the active run.",
      };
    default:
      return {
        title: "Review stop",
        description: "Check the latest booking state before continuing.",
      };
  }
}


function ProofCaptureButton({
  label,
  proofType,
  captureState,
  onCapture,
  onConfirm,
  onRetry,
  onDismiss,
}: {
  label: string;
  proofType: "pickup" | "delivery";
  captureState: ProofCaptureState | null;
  onCapture: () => void;
  onConfirm: () => void;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  if (!captureState) {
    return (
      <button
        type="button"
        onClick={onCapture}
        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-md bg-[var(--brand-ink)] px-4 py-2 text-sm font-medium text-[var(--brand-paper)] hover:opacity-90 active:opacity-80"
      >
        {label}
      </button>
    );
  }

  if (captureState.step === "awaiting_confirmation") {
    const promptText =
      proofType === "pickup"
        ? "Confirm the customer handed over the items in person before you take the photo."
        : "Confirm the recipient acknowledged delivery before you take the photo.";

    return (
      <div className="space-y-2 rounded-md border border-border p-3">
        <label className="flex items-start gap-2 text-sm text-text">
          <input
            type="checkbox"
            checked={captureState.confirmed}
            onChange={onConfirm}
            className="mt-1 h-5 w-5"
          />
          <span>{promptText}</span>
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCapture}
            disabled={!captureState.confirmed}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-md bg-[var(--brand-ink)] px-4 py-2 text-sm font-medium text-[var(--brand-paper)] hover:opacity-90 active:opacity-80 disabled:opacity-40"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-md border border-border px-4 py-2 text-sm text-text-secondary hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (captureState.step === "gps_acquiring") {
    return (
      <div className="rounded-md border border-border px-4 py-3 text-sm text-text-secondary">
        Locating you…
      </div>
    );
  }

  if (captureState.step === "camera_ready") {
    return (
      <div className="rounded-md border border-border px-4 py-3 text-sm text-text-secondary">
        Opening camera…
      </div>
    );
  }

  if (captureState.step === "uploading") {
    return (
      <div className="rounded-md border border-border px-4 py-3 text-sm text-text-secondary">
        Uploading photo…
      </div>
    );
  }

  if (captureState.step === "patching") {
    return (
      <div className="rounded-md border border-border px-4 py-3 text-sm text-text-secondary">
        Saving proof…
      </div>
    );
  }

  if (captureState.step === "error") {
    return (
      <div className="space-y-2">
        <p className="text-xs text-warning">{captureState.errorMessage}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-md bg-[var(--brand-ink)] px-4 py-2 text-sm font-medium text-[var(--brand-paper)] hover:opacity-90 active:opacity-80"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-md border border-border px-4 py-2 text-sm text-text-secondary hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export function CarrierTripBookingsPanel({
  listingId,
  carrierId,
  initialBookings,
  focusBookingId,
  variant = "detail",
  tripStatus = "active",
}: CarrierTripBookingsPanelProps) {
  const [bookings, setBookings] = useState(() =>
    filterTripBookings(initialBookings, listingId, variant),
  );
  const [isLive, setIsLive] = useState(false);
  const [newBookingCount, setNewBookingCount] = useState(0);
  const [proofCapture, setProofCapture] = useState<ProofCaptureState | null>(null);
  const knownBookingIdsRef = useRef(new Set(initialBookings.map((booking) => booking.id)));
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const nextBookings = filterTripBookings(initialBookings, listingId, variant);
    setBookings(nextBookings);
    knownBookingIdsRef.current = new Set(nextBookings.map((booking) => booking.id));
  }, [initialBookings, listingId, variant]);

  useEffect(() => {
    if (!focusBookingId) {
      return;
    }

    const element = document.getElementById(`booking-${focusBookingId}`);

    if (!element) {
      return;
    }

    element.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [bookings, focusBookingId]);

  useEffect(() => {
    if (
      !carrierId ||
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return;
    }

    let cancelled = false;
    const supabase = createClient();
    const refreshBookings = async () => {
      const response = await fetch("/api/carrier/bookings/live", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { bookings?: Booking[] };
      const nextBookings = filterTripBookings(payload.bookings ?? [], listingId, variant);
      const nextIds = new Set(nextBookings.map((booking) => booking.id));
      const additionalCount = nextBookings.filter(
        (booking) => !knownBookingIdsRef.current.has(booking.id),
      ).length;

      knownBookingIdsRef.current = nextIds;
      setNewBookingCount((current) => current + additionalCount);
      setBookings(nextBookings);
    };
    const channel = supabase
      .channel(`carrier-trip-bookings:${carrierId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `carrier_id=eq.${carrierId}`,
        },
        async () => {
          if (!cancelled) {
            await refreshBookings();
          }
        },
      )
      .subscribe((status) => {
        if (!cancelled) {
          setIsLive(status === "SUBSCRIBED");
        }
      });

    return () => {
      cancelled = true;
      setIsLive(false);
      supabase.removeChannel(channel);
    };
  }, [carrierId, listingId, variant]);

  function startProofConsent(booking: Booking, proofType: "pickup" | "delivery") {
    setProofCapture({
      bookingId: booking.id,
      proofType,
      step: "awaiting_confirmation",
      confirmed: false,
    });
  }

  function toggleProofConsent() {
    setProofCapture((current) =>
      current && current.step === "awaiting_confirmation"
        ? { ...current, confirmed: !current.confirmed }
        : current,
    );
  }

  function startProofCapture(booking: Booking, proofType: "pickup" | "delivery") {
    setProofCapture((current) => {
      const previousConfirmed =
        current?.bookingId === booking.id && current.proofType === proofType
          ? current.confirmed
          : false;
      if (!previousConfirmed) {
        return current;
      }
      return {
        bookingId: booking.id,
        proofType,
        step: "gps_acquiring",
        confirmed: true,
      };
    });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const gps = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        setProofCapture((current) =>
          current?.bookingId === booking.id
            ? { ...current, step: "camera_ready", gps }
            : current,
        );
        fileInputRef.current?.click();
      },
      (err) => {
        const msg =
          err.code === 1
            ? "Location access denied. Enable location in Settings and try again."
            : err.code === 3
              ? "Location timed out. Move to an area with better signal and try again."
              : "Location unavailable. Try again or move to a different area.";
        setProofCapture((current) =>
          current?.bookingId === booking.id ? { ...current, step: "error", errorMessage: msg } : current,
        );
      },
      { maximumAge: 30000, timeout: 15000 },
    );
  }

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !proofCapture || proofCapture.step === "error") return;

    const capture = proofCapture;
    const booking = bookings.find((b) => b.id === capture.bookingId);
    if (!booking || !capture.gps) return;

    // Reset input so the same file can be re-selected on retry
    event.target.value = "";

    setProofCapture((c) => c ? { ...c, step: "uploading" } : c);

    let uploadedPath = capture.uploadedPath;

    if (!uploadedPath) {
      const formData = new FormData();
      formData.append("file", file);
      const uploadResponse = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadResponse.ok) {
        setProofCapture((c) =>
          c ? { ...c, step: "error", errorMessage: "Photo upload failed. Tap Retry to try again." } : c,
        );
        return;
      }
      const uploadPayload = (await uploadResponse.json()) as { path?: string };
      uploadedPath = uploadPayload.path;
      if (!uploadedPath) {
        setProofCapture((c) =>
          c ? { ...c, step: "error", errorMessage: "Upload did not return a path. Tap Retry." } : c,
        );
        return;
      }
      setProofCapture((c) => c ? { ...c, uploadedPath } : c);
    }

    setProofCapture((c) => c ? { ...c, step: "patching" } : c);

    const isPickup = capture.proofType === "pickup";
    const proofPack = isPickup
      ? {
          photoUrl: uploadedPath,
          itemCount: 1,
          condition: "no_visible_damage" as const,
          handoffConfirmed: true as const,
          capturedAt: new Date().toISOString(),
          latitude: capture.gps.latitude,
          longitude: capture.gps.longitude,
        }
      : {
          photoUrl: uploadedPath,
          recipientConfirmed: true as const,
          capturedAt: new Date().toISOString(),
          latitude: capture.gps.latitude,
          longitude: capture.gps.longitude,
        };

    const patchResponse = await fetch(`/api/bookings/${booking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isPickup ? { pickupProof: proofPack } : { deliveryProof: proofPack }),
    });

    if (!patchResponse.ok) {
      setProofCapture((c) =>
        c ? { ...c, step: "error", errorMessage: "Could not save proof. Tap Retry — photo is already uploaded." } : c,
      );
      return;
    }

    setProofCapture(null);
  }

  async function handleRetryPatch(booking: Booking, capture: ProofCaptureState) {
    if (!capture.uploadedPath || !capture.gps) return;
    const isPickup = capture.proofType === "pickup";
    const proofPack = isPickup
      ? {
          photoUrl: capture.uploadedPath,
          itemCount: 1,
          condition: "no_visible_damage" as const,
          handoffConfirmed: true as const,
          capturedAt: new Date().toISOString(),
          latitude: capture.gps.latitude,
          longitude: capture.gps.longitude,
        }
      : {
          photoUrl: capture.uploadedPath,
          recipientConfirmed: true as const,
          capturedAt: new Date().toISOString(),
          latitude: capture.gps.latitude,
          longitude: capture.gps.longitude,
        };

    const response = await fetch(`/api/bookings/${booking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isPickup ? { pickupProof: proofPack } : { deliveryProof: proofPack }),
    });

    if (!response.ok) {
      setProofCapture((c) =>
        c ? { ...c, step: "error", errorMessage: "Save failed again. Try again or contact support." } : c,
      );
      return;
    }
    setProofCapture(null);
  }

  const statusCounts = bookings.reduce<Record<string, number>>((accumulator, booking) => {
    accumulator[booking.status] = (accumulator[booking.status] ?? 0) + 1;
    return accumulator;
  }, {});

  const title =
    variant === "runsheet"
      ? "Stops and proof states update live"
      : "Bookings on this trip update live";
  const description =
    variant === "runsheet"
      ? "Use these stop cards while you are on the road. The next action and proof risk stay visible first."
      : "Keep each booking’s payment, proof, and next operational step in one queue.";

  return (
    <Card className="p-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/heic,image/heic-sequence,image/jpeg,image/png,image/*"
        capture="environment"
        className="sr-only"
        onChange={handleFileSelected}
      />
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="section-label">{variant === "runsheet" ? "Runsheet stops" : "Trip bookings"}</p>
            <h2 className="mt-1 text-lg text-text">{title}</h2>
            <p className="mt-1 text-sm text-text-secondary">{description}</p>
            {newBookingCount > 0 ? (
              <p className="mt-2 inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-medium text-white">
                {newBookingCount} new booking{newBookingCount === 1 ? "" : "s"} on this trip
              </p>
            ) : null}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium text-text-secondary">
            <span className={`h-2.5 w-2.5 rounded-full ${isLive ? "animate-pulse bg-success" : "bg-border"}`} />
            {isLive ? "Live" : "Offline"}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["pending", "confirmed", "picked_up", "in_transit", "delivered"] as const).map((status) => (
            <div
              key={status}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-text"
            >
              <StatusBadge status={status} />
              <span>{statusCounts[status] ?? 0}</span>
            </div>
          ))}
        </div>

        <div className="grid gap-3">
          {bookings.map((booking) => {
            const paymentSummary = getBookingPaymentStateSummary(booking);
            const paymentLabel = getBookingPaymentLifecycleLabel(booking);
            const nextAction = getBookingNextAction(booking);
            const proofSummary = getProofSummary(booking);
            const isFocused = focusBookingId === booking.id;

            return (
              <div
                key={booking.id}
                id={`booking-${booking.id}`}
                className={`rounded-xl border p-4 transition-colors ${
                  isFocused
                    ? "border-accent bg-accent/5 shadow-[0_0_0_1px_rgba(201,82,28,0.08)]"
                    : "border-border"
                }`}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={booking.status} />
                      <p className="text-sm font-medium text-text">
                        {booking.bookingReference || booking.itemDescription}
                      </p>
                      <p className="text-xs uppercase tracking-[0.16em] text-text-secondary">
                        {paymentLabel}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-text">{booking.itemDescription}</h3>
                      <p className="mt-1 text-sm text-text-secondary">
                        {booking.pickupAddress} to {booking.dropoffAddress}
                      </p>
                      {booking.createdAt ? (
                        <p className="mt-1 text-xs text-text-secondary">
                          Booked {formatDateTime(booking.createdAt)}
                        </p>
                      ) : null}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-xl border border-border bg-black/[0.02] p-3 dark:bg-white/[0.04]">
                        <p className="text-xs uppercase tracking-[0.16em] text-text-secondary">Next action</p>
                        <p className="mt-1 text-sm font-medium text-text">{nextAction.title}</p>
                        <p className="mt-1 text-sm text-text-secondary">{nextAction.description}</p>
                      </div>
                      <div className="rounded-xl border border-border bg-black/[0.02] p-3 dark:bg-white/[0.04]">
                        <p className="text-xs uppercase tracking-[0.16em] text-text-secondary">Payment state</p>
                        <p className="mt-1 text-sm font-medium text-text">{paymentSummary.title}</p>
                        <p className="mt-1 text-sm text-text-secondary">{paymentSummary.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-text-secondary">
                      <span className="rounded-full border border-border px-3 py-1">
                        {proofSummary.pickupState}
                      </span>
                      <span className="rounded-full border border-border px-3 py-1">
                        {proofSummary.deliveryState}
                      </span>
                      <span className="rounded-full border border-border px-3 py-1">
                        Customer total {formatCurrency(booking.pricing.totalPriceCents)}
                      </span>
                      <span className="rounded-full border border-border px-3 py-1">
                        Carrier payout {formatCurrency(booking.pricing.carrierPayoutCents)}
                      </span>
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-2 lg:w-[220px]">
                    <Button asChild variant="secondary" size="sm">
                      <a href={buildMapHref(booking.pickupAddress)} target="_blank" rel="noreferrer">
                        Open pickup map
                      </a>
                    </Button>
                    <Button asChild variant="secondary" size="sm">
                      <a href={buildMapHref(booking.dropoffAddress)} target="_blank" rel="noreferrer">
                        Open dropoff map
                      </a>
                    </Button>
                    {variant === "runsheet" ? (
                      <Button asChild size="sm">
                        <Link href={`/carrier/trips/${listingId}?focus=${booking.id}#booking-${booking.id}`}>
                          Open full booking
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild size="sm">
                        <Link href={`/carrier/trips/${listingId}/runsheet#booking-${booking.id}`}>
                          Open in runsheet
                        </Link>
                      </Button>
                    )}
                    {PROOF_BLOCKED_STATUSES.includes(booking.status) ? (
                      <p className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-text-secondary">
                        Proof capture is locked for {booking.status} bookings. Contact support if you need to amend evidence.
                      </p>
                    ) : null}
                    {["confirmed"].includes(booking.status) && !booking.pickupProofPhotoUrl ? (
                      <ProofCaptureButton
                        label="Capture pickup proof"
                        proofType="pickup"
                        captureState={proofCapture?.bookingId === booking.id && proofCapture?.proofType === "pickup" ? proofCapture : null}
                        onCapture={() => {
                          if (!proofCapture || proofCapture.step !== "awaiting_confirmation") {
                            startProofConsent(booking, "pickup");
                            return;
                          }
                          startProofCapture(booking, "pickup");
                        }}
                        onConfirm={toggleProofConsent}
                        onRetry={() => {
                          if (proofCapture?.uploadedPath) {
                            setProofCapture((c) => c ? { ...c, step: "patching", errorMessage: undefined } : c);
                            void handleRetryPatch(booking, proofCapture);
                          } else {
                            startProofConsent(booking, "pickup");
                          }
                        }}
                        onDismiss={() => setProofCapture(null)}
                      />
                    ) : null}
                    {["picked_up", "in_transit"].includes(booking.status) && !booking.deliveryProofPhotoUrl ? (
                      <ProofCaptureButton
                        label="Capture delivery proof"
                        proofType="delivery"
                        captureState={proofCapture?.bookingId === booking.id && proofCapture?.proofType === "delivery" ? proofCapture : null}
                        onCapture={() => {
                          if (!proofCapture || proofCapture.step !== "awaiting_confirmation") {
                            startProofConsent(booking, "delivery");
                            return;
                          }
                          startProofCapture(booking, "delivery");
                        }}
                        onConfirm={toggleProofConsent}
                        onRetry={() => {
                          if (proofCapture?.uploadedPath) {
                            setProofCapture((c) => c ? { ...c, step: "patching", errorMessage: undefined } : c);
                            void handleRetryPatch(booking, proofCapture);
                          } else {
                            startProofConsent(booking, "delivery");
                          }
                        }}
                        onDismiss={() => setProofCapture(null)}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}

          {bookings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center">
              {tripStatus === "draft" ? (
                <>
                  <p className="text-sm font-medium text-text">Trip is not published yet</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    Publish this trip so customers can see it and book stops.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-text">No bookings yet</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    This trip is live. New accepted bookings will appear here automatically.
                  </p>
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
