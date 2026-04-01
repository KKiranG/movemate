import { AdminBookingSupportPanel } from "@/components/admin/admin-booking-support-panel";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { requirePageAdminUser } from "@/lib/auth";
import { ADMIN_PAGE_SIZE } from "@/lib/constants";
import { getBookingPaymentStateSummary } from "@/lib/booking-presenters";
import { listAdminBookings } from "@/lib/data/bookings";
import { PageIntro } from "@/components/layout/page-intro";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams?: { q?: string; page?: string };
}) {
  await requirePageAdminUser();
  const query = searchParams?.q?.trim() ?? "";
  const page = Math.max(1, Number(searchParams?.page ?? "1") || 1);
  const bookings = await listAdminBookings({ query, page, pageSize: ADMIN_PAGE_SIZE });
  const hasNext = bookings.length === ADMIN_PAGE_SIZE;

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Admin bookings"
        title="Monitor booking state changes"
        description="Operations can inspect all bookings, spot stuck states, and intervene when required."
      />

      <div className="grid gap-4">
        <form className="grid gap-2 sm:max-w-md" method="get">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-text">Find by booking reference</span>
            <Input name="q" defaultValue={query} placeholder="MVR-2026-0421" />
          </label>
          <input type="hidden" name="page" value="1" />
          <Button type="submit" className="sm:w-fit">
            Search bookings
          </Button>
        </form>
        <AdminBookingSupportPanel bookings={bookings} query={query} />
        {bookings.map((booking) => (
          <Card key={booking.id} className="p-4">
            {(() => {
              const paymentSummary = getBookingPaymentStateSummary(booking);

              return (
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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
        <AdminPagination basePath="/admin/bookings" page={page} hasNext={hasNext} query={query} />
      </div>
    </main>
  );
}
