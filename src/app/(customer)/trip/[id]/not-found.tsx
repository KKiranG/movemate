import Link from "next/link";

import { PageIntro } from "@/components/layout/page-intro";
import { Card } from "@/components/ui/card";

export default function TripNotFound() {
  return (
    <main id="main-content" className="screen">
      <PageIntro
        eyebrow="Trip missing"
        title="That trip is no longer available"
        description="It may have been deleted, expired, or already taken off the marketplace."
      />
      <Card className="p-4">
        <p className="caption">
          Browse current live trips or head back to search for another route.
        </p>
        <Link href="/search" className="mt-3 inline-flex min-h-[44px] min-w-[44px] items-center text-sm font-medium text-[var(--accent)]">
          Back to search
        </Link>
      </Card>
    </main>
  );
}
