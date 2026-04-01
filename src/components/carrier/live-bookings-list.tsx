"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Booking } from "@/types/booking";
import type { Database } from "@/types/database";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];

function toBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    bookingReference: row.booking_reference,
    listingId: row.listing_id,
    carrierId: row.carrier_id,
    customerId: row.customer_id,
    itemDescription: row.item_description,
    itemCategory: row.item_category,
    itemDimensions: row.item_dimensions,
    itemWeightKg: row.item_weight_kg,
    itemPhotoUrls: row.item_photo_urls ?? [],
    pickupAddress: row.pickup_address,
    pickupSuburb: row.pickup_suburb,
    pickupPostcode: row.pickup_postcode,
    dropoffAddress: row.dropoff_address,
    dropoffSuburb: row.dropoff_suburb,
    dropoffPostcode: row.dropoff_postcode,
    pickupAccessNotes: row.pickup_access_notes,
    dropoffAccessNotes: row.dropoff_access_notes,
    needsStairs: row.needs_stairs,
    needsHelper: row.needs_helper,
    status: row.status,
    pricing: {
      basePriceCents: row.base_price_cents,
      stairsFeeCents: row.stairs_fee_cents,
      helperFeeCents: row.helper_fee_cents,
      bookingFeeCents: row.booking_fee_cents,
      totalPriceCents: row.total_price_cents,
      carrierPayoutCents: row.carrier_payout_cents,
      platformCommissionCents: row.platform_commission_cents,
    },
    paymentStatus: row.payment_status,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    pickupProofPhotoUrl: row.pickup_proof_photo_url,
    deliveryProofPhotoUrl: row.delivery_proof_photo_url,
    customerConfirmedAt: row.customer_confirmed_at,
    cancelledAt: row.cancelled_at,
    cancellationReason: row.cancellation_reason,
    pendingExpiresAt: row.pending_expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    events: [],
  };
}

export function LiveBookingsList({
  carrierId,
  initialBookings,
}: {
  carrierId: string;
  initialBookings: Booking[];
}) {
  const [bookings, setBookings] = useState(initialBookings);
  const [isLive, setIsLive] = useState(false);
  const [newBookingCount, setNewBookingCount] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const knownBookingIdsRef = useRef(new Set(initialBookings.map((booking) => booking.id)));

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
    const channel = supabase
      .channel(`carrier-bookings:${carrierId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `carrier_id=eq.${carrierId}`,
        },
        async () => {
          const { data } = await supabase
            .from("bookings")
            .select("*")
            .eq("carrier_id", carrierId)
            .order("created_at", { ascending: false });

          if (!cancelled && data) {
            const nextBookings = (data as BookingRow[]).map(toBooking);
            const nextIds = new Set(nextBookings.map((booking) => booking.id));
            const additionalCount = nextBookings.filter(
              (booking) => !knownBookingIdsRef.current.has(booking.id),
            ).length;

            knownBookingIdsRef.current = nextIds;
            setNewBookingCount((current) => current + additionalCount);
            setBookings(nextBookings);
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
  }, [carrierId]);

  useEffect(() => {
    const element = containerRef.current;

    if (!element || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNewBookingCount(0);
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const statusCounts = useMemo(
    () =>
      bookings.reduce<Record<string, number>>((accumulator, booking) => {
        accumulator[booking.status] = (accumulator[booking.status] ?? 0) + 1;
        return accumulator;
      }, {}),
    [bookings],
  );

  return (
    <div ref={containerRef}>
      <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="section-label">Your Bookings</p>
            <h2 className="mt-1 text-lg text-text">Incoming jobs refresh automatically</h2>
            {newBookingCount > 0 ? (
              <p className="mt-2 inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-medium text-white">
                {newBookingCount} new booking request{newBookingCount === 1 ? "" : "s"}
              </p>
            ) : null}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium text-text-secondary">
            <span
              className={`h-2.5 w-2.5 rounded-full ${isLive ? "animate-pulse bg-success" : "bg-border"}`}
            />
            {isLive ? "Live" : "Offline"}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["pending", "confirmed", "in_transit", "disputed"] as const).map((status) => (
            <div key={status} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-text">
              <StatusBadge status={status} />
              <span>{statusCounts[status] ?? 0}</span>
            </div>
          ))}
        </div>

        <div className="grid gap-3">
          {bookings.map((booking) => (
            <Link
              key={booking.id}
              href={`/carrier/trips/${booking.listingId}`}
              className="block rounded-xl border border-border p-3 active:opacity-95"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-text">{booking.itemDescription}</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {booking.pickupAddress} to {booking.dropoffAddress}
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">
                    {booking.createdAt ? formatDateTime(booking.createdAt) : ""}
                  </p>
                </div>
                <div className="text-right">
                  <StatusBadge status={booking.status} className="justify-center" />
                  <p className="mt-1 text-sm text-text">
                    {formatCurrency(booking.pricing.totalPriceCents)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
          {bookings.length === 0 ? (
            <p className="subtle-text">No bookings yet. New jobs will appear here live.</p>
          ) : null}
        </div>
      </div>
      </Card>
    </div>
  );
}
