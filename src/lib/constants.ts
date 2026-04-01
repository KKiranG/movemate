import type {
  ItemCategory,
  ItemSizeCategory,
  SpaceSize,
  TimeWindow,
} from "@/types/trip";
import type {
  BookingCancellationReasonCode,
  BookingPaymentStatus,
} from "@/types/booking";

export const BOOKING_FEE_CENTS = 500;
export const PLATFORM_COMMISSION_RATE = 0.15;
export const SEARCH_PAGE_SIZE = 20;
export const ADMIN_PAGE_SIZE = 25;
export const SEARCH_REVALIDATE_SECONDS = 30;
export const PENDING_BOOKING_HOLD_MS = 2 * 60 * 60 * 1000;
export const DELIVERY_REMINDER_HOURS = [2, 24] as const;
export const DOCUMENT_EXPIRY_REMINDER_DAYS = [30, 7] as const;

export const DEFAULT_DEDICATED_ESTIMATES: Record<SpaceSize, number> = {
  S: 9000,
  M: 14000,
  L: 20000,
  XL: 30000,
};

export const ITEM_CATEGORIES: ItemCategory[] = [
  "furniture",
  "boxes",
  "appliance",
  "fragile",
  "other",
];

export const ITEM_CATEGORY_LABELS: Record<ItemCategory, string> = {
  furniture: "Furniture",
  boxes: "Boxes",
  appliance: "Appliance",
  fragile: "Fragile",
  other: "Other",
};

export const SEARCH_CATEGORY_OPTIONS: Array<{
  value: ItemCategory;
  label: string;
  description: string;
}> = [
  {
    value: "furniture",
    label: "Furniture",
    description: "Sofas, tables, beds, desks, and marketplace pickups.",
  },
  {
    value: "boxes",
    label: "Boxes",
    description: "Share-house moves, student runs, and storage tubs.",
  },
  {
    value: "appliance",
    label: "Appliance",
    description: "Fridges, washers, dryers, and bulky whitegoods.",
  },
  {
    value: "fragile",
    label: "Fragile",
    description: "Handled carefully with extra padding and slower loading.",
  },
  {
    value: "other",
    label: "Bulky item",
    description: "Anything awkward-middle that does not fit the standard groups.",
  },
];

export const TIME_WINDOW_LABELS: Record<TimeWindow, string> = {
  morning: "09:00 to 12:00",
  afternoon: "12:00 to 16:00",
  evening: "16:00 to 20:00",
  flexible: "Flexible across the day",
};

export const TIME_WINDOW_PROGRESS: Record<
  TimeWindow,
  { startPct: number; endPct: number }
> = {
  morning: { startPct: 8, endPct: 35 },
  afternoon: { startPct: 36, endPct: 68 },
  evening: { startPct: 69, endPct: 95 },
  flexible: { startPct: 10, endPct: 90 },
};

export const SPACE_SIZE_LABELS: Record<SpaceSize, string> = {
  S: "Small",
  M: "Medium",
  L: "Large",
  XL: "Extra large",
};

export const SPACE_SIZE_DESCRIPTIONS: Record<SpaceSize, string> = {
  S: "1 to 2 boxes or a compact marketplace pickup.",
  M: "A single furniture item like a desk, chair, or washing machine.",
  L: "Several bulky items or a light studio move.",
  XL: "Large pieces that take most of the spare bay.",
};

export const ITEM_SIZE_DESCRIPTIONS: Record<
  ItemSizeCategory,
  { label: string; description: string; dimensionsHint: string }
> = {
  small: {
    label: "Small",
    description: "Fits in a hatchback or small car boot.",
    dimensionsHint: "Good for boxes, lamps, chairs, and side tables.",
  },
  medium: {
    label: "Medium",
    description: "Single-item furniture or one bulky appliance.",
    dimensionsHint: "Think desks, washing machines, mattresses, or two-seaters.",
  },
  large: {
    label: "Large",
    description: "Multiple bulky items, heavy pieces, or awkward loads.",
    dimensionsHint: "Best for wardrobes, large sofas, or stacked furniture pieces.",
  },
};

