import Link from "next/link";

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
          <p className="title">Continue to submit request</p>
          <Button className="w-full">Continue with Apple</Button>
          <Button className="w-full" variant="secondary">
            Continue with Google
          </Button>
          <Button asChild className="w-full" variant="secondary">
            <Link href="/auth/login">Use phone code</Link>
          </Button>
        </div>

        <div className="surface-1">
          <p className="caption">[Stripe Payment Element placeholder]</p>
        </div>

        <Button asChild className="w-full">
          <Link href={`/move/new/book/${params.offerId}/submitted`}>Submit request</Link>
        </Button>
      </section>
    </main>
  );
}
