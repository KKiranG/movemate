import type { Metadata } from "next";
import Link from "next/link";

import { PageIntro } from "@/components/layout/page-intro";
import { Card } from "@/components/ui/card";
import { requirePageSessionUser } from "@/lib/auth";
import { listCarrierBookings } from "@/lib/data/bookings";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Carrier requests",
  description: "Review open customer requests that still need a carrier decision.",
};

export default async function CarrierRequestsPage() {
  const user = await requirePageSessionUser();
  const bookings = await listCarrierBookings(user.id);
  const pendingRequests = bookings.filter((booking) => booking.status === "pending");

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Requests"
        title="Review the work that still needs a decision"
        description="This MVP shell uses pending booking records as the carrier request queue until the full booking-request model lands."
      />

      <div className="grid gap-4">
        {pendingRequests.map((booking) => (
          <Link
            key={booking.id}
            href={`/carrier/trips/${booking.listingId}?focus=${booking.id}#booking-${booking.id}`}
            className="block active:opacity-95"
          >
            <Card className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="section-label">Pending request</p>
                  <h2 className="mt-1 text-lg text-text">{booking.itemDescription}</h2>
                  <p className="mt-2 text-sm text-text-secondary">
                    {booking.pickupAddress} to {booking.dropoffAddress}
                  </p>
                  <p className="mt-2 text-sm text-text-secondary">{booking.bookingReference}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-accent">Needs decision</p>
                  <p className="mt-1 text-sm text-text">{formatCurrency(booking.pricing.totalPriceCents)}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}

        {pendingRequests.length === 0 ? (
          <Card className="p-4">
            <p className="section-label">Requests</p>
            <h2 className="mt-1 text-lg text-text">No open requests right now</h2>
            <p className="mt-2 text-sm text-text-secondary">
              When customers ask for space on your active trips, those decisions will appear here first.
            </p>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