export const DETOUR_RADIUS_PRESETS = [
  {
    value: 2,
    label: "2km",
    tone: "Tight route",
    helper: "Best when you only want pickups almost exactly on your corridor.",
  },
  {
    value: 5,
    label: "5km",
    tone: "Flexible",
    helper: "A good default for metro spare-capacity jobs.",
  },
  {
    value: 10,
    label: "10km",
    tone: "Open to detours",
    helper: "Wider pickup radius, more matches, and longer route deviations.",
  },
] as const;

export const SPECIAL_NOTES_PRESETS = [
  "Tail-lift unavailable.",
  "Apartment access OK.",
  "Marketplace pickup friendly.",
  "Weekdays only.",
  "Fragile items only.",
  "Happy to help load curbside.",
] as const;

export const BOOKING_CANCELLATION_REASONS: Array<{
  value: BookingCancellationReasonCode;
  label: string;
  description: string;
}> = [
  {
    value: "carrier_unavailable",
    label: "Carrier unavailable",
    description: "Driver or vehicle can no longer complete the trip.",
  },
  {
    value: "customer_changed_plans",
    label: "Customer changed plans",
    description: "Customer no longer needs this booking.",
  },
  {
    value: "payment_failed",
    label: "Payment failed",
    description: "Authorization failed or payment could not be recovered in time.",
  },
  {
    value: "no_response",
    label: "No response",
    description: "One side stopped responding within the required window.",
  },
  {
    value: "safety_concern",
    label: "Safety concern",
    description: "The booking was cancelled for trust, conduct, or site-safety reasons.",
  },
];

export const BOOKING_PAYMENT_LABELS: Record<BookingPaymentStatus, string> = {
  pending: "Payment pending",
  authorized: "Card authorized",
  captured: "Payment captured",
  capture_failed: "Capture failed",
  refunded: "Refunded",
  failed: "Payment failed",
  authorization_cancelled: "Authorization cancelled",
};

export const DISPUTE_CATEGORY_GUIDANCE = {
  damage: {
    heading: "Show the damage clearly",
    prompt:
      "Include where the damage is, when you first noticed it, and whether the packaging was already affected.",
    evidence: "Upload close-up photos plus one wider photo showing the full item.",
  },
  no_show: {
    heading: "Document the missed handoff",
    prompt:
      "Tell us the agreed time window, how long you waited, and how you tried to contact the other party.",
    evidence: "Screenshots of call attempts or messages help us resolve faster.",
  },
  late: {
    heading: "Show the timing impact",
    prompt:
      "Tell us the promised time window, the actual arrival time, and what delay this caused.",
    evidence: "Include timestamped photos or messages if you have them.",
  },
  wrong_item: {
    heading: "Show what was expected versus received",
    prompt:
      "Describe the item mismatch clearly and note any labels, marketplace screenshots, or distinguishing details.",
    evidence: "Upload a photo of the received item and, if possible, the expected listing photo.",
  },
  overcharge: {
    heading: "Show the price mismatch",
    prompt:
      "Tell us which amount you expected, what you were asked to pay, and whether stairs/helper add-ons were discussed.",
    evidence: "Receipts, messages, or screenshots of the agreed price are most helpful.",
  },
  other: {
    heading: "Tell us what happened",
    prompt:
      "Be specific about the issue, when it happened, and what outcome you need from ops.",
    evidence: "Upload any photo or screenshot that helps explain the problem quickly.",
  },
} as const;

export const PRIVATE_BUCKETS = {
  carrierDocuments: "carrier-documents",
  vehiclePhotos: "vehicle-photos",
  itemPhotos: "item-photos",
  proofPhotos: "proof-photos",
} as const;
