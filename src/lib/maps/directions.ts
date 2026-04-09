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
