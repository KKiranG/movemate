import { Suspense } from "react";
import Link from "next/link";

import { ErrorBoundary } from "@/components/shared/error-boundary";
import { requirePageSessionUser } from "@/lib/auth";
import { listUserBookings } from "@/lib/data/bookings";
import { PageIntro } from "@/components/layout/page-intro";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

async function BookingsListSection({ userId }: { userId: string }) {
  const bookings = await listUserBookings(userId);

  return (
    <div className="grid gap-4">
      {bookings.map((booking) => (
        <Link key={booking.id} href={`/bookings/${booking.id}`}>
          <Card className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg text-text">{booking.itemDescription}</h2>
                <p className="mt-2 subtle-text">
                  {booking.pickupAddress} to {booking.dropoffAddress}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm capitalize text-accent">
                  {booking.status.replace("_", " ")}
                </p>
                <p className="mt-1 font-medium text-text">
                  {formatCurrency(booking.pricing.totalPriceCents)}
                </p>
              </div>
            </div>
          </Card>
        </Link>
      ))}
      {bookings.length === 0 ? (
        <Card className="p-4">
          <p className="subtle-text">You have no bookings yet.</p>
        </Card>
      ) : null}
    </div>
  );
}

export default async function BookingsPage() {
  const user = await requirePageSessionUser();

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Bookings"
        title="Track your bookings"
        description="Statuses move from pending to completed with proof photos and customer confirmation before payout release."
      />

      <ErrorBoundary>
        <Suspense fallback={<Card className="p-4">Loading bookings...</Card>}>
          <BookingsListSection userId={user.id} />
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}
