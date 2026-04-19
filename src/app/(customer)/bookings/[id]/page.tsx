import { Button } from "@/components/ui/button";
import { Timeline } from "@/components/spec/cards";
import { TopAppBar } from "@/components/spec/chrome";
import { bookingTimeline } from "@/lib/spec-mocks";

export default function BookingLiveViewPage() {
  return (
    <main className="pb-8">
      <TopAppBar title="Your move" backHref="/activity" rightHref="/inbox/booking-demo-booking" rightLabel="Inbox" />
      <section className="screen space-y-4">
        <div className="surface-1 space-y-2">
          <p className="eyebrow">Status</p>
          <h1 className="title">Daniel is on the way to you</h1>
          <p className="caption">ETA 20 min · Toyota Hiace · proof required on delivery</p>
        </div>

        <Timeline steps={bookingTimeline} />

        <div className="surface-1">
          <p className="eyebrow">Booking summary</p>
          <p className="mt-2 title">3-seater sofa · Newtown → Bondi</p>
          <p className="mt-1 caption">Total all-in: <span className="tabular">$101.20</span></p>
        </div>

        <Button variant="secondary" className="w-full">
          Structured updates
        </Button>
        <Button variant="ghost" className="w-full text-[var(--danger)]">
          Cancel booking
        </Button>
      </section>
    </main>
  );
}
