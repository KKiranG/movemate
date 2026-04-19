import Link from "next/link";

import { PriceBreakdown } from "@/components/spec/cards";
import { TopAppBar } from "@/components/spec/chrome";
import { standardPriceLines } from "@/lib/spec-mocks";
import { Button } from "@/components/ui/button";

export default function BookPricePage({ params }: { params: { offerId: string } }) {
  return (
    <main>
      <TopAppBar title="Confirm price" backHref={`/move/new/book/${params.offerId}/access`} />
      <section className="screen space-y-4">
        <PriceBreakdown lines={standardPriceLines} total="$101.20" />
        <Button asChild className="w-full">
          <Link href={`/move/new/book/${params.offerId}/pay`}>Agree to the price</Link>
        </Button>
      </section>
    </main>
  );
}
