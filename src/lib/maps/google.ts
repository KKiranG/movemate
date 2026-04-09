export function getGoogleMapsApiKey() {
  return process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? null;
}

export function assertGoogleMapsApiKey() {
  const apiKey = getGoogleMapsApiKey();

  if (!apiKey) {
    throw new Error("Missing Google Maps API key.");
  }

  return apiKey;
}
