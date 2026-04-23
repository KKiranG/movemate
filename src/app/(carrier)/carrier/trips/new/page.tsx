import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";

import { CarrierPostPrefill } from "@/components/carrier/carrier-post-prefill";
import { TripChecklist } from "@/components/carrier/trip-checklist";
import { PageIntro } from "@/components/layout/page-intro";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requirePageSessionUser } from "@/lib/auth";
import {
  getCarrierActivationBlockers,
  getCarrierActivationLabel,
  isCarrierActivationLive,
} from "@/lib/carrier-activation";
import { getCarrierByUserId, listCarrierVehicles } from "@/lib/data/carriers";

export const metadata: Metadata = {
  title: "Post a carrier trip",
  description: "Create a live trip or draft using the real carrier posting wizard.",
};

function formatVehicleLabel(type: string) {
  return type.replaceAll("_", " ");
}

export default async function CarrierTripNewIndexPage() {
  const user = await requirePageSessionUser();
  const [carrier, vehicles] = await Promise.all([
    getCarrierByUserId(user.id),
    listCarrierVehicles(user.id),
  ]);

  const activationLive = carrier ? isCarrierActivationLive(carrier.activationStatus) : false;
  const blockers = getCarrierActivationBlockers(carrier);
  const vehicleOptions = vehicles.map((vehicle) => ({
    id: vehicle.id,
    label: [vehicle.make, vehicle.model].filter(Boolean).join(" ") || formatVehicleLabel(vehicle.type),
    detail: `${formatVehicleLabel(vehicle.type)} · ${vehicle.maxVolumeM3}m3 · ${vehicle.maxWeightKg}kg${vehicle.regoPlate ? ` · ${vehicle.regoPlate}` : ""}`,
  }));

  return (
    <main id="main-content" className="screen">
      <PageIntro
        eyebrow="New trip"
        title="Post the route you are already running"
        description="This is the live carrier trip wizard. Use it to publish clean fixed-price supply, or save the lane as a draft while activation is still clearing."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href="/carrier/trips">Back to trips</Link>
            </Button>
            <Button asChild>
              <Link href={carrier ? "/carrier" : "/carrier/activate"}>
                {carrier ? "Carrier home" : "Start activation"}
              </Link>
            </Button>
          </div>
        }
      />

      {!carrier ? (
        <Card className="border-warning/20 bg-warning/10 p-4">
          <p className="section-label">Activation first</p>
          <h2 className="mt-1 text-lg text-text">You need a carrier profile before posting supply</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Complete the carrier activation pack first. Once a vehicle exists, this posting flow becomes fully usable.
          </p>
          <Button asChild variant="secondary" className="mt-3">
            <Link href="/carrier/activate">Open activation</Link>
          </Button>
        </Card>
      ) : null}

      {carrier && !activationLive ? (
        <Card className="border-warning/20 bg-warning/10 p-4">
          <p className="section-label">Publish rule</p>
          <h2 className="mt-1 text-lg text-text">
            Activation is {getCarrierActivationLabel(carrier.activationStatus).toLowerCase()}
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            You can prepare this corridor now, but live publish still requires an active carrier profile. If review is still pending, switch the final step to draft so the lane is ready to go once ops clears you.
          </p>
          <div className="mt-3 grid gap-2">
            {blockers.map((blocker) => (
              <div key={blocker} className="rounded-xl border border-warning/20 bg-white/60 px-3 py-2 text-sm text-text dark:bg-black/10">
                {blocker}
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Suspense
          fallback={
            <div
              role="status"
              aria-label="Loading posting form"
              aria-busy="true"
              className="skeleton min-h-[720px] w-full rounded-xl sm:min-h-[680px] lg:min-h-[760px]"
            />
          }
        >
          <CarrierPostPrefill canPost={vehicleOptions.length > 0} vehicles={vehicleOptions} />
        </Suspense>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <div>
                <p className="section-label">Posting readiness</p>
                <h2 className="mt-1 text-lg text-text">Keep route quality honest before you publish</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Activation</p>
                  <p className="mt-2 text-sm text-text">
                    {carrier ? getCarrierActivationLabel(carrier.activationStatus) : "Not started"}
                  </p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Active vehicles</p>
                  <p className="mt-2 text-sm text-text">
                    {vehicleOptions.length > 0 ? `${vehicleOptions.length} vehicle${vehicleOptions.length === 1 ? "" : "s"} ready` : "No active vehicle yet"}
                  </p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Service suburbs</p>
                  <p className="mt-2 text-sm text-text-secondary">
                    {carrier?.serviceSuburbs.length ? carrier.serviceSuburbs.join(", ") : "Add service suburbs in activation to make review easier."}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <TripChecklist carrier={carrier} />
        </div>
      </div>
    </main>
  );
}
