import Link from "next/link";
import { ShieldCheck, Star } from "lucide-react";

import { PriceBreakdown } from "@/components/spec/cards";
import { AmbientMap, TopAppBar } from "@/components/spec/chrome";
import { StickyCta } from "@/components/spec/wizard";
import { standardPriceLines, topOffers } from "@/lib/spec-mocks";
import { Button } from "@/components/ui/button";

export default function OfferDetailPage({ params }: { params: { offerId: string } }) {
  const offer = topOffers.find((item) => item.id === params.offerId) ?? topOffers[0];

  return (
    <main className="pb-28">
      <TopAppBar title={null} backHref="/move/new/results" rightHref="/move/new/fastmatch" rightLabel="Fast Match" />
      <div className="h-[31vh] min-h-[240px] overflow-hidden">
        <AmbientMap />
      </div>

      <section className="screen space-y-4">
        <div className="space-y-2">
          <p className="tabular text-[38px] font-semibold leading-none tracking-[-0.05em]">{offer.total}</p>
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
            all-in
          </p>
          <p className="body text-[var(--text-secondary)]">
            Lower than a dedicated removalist because this driver is already travelling your route on Saturday.
          </p>
        </div>

        <Button asChild variant="secondary" className="w-full justify-start">
          <Link href="/move/new/fastmatch">Add this driver to Fast Match</Link>
        </Button>

        <div className="surface-1">
          <p className="eyebrow">Driver</p>
          <div className="mt-2 flex items-start justify-between gap-3">
            <div>
              <p className="title">{offer.carrierName}</p>
              <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Carrier since Aug 2024 · 72 trips</p>
            </div>
            <div className="flex items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--bg-elevated-2)] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-secondary)]">
              <ShieldCheck className="h-4 w-4" />
              Verified
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-[var(--radius-md)] bg-[var(--bg-elevated-2)] p-3 text-center">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Rating</p>
              <p className="mt-2 flex items-center justify-center gap-1 text-[18px] font-semibold">
                <Star className="h-4 w-4 fill-current" />
                4.9
              </p>
            </div>
            <div className="rounded-[var(--radius-md)] bg-[var(--bg-elevated-2)] p-3 text-center">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Trips</p>
              <p className="mt-2 text-[18px] font-semibold">72</p>
            </div>
            <div className="rounded-[var(--radius-md)] bg-[var(--bg-elevated-2)] p-3 text-center">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Replies</p>
              <p className="mt-2 text-[18px] font-semibold">&lt; 2h</p>
            </div>
          </div>
        </div>

        <div className="surface-1">
          <p className="eyebrow">Why this works</p>
          <p className="title mt-2">{offer.why}</p>
          <p className="mt-2 text-[14px] leading-6 text-[var(--text-secondary)]">
            {offer.route} · {offer.schedule}. The route fit is strong enough that you’re not paying dedicated-trip pricing.
          </p>
        </div>

        <div className="surface-1">
          <p className="eyebrow">Vehicle & fit</p>
          <p className="title mt-2">{offer.vehicle}</p>
          <p className="mt-2 text-[14px] leading-6 text-[var(--text-secondary)]">
            Fits most furniture. Max item length 2m. Ground floor and 1–2 flights are usually okay.
          </p>
        </div>

        <div>
          <p className="eyebrow mb-2">Price breakdown</p>
          <PriceBreakdown lines={standardPriceLines} total="$101.20" />
        </div>

        <div className="surface-1 space-y-2">
          <p className="eyebrow">What happens next</p>
          <p className="caption">Payment is authorised now and only captured if this driver accepts.</p>
          <p className="caption">Delivery proof is uploaded by the carrier and payout only releases after confirmation.</p>
        </div>
      </section>

      <StickyCta href={`/move/new/book/${params.offerId}/item`} label={`Request ${offer.carrierName} — ${offer.total}`} />
    </main>
  );
}
