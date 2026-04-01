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
      canPost={canPost}
    />
  );
}
