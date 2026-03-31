import Link from "next/link";

import { PageIntro } from "@/components/layout/page-intro";
import { Card } from "@/components/ui/card";

export default function BookingNotFound() {
  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Booking missing"
        title="This booking could not be found"
        description="It may belong to a different account or no longer be accessible."
      />
      <Card className="p-4">
        <p className="subtle-text">
          Return to your bookings list to keep working from an authorized booking.
        </p>
        <Link href="/bookings" className="mt-3 inline-flex text-sm font-medium text-accent">
          Back to bookings
        </Link>
      </Card>
    </main>
  );
}
