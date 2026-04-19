import Link from "next/link";

import { TopAppBar } from "@/components/spec/chrome";
import { Button } from "@/components/ui/button";

export default function BookAccessPage({ params }: { params: { offerId: string } }) {
  return (
    <main>
      <TopAppBar title="Confirm access" backHref={`/move/new/book/${params.offerId}/item`} />
      <section className="screen space-y-4">
        <input className="ios-input" placeholder="Exact pickup address" />
        <input className="ios-input" placeholder="Exact drop-off address" />

        <div className="surface-1 space-y-2">
          <p className="caption">Stairs at pickup: None</p>
          <p className="caption">Stairs at drop-off: 1-2 flights</p>
          <p className="caption">Lift available: No</p>
          <p className="caption">Help available: No</p>
          <p className="caption">Parking: Easy</p>
          <p className="caption text-[var(--accent)]">Price update: +$10 for stairs at drop-off</p>
        </div>

        <div className="surface-1 space-y-3">
          <p className="title">Optional contacts</p>
          <input className="ios-input" placeholder="Pickup contact name" />
          <input className="ios-input" placeholder="Pickup contact phone" />
          <input className="ios-input" placeholder="Drop-off contact name" />
          <input className="ios-input" placeholder="Drop-off contact phone" />
        </div>

        <Button asChild className="w-full">
          <Link href={`/move/new/book/${params.offerId}/price`}>Continue</Link>
        </Button>
      </section>
    </main>
  );
}
