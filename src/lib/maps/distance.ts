import { assertGoogleMapsApiKey } from "@/lib/maps/google";

export async function getDistanceMatrix(params: {
  origins: string[];
  destinations: string[];
}) {
  const apiKey = assertGoogleMapsApiKey();

  const search = new URLSearchParams({
    origins: params.origins.join("|"),
    destinations: params.destinations.join("|"),
    key: apiKey,
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/distancematrix/json?${search.toString()}`,
  );

  if (!response.ok) {
    throw new Error("Failed to load distance matrix.");
  }

  return response.json();
}
