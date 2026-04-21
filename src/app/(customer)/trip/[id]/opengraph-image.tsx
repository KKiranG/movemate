import { ImageResponse } from "next/og";

import { getTripById } from "@/lib/data/trips";

export const runtime = "nodejs";
export const alt = "moverrr trip preview";
export const size = {
  width: 1200,
  height: 630,
};

export default async function Image({
  params,
}: {
  params: { id: string };
}) {
  const trip = await getTripById(params.id);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background: "#fafafa",
          color: "#1a1a1a",
          padding: "48px",
          fontFamily: "sans-serif",
          justifyContent: "space-between",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "760px" }}>
            <div style={{ fontSize: 22, letterSpacing: 2, textTransform: "uppercase", color: "#666" }}>
              moverrr spare capacity
            </div>
            <div style={{ fontSize: 58, fontWeight: 700, lineHeight: 1.05 }}>
              {trip ? `${trip.route.originSuburb} to ${trip.route.destinationSuburb}` : "Trip not found"}
            </div>
            <div style={{ fontSize: 28, color: "#444" }}>
              {trip
                ? `${trip.tripDate} · ${trip.timeWindow} · ${trip.carrier.businessName}`
                : "Browse live spare-capacity routes in Sydney"}
            </div>
          </div>
          <div style={{ fontSize: 54, fontWeight: 700 }}>
            {trip ? `$${Math.round(trip.priceCents / 100)}` : "moverrr"}
          </div>
        </div>
        <div style={{ display: "flex", gap: "16px" }}>
          <div
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 18,
              padding: "14px 18px",
              fontSize: 24,
              color: trip?.isReturnTrip ? "#00a651" : "#1a1a1a",
              background: trip?.isReturnTrip ? "rgba(0, 166, 81, 0.08)" : "#fff",
            }}
          >
            {trip?.isReturnTrip ? "Return trip backload" : "Spare-capacity match"}
          </div>
          <div
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 18,
              padding: "14px 18px",
              fontSize: 24,
              background: "#fff",
            }}
          >
            {trip ? `${trip.savingsPct}% cheaper than dedicated truck` : "Sydney metro"}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
