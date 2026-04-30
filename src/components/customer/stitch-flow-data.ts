export type StitchItemCategory =
  | "sofa"
  | "bed"
  | "mattress"
  | "fridge"
  | "washer"
  | "desk"
  | "dresser"
  | "table"
  | "wardrobe"
  | "tv"
  | "boxes"
  | "gym"
  | "appliance"
  | "other";

export interface StitchItemVariant {
  id: string;
  label: string;
  helperRecommended: boolean;
  basePriceCents: number;
  notes: string;
}

export interface StitchItem {
  id: string;
  category: StitchItemCategory;
  label: string;
  quantity: number;
  selectedVariantId: string;
  variants: StitchItemVariant[];
}

export interface StitchAccessDefaults {
  pickup: StitchAccessPoint;
  dropoff: StitchAccessPoint;
}

export interface StitchAccessPoint {
  addressLabel: string;
  dwellingType: "apartment" | "house" | "storage";
  stairs: number;
  liftAvailable: boolean;
  parking: "easy" | "moderate" | "tight";
  instructions: string;
}

export interface StitchTimingOption {
  id: string;
  label: string;
  date: string;
  subLabel: string;
  confidenceLabel: string;
}

export interface StitchTimeWindowOption {
  id: string;
  label: string;
  window: string;
  helper: string;
}

export interface StitchDriverMatch {
  id: string;
  driverName: string;
  vehicleLabel: string;
  routeLabel: string;
  matchRank: number;
  matchScore: number;
  accentLabel: string;
  trustSignals: string[];
  etaWindow: string;
  priceBreakdownId: string;
}

export interface StitchPriceLine {
  id: string;
  label: string;
  amountCents: number;
}

export interface StitchPriceBreakdown {
  id: string;
  driverMatchId: string;
  currency: "AUD";
  basePriceCents: number;
  stairsCents: number;
  helperCents: number;
  bookingFeeCents: 0;
  platformCommissionCents: number;
  totalCents: number;
  lines: StitchPriceLine[];
}

export interface StitchTimelineStep {
  id: string;
  label: string;
  status: "complete" | "current" | "upcoming";
  timestampLabel: string;
  description: string;
}

export interface StitchBookingHistoryRow {
  id: string;
  moveLabel: string;
  driverName: string;
  dateLabel: string;
  statusLabel: string;
  totalCents: number;
}

export interface StitchActiveBooking {
  itemLabel: string;
  routeLabel: string;
  driverName: string;
  vehicleLabel: string;
  dateLabel: string;
  statusLabel: string;
  totalCents: number;
  receiptLines: StitchPriceLine[];
}

export interface StitchAccountRow {
  id: string;
  label: string;
  value: string;
  detail: string;
}

