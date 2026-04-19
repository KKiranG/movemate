import Link from "next/link";

import { ResultCard } from "@/components/spec/cards";
import { TopAppBar } from "@/components/spec/chrome";
import { topOffers } from "@/lib/spec-mocks";
import { Button } from "@/components/ui/button";

export default function FastMatchPage() {
  return (
    <main className="pb-8">
      <TopAppBar title="Fast Match" backHref="/move/new/results" />
      <section className="screen space-y-5">
        <div className="space-y-2">
          <p className="eyebrow">First accept wins</p>
          <h1 className="heading">Send the same request to up to 3 drivers</h1>
          <p className="body text-[var(--text-secondary)]">
            The price stays fixed. This is not bidding and it doesn’t create a negotiation thread.
          </p>
        </div>

        {topOffers.slice(0, 3).map((offer) => (
          <div key={offer.id} className="space-y-2 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated-2)] p-2">
            <label className="flex min-h-[44px] min-w-[44px] items-center gap-2 px-2 text-[13px] font-medium text-[var(--text-secondary)]">
              <input type="checkbox" defaultChecked className="h-4 w-4" />
              Selected for Fast Match
            </label>
            <ResultCard offer={offer} />
          </div>
        ))}

        <Button asChild className="w-full">
          <Link href="/move/new/book/offer-james/item">Confirm details and send</Link>
        </Button>
      </section>
    </main>
  );
}
