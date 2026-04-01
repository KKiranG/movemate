import Link from "next/link";

import { CarrierPostSuccessCard } from "@/components/carrier/carrier-post-success-card";
import { CarrierPostPrefill } from "@/components/carrier/carrier-post-prefill";
import { PageIntro } from "@/components/layout/page-intro";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requirePageSessionUser } from "@/lib/auth";
import { getCarrierVehicle } from "@/lib/data/carriers";
import { getTripById } from "@/lib/data/trips";

export default async function CarrierPostPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const user = await requirePageSessionUser();
  const vehicle = await getCarrierVehicle(user.id);
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

      {successTrip ? <CarrierPostSuccessCard trip={successTrip} /> : null}

      {vehicle ? null : (
        <Card className="border-warning/20 bg-warning/10 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-warning">Add an active vehicle first</p>
              <p className="mt-1 text-sm text-text-secondary">
                You can still review the route setup, but posting stays blocked until a vehicle is active in onboarding.
              </p>
            </div>
            <Button asChild variant="secondary">
              <Link href="/carrier/onboarding">Go to onboarding</Link>
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-4">
        <CarrierPostPrefill canPost={Boolean(vehicle)} />
      </Card>
    </main>
  );
}
