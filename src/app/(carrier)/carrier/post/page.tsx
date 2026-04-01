import Link from "next/link";

import { CarrierPostPrefill } from "@/components/carrier/carrier-post-prefill";
import { PageIntro } from "@/components/layout/page-intro";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requirePageSessionUser } from "@/lib/auth";
import { getTripById } from "@/lib/data/trips";

export default async function CarrierPostPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  await requirePageSessionUser();
  const successTripId =
    typeof searchParams?.successTripId === "string" ? searchParams.successTripId : null;
  const successTrip = successTripId ? await getTripById(successTripId) : null;

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Post capacity"
        title="Three screens, under 60 seconds"
        description="Route first, then timing and space, then price and rules. This mirrors the master plan exactly."
      />

      {successTrip ? (
        <Card className="border-success/20 bg-success/5 p-4">
          <div className="space-y-4">
            <div>
              <p className="section-label">Trip posted</p>
              <h2 className="mt-1 text-lg text-text">Your spare-capacity route is live</h2>
              <p className="mt-2 text-sm text-text-secondary">
                {successTrip.route.label} is now visible to customers. Use the next step that fits
                your workflow.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="secondary">
                <Link href="/carrier/dashboard">Go to dashboard</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/carrier/post">Post another trip</Link>
              </Button>
              <Button asChild>
                <Link href={`/trip/${successTrip.id}`}>Share customer link</Link>
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      <Card className="p-4">
        <CarrierPostPrefill />
      </Card>
    </main>
  );
}
