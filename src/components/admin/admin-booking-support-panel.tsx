"use client";

import type { Booking } from "@/types/booking";

import { Card } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { CopyTextButton } from "@/components/admin/copy-text-button";
import { getBookingPaymentStateSummary } from "@/lib/booking-presenters";
import { formatCurrency } from "@/lib/utils";

function buildCopyText(booking: Booking) {
  return [
    `Reference: ${booking.bookingReference}`,
    `Status: ${booking.status.replaceAll("_", " ")}`,
    `Item: ${booking.itemDescription}`,
    `Route: ${booking.pickupSuburb ?? booking.pickupAddress} -> ${booking.dropoffSuburb ?? booking.dropoffAddress}`,
    `Total: ${formatCurrency(booking.pricing.totalPriceCents)}`,
  ].join("\n");
}

export function AdminBookingSupportPanel({
  bookings,
  query,
}: {
  bookings: Booking[];
  query: string;
}) {
  const highlighted = bookings.slice(0, 3);

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="section-label">Support quick view</p>
            <h2 className="mt-1 text-lg text-text">Fast booking lookup and copy actions</h2>
            <p className="mt-1 text-sm text-text-secondary">
              {query
                ? `Showing the current result set for ${query}.`
                : "Search by booking reference first. Email search needs backend support and is tracked separately."}
            </p>
          </div>
          <Badge className="border-accent/20 bg-accent/10 text-accent">
            {bookings.length} visible
          </Badge>
        </div>

        {highlighted.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-3">
            {highlighted.map((booking) => {
              const paymentSummary = getBookingPaymentStateSummary(booking);

              return (
                <Card key={booking.id} className="border-border/80 p-3">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
                          {booking.bookingReference}
                        </p>
                        <p className="mt-1 text-sm font-medium text-text">
                          {booking.itemDescription}
                        </p>
                      </div>
                      <StatusBadge status={booking.status} className="shrink-0" />
                    </div>

                    <div className="space-y-1 text-sm text-text-secondary">
                      <p>{booking.pickupSuburb ?? booking.pickupAddress}</p>
                      <p>{booking.dropoffSuburb ?? booking.dropoffAddress}</p>
                      <p>{paymentSummary.badge}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <CopyTextButton text={buildCopyText(booking)} label="Copy summary" />
                      <CopyTextButton
                        text={booking.bookingReference}
                        label="Copy reference"
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="subtle-text">
            No bookings match the current filters. Use the search field to narrow by reference.
          </p>
        )}
      </div>
    </Card>
  );
}