export const stitchItems: StitchItem[] = [
  {
    id: "item-sofa-01",
    category: "sofa",
    label: "3-seat sofa",
    quantity: 1,
    selectedVariantId: "sofa-standard",
    variants: [
      {
        id: "sofa-standard",
        label: "Standard fabric sofa",
        helperRecommended: true,
        basePriceCents: 12900,
        notes: "Fits through lift with one helper.",
      },
      {
        id: "sofa-chaise",
        label: "Chaise sofa",
        helperRecommended: true,
        basePriceCents: 15900,
        notes: "Needs two-person handling at pickup.",
      },
    ],
  },
  {
    id: "item-bed-01",
    category: "bed",
    label: "Bed frame",
    quantity: 1,
    selectedVariantId: "bed-queen-frame",
    variants: [
      {
        id: "bed-queen-frame",
        label: "Queen frame",
        helperRecommended: true,
        basePriceCents: 10900,
        notes: "Best if disassembled before pickup.",
      },
      {
        id: "bed-king-frame",
        label: "King frame",
        helperRecommended: true,
        basePriceCents: 13900,
        notes: "Large frame, van or truck only.",
      },
    ],
  },
  {
    id: "item-mattress-01",
    category: "mattress",
    label: "Queen mattress",
    quantity: 1,
    selectedVariantId: "mattress-queen",
    variants: [
      {
        id: "mattress-queen",
        label: "Queen mattress",
        helperRecommended: false,
        basePriceCents: 7900,
        notes: "Bagged and ready near entrance.",
      },
      {
        id: "mattress-king",
        label: "King mattress",
        helperRecommended: true,
        basePriceCents: 9900,
        notes: "Bulky item, helper improves fit.",
      },
    ],
  },
  {
    id: "item-fridge-01",
    category: "fridge",
    label: "Fridge",
    quantity: 1,
    selectedVariantId: "fridge-standard",
    variants: [
      {
        id: "fridge-standard",
        label: "Standard fridge",
        helperRecommended: true,
        basePriceCents: 11900,
        notes: "Needs upright loading and careful securing.",
      },
      {
        id: "fridge-french-door",
        label: "French door fridge",
        helperRecommended: true,
        basePriceCents: 16900,
        notes: "Large van or truck recommended.",
      },
    ],
  },
  {
    id: "item-washer-01",
    category: "washer",
    label: "Washer",
    quantity: 1,
    selectedVariantId: "washer-front-loader",
    variants: [
      {
        id: "washer-front-loader",
        label: "Front loader",
        helperRecommended: true,
        basePriceCents: 9900,
        notes: "Heavy appliance, helper recommended.",
      },
      {
        id: "washer-dryer",
        label: "Washer-dryer",
        helperRecommended: true,
        basePriceCents: 12900,
        notes: "Heavier unit that needs two-person handling.",
      },
    ],
  },
  {
    id: "item-desk-01",
    category: "desk",
    label: "Desk",
    quantity: 1,
    selectedVariantId: "desk-standard",
    variants: [
      {
        id: "desk-standard",
        label: "Standard desk",
        helperRecommended: false,
        basePriceCents: 7900,
        notes: "Fits most vans without disassembly.",
      },
      {
        id: "desk-standing",
        label: "Standing desk",
        helperRecommended: true,
        basePriceCents: 10900,
        notes: "Heavy base, helper recommended.",
      },
    ],
  },
  {
    id: "item-table-01",
    category: "table",
    label: "Dining table",
    quantity: 1,
    selectedVariantId: "table-six-seat",
    variants: [
      {
        id: "table-six-seat",
        label: "6-seat table",
        helperRecommended: true,
        basePriceCents: 9900,
        notes: "Legs may need removal before pickup.",
      },
      {
        id: "table-coffee",
        label: "Coffee table",
        helperRecommended: false,
        basePriceCents: 4900,
        notes: "Small bulky item, easy fit.",
      },
    ],
  },
  {
    id: "item-wardrobe-01",
    category: "wardrobe",
    label: "Wardrobe",
    quantity: 1,
    selectedVariantId: "wardrobe-two-door",
    variants: [
      {
        id: "wardrobe-two-door",
        label: "2-door wardrobe",
        helperRecommended: true,
        basePriceCents: 13900,
        notes: "Tall and awkward, helper strongly recommended.",
      },
      {
        id: "wardrobe-flatpack",
        label: "Flat-pack wardrobe",
        helperRecommended: false,
        basePriceCents: 8900,
        notes: "Easier fit when packed flat.",
      },
    ],
  },
  {
    id: "item-tv-01",
    category: "tv",
    label: "TV / unit",
    quantity: 1,
    selectedVariantId: "tv-large",
    variants: [
      {
        id: "tv-large",
        label: "TV 65 inch or larger",
        helperRecommended: true,
        basePriceCents: 9900,
        notes: "Needs padding and upright loading.",
      },
      {
        id: "tv-unit",
        label: "TV unit or stand",
        helperRecommended: false,
        basePriceCents: 7900,
        notes: "Measure length before pickup.",
      },
    ],
  },
  {
    id: "item-boxes-01",
    category: "boxes",
    label: "Medium moving boxes",
    quantity: 6,
    selectedVariantId: "boxes-medium",
    variants: [
      {
        id: "boxes-medium",
        label: "Medium boxes",
        helperRecommended: false,
        basePriceCents: 4500,
        notes: "Stackable and under 15kg each.",
      },
      {
        id: "boxes-large",
        label: "Large boxes",
        helperRecommended: false,
        basePriceCents: 5900,
        notes: "Best for light bulky goods.",
      },
    ],
  },
  {
    id: "item-gym-01",
    category: "gym",
    label: "Gym gear",
    quantity: 1,
    selectedVariantId: "gym-bench",
    variants: [
      {
        id: "gym-bench",
        label: "Weights bench",
        helperRecommended: true,
        basePriceCents: 9900,
        notes: "Secure loose plates before pickup.",
      },
      {
        id: "gym-treadmill",
        label: "Treadmill",
        helperRecommended: true,
        basePriceCents: 15900,
        notes: "Heavy item; stair access may filter drivers.",
      },
    ],
  },
  {
    id: "item-other-01",
    category: "other",
    label: "Other bulky item",
    quantity: 1,
    selectedVariantId: "other-marketplace",
    variants: [
      {
        id: "other-marketplace",
        label: "Marketplace pickup",
        helperRecommended: false,
        basePriceCents: 8900,
        notes: "Describe it clearly and add a photo later.",
      },
      {
        id: "other-heavy",
        label: "Heavy or awkward",
        helperRecommended: true,
        basePriceCents: 14900,
        notes: "We will only show carriers comfortable with heavier handling.",
      },
    ],
  },
];

