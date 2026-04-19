import Link from "next/link";

import { CollapsibleResults, EmptyStateCard, InfoCard, ResultCard } from "@/components/spec/cards";
import { TopAppBar } from "@/components/spec/chrome";
import { nearbyDateOffers, possibleOffers, topOffers } from "@/lib/spec-mocks";

export default function MoveResultsPage() {
  const hasTopMatches = topOffers.length > 0;

  return (
    <main className="pb-28">
      <TopAppBar title="Your matches" backHref="/move/new/access" rightHref="/" rightLabel="Close" />
      <section className="screen space-y-5">
        <div className="space-y-2">
          <p className="eyebrow">Newtown → Bondi Beach</p>
          <h1 className="heading">3 drivers going your way</h1>
          <p className="body text-[var(--text-secondary)]">
            3-seater sofa · Saturday · 2nd-floor pickup. Ranked by fit, route logic, and trust.
          </p>
          <Link
            href="/move/new/route"
            className="inline-flex min-h-[44px] min-w-[44px] items-center rounded-[var(--radius-pill)] border border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] px-3 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
          >
            Edit this move
          </Link>
        </div>

        {hasTopMatches ? (
          <>
            <div>
              <p className="eyebrow">Top matches</p>
              <div className="mt-3 space-y-3">
                {topOffers.map((offer) => (
                  <ResultCard key={offer.id} offer={offer} />
                ))}
              </div>
            </div>

            <CollapsibleResults title="Possible matches — needs approval" count={possibleOffers.length}>
              {possibleOffers.map((offer) => (
                <ResultCard key={offer.id} offer={offer} />
              ))}
            </CollapsibleResults>

            <CollapsibleResults title="Also available on nearby dates" count={nearbyDateOffers.length}>
              {nearbyDateOffers.map((offer) => (
                <ResultCard key={offer.id} offer={offer} />
              ))}
            </CollapsibleResults>

            <InfoCard
              title="Need a faster yes?"
              description="Use Fast Match to send the same fixed-price request to up to 3 drivers. First to accept wins."
              ctaLabel="Use Fast Match"
              href="/move/new/fastmatch"
            />
          </>
        ) : (
          <EmptyStateCard
            title="No direct matches yet"
            description="Alert the Network and we’ll notify relevant drivers on similar corridors right away."
            ctaHref="/move/alert"
            ctaLabel="Alert the Network"
          />
        )}
      </section>
    </main>
  );
}
