import { requirePageAdminUser } from "@/lib/auth";
import { getBookingPaymentStateSummary } from "@/lib/booking-presenters";
import { listAdminBookings } from "@/lib/data/bookings";
import { PageIntro } from "@/components/layout/page-intro";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  await requirePageAdminUser();
  const query = searchParams?.q?.trim() ?? "";
  const bookings = await listAdminBookings({ query });

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Admin bookings"
        title="Monitor booking state changes"
        description="Operations can inspect all bookings, spot stuck states, and intervene when required."
      />

      <div className="grid gap-4">
        <form className="grid gap-2 sm:max-w-sm">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-text">Find by booking reference</span>
            <Input name="q" defaultValue={query} placeholder="MVR-2026-0421" />
          </label>
        </form>
        {bookings.map((booking) => (
          <Card key={booking.id} className="p-4">
            {(() => {
              const paymentSummary = getBookingPaymentStateSummary(booking);

              return (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg text-text">{booking.itemDescription}</h2>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-text-secondary">
                      {booking.bookingReference}
                    </p>
                    <p className="mt-2 subtle-text">{booking.pickupAddress}</p>
                    <p className="mt-2 text-sm text-text-secondary">
                      {paymentSummary.badge} · {paymentSummary.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm capitalize text-accent">
                      {booking.status.replace("_", " ")}
                    </span>
                    {booking.cancellationReasonCode ? (
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-text-secondary">
                        {booking.cancellationReasonCode.replace(/_/g, " ")}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })()}
          </Card>
        ))}
        {bookings.length === 0 ? (
          <Card className="p-4">
            <p className="subtle-text">
              {query ? `No bookings found for ${query}.` : "No bookings yet."}
            </p>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
