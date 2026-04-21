"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getBookingPaymentLifecycleLabel, getBookingPaymentStateSummary } from "@/lib/booking-presenters";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Booking } from "@/types/booking";

type CarrierTripBookingsPanelProps = {
  listingId: string;
  carrierId: string;
  initialBookings: Booking[];
  focusBookingId?: string | null;
  variant?: "detail" | "runsheet";
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

function getProofSummary(booking: Booking) {
  const pickupState =
    booking.pickupProofPhotoUrl
      ? "Pickup proof captured"
      : ["picked_up", "in_transit", "delivered", "completed"].includes(booking.status)
        ? "Pickup proof missing"
        : "Pickup proof still needed";

  const deliveryState =
    booking.deliveryProofPhotoUrl
      ? "Delivery proof captured"
      : ["delivered", "completed"].includes(booking.status)
        ? "Delivery proof missing"
        : "Delivery proof still needed";

  return { pickupState, deliveryState };
}

export function CarrierTripBookingsPanel({
  listingId,
  carrierId,
  initialBookings,
  focusBookingId,
  variant = "detail",
}: CarrierTripBookingsPanelProps) {
  const [bookings, setBookings] = useState(() =>
    filterTripBookings(initialBookings, listingId, variant),
  );
  const [isLive, setIsLive] = useState(false);
  const [newBookingCount, setNewBookingCount] = useState(0);
  const knownBookingIdsRef = useRef(new Set(initialBookings.map((booking) => booking.id)));

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
                  </div>
                </div>
              </div>
            );
          })}

          {bookings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-4">
              <p className="text-sm text-text-secondary">
                No bookings are attached to this trip yet. New accepted work will land here automatically.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
