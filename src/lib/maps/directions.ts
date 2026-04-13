import { assertGoogleMapsApiKey } from "@/lib/maps/google";

export async function getDirections(params: {
  origin: string;
  destination: string;
}) {
  const apiKey = assertGoogleMapsApiKey();

  const search = new URLSearchParams({
    origin: params.origin,
    destination: params.destination,
    key: apiKey,
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/directions/json?${search.toString()}`,
  );

  if (!response.ok) {
    throw new Error("Failed to load directions.");
  }

  return response.json();
}

export function getRouteContextMap(params: {
  originLatitude?: number;
  originLongitude?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
}) {
  const {
    originLatitude,
    originLongitude,
    destinationLatitude,
    destinationLongitude,
  } = params;

  if (
    typeof originLatitude !== "number" ||
    typeof originLongitude !== "number" ||
    typeof destinationLatitude !== "number" ||
    typeof destinationLongitude !== "number"
  ) {
    return null;
  }

  const width = 280;
  const height = 140;
  const padding = 18;
  const minLng = Math.min(originLongitude, destinationLongitude);
  const maxLng = Math.max(originLongitude, destinationLongitude);
  const minLat = Math.min(originLatitude, destinationLatitude);
  const maxLat = Math.max(originLatitude, destinationLatitude);
  const lngSpan = Math.max(0.02, maxLng - minLng);
  const latSpan = Math.max(0.02, maxLat - minLat);

  const normalizeX = (lng: number) =>
    padding + ((lng - minLng) / lngSpan) * (width - padding * 2);
  const normalizeY = (lat: number) =>
    height - padding - ((lat - minLat) / latSpan) * (height - padding * 2);

  const start = {
    x: Number(normalizeX(originLongitude).toFixed(1)),
    y: Number(normalizeY(originLatitude).toFixed(1)),
  };
  const end = {
    x: Number(normalizeX(destinationLongitude).toFixed(1)),
    y: Number(normalizeY(destinationLatitude).toFixed(1)),
  };
  const control = {
    x: Number(((start.x + end.x) / 2).toFixed(1)),
    y: Number((Math.min(start.y, end.y) - 18).toFixed(1)),
  };

  return {
    width,
    height,
    start,
    end,
    corridorPath: `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`,
  };
}
