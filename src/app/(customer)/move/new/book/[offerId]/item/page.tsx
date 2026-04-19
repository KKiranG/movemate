import Link from "next/link";

import { TopAppBar } from "@/components/spec/chrome";
import { Button } from "@/components/ui/button";

export default function BookItemPage({ params }: { params: { offerId: string } }) {
  return (
    <main>
      <TopAppBar title="Confirm your item" backHref={`/move/new/results/${params.offerId}`} />
      <section className="screen space-y-4">
        <div className="surface-1 space-y-2">
          <p className="caption">Category: Large furniture → Sofa</p>
          <p className="caption">Variant: 3-seater</p>
          <p className="caption">Quantity: 1</p>
        </div>
        <div className="surface-1">
          <p className="title">Photos (required for this item)</p>
          <p className="caption mt-1">Add at least 1 photo.</p>
          <label className="mt-3 flex min-h-[96px] min-w-[44px] cursor-pointer items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg-elevated-2)] text-[13px] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-3)] active:bg-[var(--bg-elevated-3)]">
            + Add photo
            <input type="file" className="hidden" accept="image/jpeg,image/png,image/heic,image/heif" capture="environment" />
          </label>
        </div>
        <div>
          <p className="caption mb-2">Notes (optional)</p>
          <textarea className="ios-input min-h-24" placeholder='e.g. "fragile glass armrest"' />
        </div>
        <Button asChild className="w-full">
          <Link href={`/move/new/book/${params.offerId}/access`}>Continue</Link>
        </Button>
      </section>
    </main>
  );
}
