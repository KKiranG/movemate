import { getDistanceKmBetweenPoints } from "@/lib/maps/haversine";

export const INTERCITY_DISTANCE_FLOOR_KM = 250;
export const INTERCITY_MINIMUM_PRICE_CENTS = 5000;

export function getRouteDistanceKm(params: {
  originLatitude: number;
  originLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
}) {
  return getDistanceKmBetweenPoints(
    { lat: params.originLatitude, lng: params.originLongitude },
    { lat: params.destinationLatitude, lng: params.destinationLongitude },
  );
}

export function getMinimumTripBasePriceCents(distanceKm: number) {
  return distanceKm >= INTERCITY_DISTANCE_FLOOR_KM ? INTERCITY_MINIMUM_PRICE_CENTS : 1000;
}

export function applyTripBasePriceFloor(priceCents: number, distanceKm: number) {
  return Math.max(priceCents, getMinimumTripBasePriceCents(distanceKm));
}
