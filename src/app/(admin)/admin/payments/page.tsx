import { PageIntro } from "@/components/layout/page-intro";
import { Card } from "@/components/ui/card";
import { requirePageAdminUser } from "@/lib/auth";
import { listAdminBookings } from "@/lib/data/bookings";

export default async function AdminPaymentsPage() {
  await requirePageAdminUser();
  const bookings = await listAdminBookings({ pageSize: 200 });

  const paymentIntentFailures = bookings.filter((booking) => booking.paymentStatus === "failed");
  const authorizationCancelled = bookings.filter(
    (booking) => booking.paymentStatus === "authorization_cancelled",
  );
  const refundOutcomes = bookings.filter((booking) => booking.paymentStatus === "refunded");
  const creationFailures = bookings.filter((booking) => booking.events?.some((event) => event.eventType === "payment_intent_create_failed"));
  const webhookFailures = bookings.filter((booking) => booking.events?.some((event) => event.eventType.includes("webhook_failed")));

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Payments"
        title="Revenue-impacting failures in one place"
        description="This page turns payment and booking friction into a quick scan instead of a hunt across Stripe and logs."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="p-4">
          <p className="section-label">Intent failures</p>
          <p className="mt-2 text-3xl text-text">{paymentIntentFailures.length}</p>
        </Card>
        <Card className="p-4">
          <p className="section-label">Authorization cancelled</p>
          <p className="mt-2 text-3xl text-text">{authorizationCancelled.length}</p>
        </Card>
        <Card className="p-4">
          <p className="section-label">Refund outcomes</p>
          <p className="mt-2 text-3xl text-text">{refundOutcomes.length}</p>
        </Card>
        <Card className="p-4">
          <p className="section-label">Create-intent errors</p>
          <p className="mt-2 text-3xl text-text">{creationFailures.length}</p>
        </Card>
        <Card className="p-4">
          <p className="section-label">Webhook failures</p>
          <p className="mt-2 text-3xl text-text">{webhookFailures.length}</p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <p className="section-label">Recent payment issues</p>
            <h2 className="mt-1 text-lg text-text">Bookings that need ops attention</h2>
          </div>
          <div className="grid gap-3">
            {[...paymentIntentFailures, ...authorizationCancelled, ...refundOutcomes]
              .slice(0, 20)
              .map((booking) => (
                <div key={booking.id} className="rounded-xl border border-border p-3">
                  <p className="text-sm font-medium text-text">{booking.bookingReference}</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {booking.paymentStatus} · {booking.paymentFailureReason ?? "No failure reason recorded"}
                  </p>
                </div>
              ))}
            {paymentIntentFailures.length + authorizationCancelled.length + refundOutcomes.length === 0 ? (
              <p className="subtle-text">No payment issues surfaced in the current booking sample.</p>
            ) : null}
          </div>
        </div>
      </Card>
    </main>
  );
}
