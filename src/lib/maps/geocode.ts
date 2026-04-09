import { assertGoogleMapsApiKey } from "@/lib/maps/google";

interface GeocodeResult {
  formattedAddress: string;
  location: {
    lat: number;
    lng: number;
  };
}

interface GoogleGeocodeApiResponse {
  results: Array<{
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }>;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult[]> {
  const apiKey = assertGoogleMapsApiKey();

  const params = new URLSearchParams({ address, key: apiKey });
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error("Failed to geocode address.");
  }

  const payload = (await response.json()) as GoogleGeocodeApiResponse;

  return payload.results.map((result) => ({
    formattedAddress: result.formatted_address,
    location: result.geometry.location,
  }));
}