export const stitchAccessDefaults: StitchAccessDefaults = {
  pickup: {
    addressLabel: "Surry Hills apartment",
    dwellingType: "apartment",
    stairs: 1,
    liftAvailable: true,
    parking: "moderate",
    instructions: "Loading zone is usually open after 10am.",
  },
  dropoff: {
    addressLabel: "Marrickville townhouse",
    dwellingType: "house",
    stairs: 0,
    liftAvailable: false,
    parking: "easy",
    instructions: "Driveway access, front room is clear.",
  },
};

export const stitchTimingOptions: StitchTimingOption[] = [
  {
    id: "timing-fri-morning",
    label: "Fri",
    date: "2026-05-08",
    subLabel: "8 May",
    confidenceLabel: "Best route density",
  },
  {
    id: "timing-fri-afternoon",
    label: "Sat",
    date: "2026-05-08",
    subLabel: "9 May",
    confidenceLabel: "Strong match window",
  },
  {
    id: "timing-sat-morning",
    label: "Sun",
    date: "2026-05-09",
    subLabel: "10 May",
    confidenceLabel: "Backup window",
  },
  {
    id: "timing-pick",
    label: "Pick",
    date: "2026-05-11",
    subLabel: "Calendar",
    confidenceLabel: "Choose a date",
  },
];

export const stitchTimeWindows: StitchTimeWindowOption[] = [
  {
    id: "morning",
    label: "Morning",
    window: "6am-12pm",
    helper: "Best route density",
  },
  {
    id: "midday",
    label: "Midday",
    window: "11am-2pm",
    helper: "Shorter handoff window",
  },
  {
    id: "afternoon",
    label: "Afternoon",
    window: "12pm-5pm",
    helper: "Good backup window",
  },
  {
    id: "evening",
    label: "Evening",
    window: "4pm-8pm",
    helper: "Limited but possible",
  },
];

export const stitchDriverMatches: StitchDriverMatch[] = [
  {
    id: "match-nadia",
    driverName: "Nadia K.",
    vehicleLabel: "HiAce van",
    routeLabel: "CBD to Inner West",
    matchRank: 1,
    matchScore: 96,
    accentLabel: "Top match",
    trustSignals: ["142 completed moves", "Proof-backed delivery", "4.9 rating"],
    etaWindow: "Friday 9:30am-10:15am",
    priceBreakdownId: "price-nadia",
  },
  {
    id: "match-sol",
    driverName: "Sol M.",
    vehicleLabel: "Long-wheelbase van",
    routeLabel: "Eastern Suburbs to Marrickville",
    matchRank: 2,
    matchScore: 91,
    accentLabel: "Flexible fit",
    trustSignals: ["88 completed moves", "Helper available", "4.8 rating"],
    etaWindow: "Friday 1:30pm-2:30pm",
    priceBreakdownId: "price-sol",
  },
  {
    id: "match-ivy",
    driverName: "Ivy R.",
    vehicleLabel: "Covered ute",
    routeLabel: "City fringe spare-capacity run",
    matchRank: 3,
    matchScore: 84,
    accentLabel: "Backup route",
    trustSignals: ["Proof photos required", "Same-day messages", "4.7 rating"],
    etaWindow: "Saturday 8:30am-9:30am",
    priceBreakdownId: "price-ivy",
  },
];

