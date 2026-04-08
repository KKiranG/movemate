import Link from "next/link";

import { CarrierPostSuccessCard } from "@/components/carrier/carrier-post-success-card";
import { CarrierPostPrefill } from "@/components/carrier/carrier-post-prefill";
import { PageIntro } from "@/components/layout/page-intro";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requirePageSessionUser } from "@/lib/auth";
import { getCarrierByUserId, listCarrierVehicles } from "@/lib/data/carriers";
import { listCarrierTemplates } from "@/lib/data/templates";
import { getTripById } from "@/lib/data/trips";
import type { TripDraftVehicleOption } from "@/types/trip";

function getVehicleOptions(
  vehicles: Awaited<ReturnType<typeof listCarrierVehicles>>,
): TripDraftVehicleOption[] {
  return vehicles.map((vehicle) => ({
    id: vehicle.id,
    label: `${vehicle.type.replace("_", " ")}${vehicle.make ? ` · ${vehicle.make}` : ""}${
      vehicle.model ? ` ${vehicle.model}` : ""
    }`,
    detail: `${vehicle.maxVolumeM3}m3 · ${vehicle.maxWeightKg}kg`,
  }));
}

function buildTemplateQuickStartHref(params: {
  template: Awaited<ReturnType<typeof listCarrierTemplates>>[number];
  vehicleId?: string;
}) {
  const searchParams = new URLSearchParams({
    from: params.template.originSuburb,
    to: params.template.destinationSuburb,
    originPostcode: params.template.originPostcode,
    destinationPostcode: params.template.destinationPostcode,
    space: params.template.spaceSize,
    price: Math.round(params.template.suggestedPriceCents / 100).toString(),
    detour: params.template.detourRadiusKm.toString(),
    timeWindow: params.template.timeWindow,
    accepts: params.template.accepts.join(","),
    volume: String(params.template.availableVolumeM3 ?? ""),
    weight: String(params.template.maxWeightKg ?? ""),
    stairsOk: params.template.stairsOk ? "1" : "0",
    stairsExtra: (params.template.stairsExtraCents / 100).toString(),
    helperAvailable: params.template.helperAvailable ? "1" : "0",
    helperExtra: (params.template.helperExtraCents / 100).toString(),
  });

  if (params.template.originLatitude !== undefined) {
    searchParams.set("originLat", String(params.template.originLatitude));
  }

  if (params.template.originLongitude !== undefined) {
    searchParams.set("originLng", String(params.template.originLongitude));
  }

  if (params.template.destinationLatitude !== undefined) {
    searchParams.set("destinationLat", String(params.template.destinationLatitude));
  }

  if (params.template.destinationLongitude !== undefined) {
    searchParams.set("destinationLng", String(params.template.destinationLongitude));
  }

  if (params.template.notes) {
    searchParams.set("notes", params.template.notes);
  }

  if (params.vehicleId) {
    searchParams.set("vehicleId", params.vehicleId);
  }

  return `/carrier/post?${searchParams.toString()}`;
}

export default async function CarrierPostPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const user = await requirePageSessionUser();
  const [carrier, vehicles] = await Promise.all([
    getCarrierByUserId(user.id),
    listCarrierVehicles(user.id),
  ]);
  const vehicleOptions = getVehicleOptions(vehicles);
  const templates = carrier ? await listCarrierTemplates(carrier.id) : [];
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

      {vehicles.length > 0 ? (
        <Card className="p-4">
          <p className="section-label">Vehicle setup</p>
          <h2 className="mt-1 text-lg text-text">
            {vehicles.length === 1
              ? "Posting from your active vehicle"
              : `Choose from ${vehicles.length} active vehicles while posting`}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {vehicleOptions.map((vehicle) => (
              <div key={vehicle.id} className="rounded-xl border border-border p-3">
                <p className="text-sm font-medium text-text">{vehicle.label}</p>
                <p className="mt-1 text-sm text-text-secondary">{vehicle.detail}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {vehicles.length === 0 ? (
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
      ) : null}

      {templates.length > 0 ? (
        <Card className="p-4">
          <p className="section-label">Quick starts</p>
          <h2 className="mt-1 text-lg text-text">Start from one of your saved corridors</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Templates keep the route, price, space, and rules ready so you usually only need to
            confirm the date and any small trip-specific changes.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {templates.slice(0, 4).map((template) => (
              <Link
                key={template.id}
                href={buildTemplateQuickStartHref({
                  template,
                  vehicleId:
                    typeof searchParams?.vehicleId === "string"
                      ? searchParams.vehicleId
                      : vehicles[0]?.id,
                })}
                className="block min-h-[44px] rounded-xl border border-border p-3 active:opacity-95"
              >
                <p className="text-sm font-medium text-text">{template.name}</p>
                <p className="mt-1 text-sm text-text-secondary">
                  {template.originSuburb} to {template.destinationSuburb} · Space {template.spaceSize}
                </p>
              </Link>
            ))}
          </div>
        </Card>
      ) : null}

      <Card className="p-4">
        <CarrierPostPrefill canPost={vehicles.length > 0} vehicles={vehicleOptions} />
      </Card>
    </main>
  );
}
