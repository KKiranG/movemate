import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { TopAppBar } from "@/components/spec/chrome";
import { Button } from "@/components/ui/button";

export default function BookPayPage({ params }: { params: { offerId: string } }) {
  return (
    <main>
      <TopAppBar title="Payment" backHref={`/move/new/book/${params.offerId}/price`} />
      <section className="screen space-y-4">
        <h1 className="heading">Pay securely</h1>
        <p className="body text-[var(--text-secondary)]">
          Your card will be held, not charged until the carrier accepts. If they decline, you won&apos;t be charged.
        </p>

        <div className="surface-1 space-y-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-[var(--text-primary)]" />
            <div>
              <p className="title">Payment authorisation required</p>
              <p className="caption">
                Secure card authorisation is temporarily unavailable, so this request cannot be submitted yet.
              </p>
            </div>
          </div>
        </div>

        <Button className="w-full" disabled>
          Submit request
        </Button>
        <Button asChild className="w-full" variant="secondary">
          <Link href={`/move/new/book/${params.offerId}/price`}>Back to price</Link>
        </Button>
      </section>
    </main>
  );
}