export const stitchPriceBreakdowns: StitchPriceBreakdown[] = [
  {
    id: "price-nadia",
    driverMatchId: "match-nadia",
    currency: "AUD",
    basePriceCents: 25300,
    stairsCents: 1800,
    helperCents: 2400,
    bookingFeeCents: 0,
    platformCommissionCents: 3795,
    totalCents: 33295,
    lines: [
      { id: "line-nadia-base", label: "Item and route base", amountCents: 25300 },
      { id: "line-nadia-stairs", label: "Pickup stairs", amountCents: 1800 },
      { id: "line-nadia-helper", label: "Helper add-on", amountCents: 2400 },
    ],
  },
  {
    id: "price-sol",
    driverMatchId: "match-sol",
    currency: "AUD",
    basePriceCents: 27100,
    stairsCents: 1800,
    helperCents: 2400,
    bookingFeeCents: 0,
    platformCommissionCents: 4065,
    totalCents: 35365,
    lines: [
      { id: "line-sol-base", label: "Item and route base", amountCents: 27100 },
      { id: "line-sol-stairs", label: "Pickup stairs", amountCents: 1800 },
      { id: "line-sol-helper", label: "Helper add-on", amountCents: 2400 },
    ],
  },
  {
    id: "price-ivy",
    driverMatchId: "match-ivy",
    currency: "AUD",
    basePriceCents: 23900,
    stairsCents: 1800,
    helperCents: 0,
    bookingFeeCents: 0,
    platformCommissionCents: 3585,
    totalCents: 29285,
    lines: [
      { id: "line-ivy-base", label: "Item and route base", amountCents: 23900 },
      { id: "line-ivy-stairs", label: "Pickup stairs", amountCents: 1800 },
      { id: "line-ivy-helper", label: "No helper selected", amountCents: 0 },
    ],
  },
];

export const stitchTimelineSteps: StitchTimelineStep[] = [
  {
    id: "timeline-need",
    label: "Move need saved",
    status: "complete",
    timestampLabel: "Today, 8:40am",
    description: "Items, access, and timing were captured for matching.",
  },
  {
    id: "timeline-matches",
    label: "Matches ranked",
    status: "complete",
    timestampLabel: "Today, 8:41am",
    description: "Drivers were ordered by route fit, trust signals, and availability.",
  },
  {
    id: "timeline-request",
    label: "Request to book",
    status: "current",
    timestampLabel: "Next step",
    description: "Customer reviews the all-in price and sends one request in-platform.",
  },
  {
    id: "timeline-proof",
    label: "Proof and confirmation",
    status: "upcoming",
    timestampLabel: "After delivery",
    description: "Driver uploads proof before customer confirmation and payout release.",
  },
];

export const stitchBookingHistory: StitchBookingHistoryRow[] = [
  {
    id: "booking-archive-01",
    moveLabel: "Newtown desk move",
    driverName: "Rae P.",
    dateLabel: "12 Mar 2026",
    statusLabel: "Completed",
    totalCents: 11800,
  },
  {
    id: "booking-archive-02",
    moveLabel: "Bondi bookshelf",
    driverName: "Mina S.",
    dateLabel: "04 Feb 2026",
    statusLabel: "Completed",
    totalCents: 14200,
  },
  {
    id: "booking-archive-03",
    moveLabel: "Camperdown boxes",
    driverName: "Theo W.",
    dateLabel: "18 Jan 2026",
    statusLabel: "Cancelled before acceptance",
    totalCents: 0,
  },
];

export const stitchActiveBooking: StitchActiveBooking = {
  itemLabel: "Standard fabric sofa",
  routeLabel: "Surry Hills to Marrickville",
  driverName: "Nadia K.",
  vehicleLabel: "HiAce van",
  dateLabel: "Friday 8 May · Morning",
  statusLabel: "In progress",
  totalCents: 33295,
  receiptLines: [
    { id: "receipt-base", label: "Item and route base", amountCents: 25300 },
    { id: "receipt-stairs", label: "Pickup stairs", amountCents: 1800 },
    { id: "receipt-helper", label: "Helper add-on", amountCents: 2400 },
    { id: "receipt-platform", label: "Platform commission", amountCents: 3795 },
  ],
};

export const stitchAccountRows: StitchAccountRow[] = [
  {
    id: "account-name",
    label: "Customer",
    value: "Avery Chen",
    detail: "Primary account holder",
  },
  {
    id: "account-email",
    label: "Email",
    value: "avery@example.com",
    detail: "Receives booking and proof updates",
  },
  {
    id: "account-payment",
    label: "Payment",
    value: "Visa ending 4242",
    detail: "Authorised before driver acceptance",
  },
  {
    id: "account-notifications",
    label: "Notifications",
    value: "SMS and email",
    detail: "Used for match updates and delivery confirmation",
  },
];
