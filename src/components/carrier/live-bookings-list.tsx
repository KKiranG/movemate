"use client";

import { useEffect, useState } from "react";

import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, slugToLabel } from "@/lib/utils";
import type { Booking } from "@/types/booking";
import type { Database } from "@/types/database";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];

function toBooking(row: BookingRow): Booking {
  return {
    id: row.id,
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
            setBookings((data as BookingRow[]).map(toBooking));
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

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="section-label">Your Bookings</p>
            <h2 className="mt-1 text-lg text-text">Incoming jobs refresh automatically</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium text-text-secondary">
            <span
              className={`h-2.5 w-2.5 rounded-full ${isLive ? "animate-pulse bg-success" : "bg-border"}`}
            />
            {isLive ? "Live" : "Offline"}
          </div>
        </div>

        <div className="grid gap-3">
          {bookings.map((booking) => (
            <div key={booking.id} className="rounded-xl border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-text">{booking.itemDescription}</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {booking.pickupAddress} to {booking.dropoffAddress}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-accent">
                    {slugToLabel(booking.status)}
                  </p>
                  <p className="mt-1 text-sm text-text">
                    {formatCurrency(booking.pricing.totalPriceCents)}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {bookings.length === 0 ? (
            <p className="subtle-text">No bookings yet. New jobs will appear here live.</p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
