export type MatchClass = "direct" | "near" | "partial";

export type OfferCard = {
  id: string;
  carrierName: string;
  ratingLabel: string;
  vehicle: string;
  route: string;
  schedule: string;
  matchClass: MatchClass;
  why: string;
  fit: "Likely fits" | "Review photos" | "Needs approval";
  total: string;
  tags?: string[];
};

export type PriceLine = {
  label: string;
  value: string;
};

export type TimelineStep = {
  title: string;
  state: "complete" | "current" | "future";
  note: string;
};

export const topOffers: OfferCard[] = [
  {
    id: "offer-james",
    carrierName: "James T.",
    ratingLabel: "4.8 (12 trips)",
    vehicle: "Large van",
    route: "Bondi -> Parramatta via Inner West",
    schedule: "Fri 9am - 1pm",
    matchClass: "direct",
    why: "Direct route match on your requested timing window",
    fit: "Likely fits",
    total: "$95",
    tags: ["On time", "Careful handler"],
  },
  {
    id: "offer-sarah",
    carrierName: "Sarah M.",
    ratingLabel: "Verified (7 trips)",
    vehicle: "Ute + trailer",
    route: "Marrickville -> Burwood corridor",
    schedule: "Sat 10am - 2pm",
    matchClass: "near",
    why: "Small pickup detour (~3 km), same-day delivery",
    fit: "Likely fits",
    total: "$101",
    tags: ["Strong communicator"],
  },
  {
    id: "offer-ahmed",
    carrierName: "Ahmed K.",
    ratingLabel: "4.9 (21 trips)",
    vehicle: "Medium truck",
    route: "Newtown -> Homebush",
    schedule: "Sun midday",
    matchClass: "direct",
    why: "Direct route and flexible drop-off window",
    fit: "Review photos",
    total: "$110",
    tags: ["Bulky-item specialist"],
  },
];

export const possibleOffers: OfferCard[] = [
  {
    id: "offer-li",
    carrierName: "Li C.",
    ratingLabel: "Verified (2 trips)",
    vehicle: "Van",
    route: "Leichhardt -> Strathfield",
    schedule: "Fri evening",
    matchClass: "partial",
    why: "Nearby date with partial route overlap",
    fit: "Needs approval",
    total: "$89",
  },
  {
    id: "offer-maya",
    carrierName: "Maya P.",
    ratingLabel: "Verified (4 trips)",
    vehicle: "Van",
    route: "Stanmore -> Lidcombe",
    schedule: "Mon morning",
    matchClass: "partial",
    why: "Adjacent corridor with short transfer",
    fit: "Needs approval",
    total: "$92",
  },
];

export const nearbyDateOffers: OfferCard[] = [
  {
    id: "offer-kim",
    carrierName: "Kim J.",
    ratingLabel: "4.7 (9 trips)",
    vehicle: "Large van",
    route: "Dulwich Hill -> Parramatta",
    schedule: "Next Tue morning",
    matchClass: "partial",
    why: "Direct route within +/- 3 days",
    fit: "Likely fits",
    total: "$98",
  },
];

export const standardPriceLines: PriceLine[] = [
  { label: "Base (sofa, 1)", value: "$70.00" },
  { label: "Stairs at drop-off (1-2)", value: "$10.00" },
  { label: "Platform fee", value: "$12.00" },
  { label: "GST", value: "$9.20" },
];

export const bookingTimeline: TimelineStep[] = [
  { title: "Requested", state: "complete", note: "5 min ago" },
  { title: "Accepted", state: "complete", note: "2 min ago" },
  { title: "On the way", state: "current", note: "ETA 20 min" },
  { title: "At pickup", state: "future", note: "" },
  { title: "In transit", state: "future", note: "" },
  { title: "Delivered", state: "future", note: "" },
];

export const activityItems: Record<
  "active" | "alerts" | "past",
  Array<{ id: string; title: string; subtitle: string; href: string }>
> = {
  active: [
    {
      id: "demo-booking",
      title: "Your move today",
      subtitle: "Sofa - Newtown -> Burwood - On the way",
      href: "/bookings/demo-booking",
    },
    {
      id: "booking-202",
      title: "Pickup tomorrow",
      subtitle: "Fridge - Bondi -> Marrickville - Confirmed",
      href: "/bookings/booking-202",
    },
  ],
  alerts: [
    {
      id: "alert-88",
      title: "Waiting on a driver",
      subtitle: "Alert the Network is live for Newtown -> Burwood.",
      href: "/move/alert",
    },
  ],
  past: [
    {
      id: "booking-100",
      title: "Bed frame",
      subtitle: "Leichhardt -> Strathfield - 13 Apr - $84",
      href: "/bookings/booking-100",
    },
  ],
};

export const inboxThreads = [
  {
    id: "booking-demo-booking",
    title: "Booking #BR-1021",
    preview: "Carrier: On the way now. ETA 20 min.",
    timestamp: "2m",
    unread: true,
    href: "/inbox/booking-demo-booking",
  },
  {
    id: "system-payments",
    title: "Moverrr system",
    preview: "Payment hold confirmed for your request.",
    timestamp: "1h",
    unread: false,
    href: "/inbox/system-payments",
  },
  {
    id: "alert-updates",
    title: "Alert updates",
    preview: "3 nearby drivers were notified.",
    timestamp: "3h",
    unread: true,
    href: "/inbox/alert-updates",
  },
] as const;
