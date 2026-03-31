import { requirePageAdminUser } from "@/lib/auth";
import { listAdminBookings } from "@/lib/data/bookings";
import { PageIntro } from "@/components/layout/page-intro";
import { Card } from "@/components/ui/card";

export default async function AdminBookingsPage() {
  await requirePageAdminUser();
  const bookings = await listAdminBookings();

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Admin bookings"
        title="Monitor booking state changes"
        description="Operations can inspect all bookings, spot stuck states, and intervene when required."
      />

      <div className="grid gap-4">
        {bookings.map((booking) => (
          <Card key={booking.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg text-text">{booking.itemDescription}</h2>
                <p className="mt-2 subtle-text">{booking.pickupAddress}</p>
              </div>
              <span className="text-sm capitalize text-accent">
                {booking.status.replace("_", " ")}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
