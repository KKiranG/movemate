"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { CarrierTripWizard } from "@/components/carrier/carrier-trip-wizard";
import type { AddressValue } from "@/components/shared/google-autocomplete-input";

function numberParam(value: string | null) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function booleanParam(value: string | null) {
  if (!value) {
    return undefined;
  }

  if (["1", "true", "yes"].includes(value.toLowerCase())) {
    return true;
  }

  if (["0", "false", "no"].includes(value.toLowerCase())) {
    return false;
  }

  return undefined;
}

export function CarrierPostPrefill({ canPost = true }: { canPost?: boolean }) {
  const searchParams = useSearchParams();

  const initialOrigin = useMemo<AddressValue | null>(() => {
    const latitude = numberParam(searchParams.get("originLat"));
    const longitude = numberParam(searchParams.get("originLng"));
    const suburb = searchParams.get("from");
    const postcode = searchParams.get("originPostcode");

    if (!suburb || !postcode || latitude === undefined || longitude === undefined) {
      return null;
    }

    return {
      label: `${suburb} NSW ${postcode}`.trim(),
      suburb,
      postcode,
      latitude,
      longitude,
    };
  }, [searchParams]);

  const initialDestination = useMemo<AddressValue | null>(() => {
    const latitude = numberParam(searchParams.get("destinationLat"));
    const longitude = numberParam(searchParams.get("destinationLng"));
    const suburb = searchParams.get("to");
    const postcode = searchParams.get("destinationPostcode");

    if (!suburb || !postcode || latitude === undefined || longitude === undefined) {
      return null;
    }

    return {
      label: `${suburb} NSW ${postcode}`.trim(),
      suburb,
      postcode,
      latitude,
      longitude,
    };
  }, [searchParams]);

  const initialSpaceSize = searchParams.get("space");
  const initialPriceDollars = searchParams.get("price");
  const initialDetourRadiusKm = searchParams.get("detour");
  const initialTripDate = searchParams.get("tripDate");
  const initialTimeWindow = searchParams.get("timeWindow");
  const initialVolumeM3 = searchParams.get("volume");
  const initialWeightKg = searchParams.get("weight");
  const initialAccepts = searchParams
    .get("accepts")
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const initialSpecialNotes = searchParams.get("notes");
  const initialIsReturnTrip = booleanParam(searchParams.get("isReturn"));
  const initialStairsOk = booleanParam(searchParams.get("stairsOk"));
  const initialStairsExtraDollars = searchParams.get("stairsExtra");
  const initialHelperAvailable = booleanParam(searchParams.get("helperAvailable"));
  const initialHelperExtraDollars = searchParams.get("helperExtra");

  return (
    <CarrierTripWizard
      initialOrigin={initialOrigin}
      initialDestination={initialDestination}
      initialSpaceSize={
        initialSpaceSize === "S" ||
        initialSpaceSize === "M" ||
        initialSpaceSize === "L" ||
        initialSpaceSize === "XL"
          ? initialSpaceSize
          : undefined
      }
      initialPriceDollars={initialPriceDollars ?? undefined}
      initialDetourRadiusKm={initialDetourRadiusKm ?? undefined}
      initialTripDate={initialTripDate ?? undefined}
      initialTimeWindow={
        initialTimeWindow === "morning" ||
        initialTimeWindow === "afternoon" ||
        initialTimeWindow === "evening" ||
        initialTimeWindow === "flexible"
          ? initialTimeWindow
          : undefined
      }
      initialAvailableVolumeM3={initialVolumeM3 ?? undefined}
      initialAvailableWeightKg={initialWeightKg ?? undefined}
      initialAccepts={
        initialAccepts?.filter((value) =>
          ["furniture", "boxes", "appliance", "fragile"].includes(value),
        ) as Array<"furniture" | "boxes" | "appliance" | "fragile"> | undefined
      }
      initialSpecialNotes={initialSpecialNotes ?? undefined}
      initialIsReturnTrip={initialIsReturnTrip}
      initialStairsOk={initialStairsOk}
      initialStairsExtraDollars={initialStairsExtraDollars ?? undefined}
      initialHelperAvailable={initialHelperAvailable}
      initialHelperExtraDollars={initialHelperExtraDollars ?? undefined}
      canPost={canPost}
    />
  );
}
