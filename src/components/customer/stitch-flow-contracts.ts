import {
  stitchAccessDefaults,
  stitchAccountRows,
  stitchActiveBooking,
  stitchBookingHistory,
  stitchDriverMatches,
  stitchItems,
  stitchPriceBreakdowns,
  stitchTimelineSteps,
  stitchTimingOptions,
  stitchTimeWindows,
  type StitchAccessPoint,
  type StitchDriverMatch,
  type StitchItem,
  type StitchItemCategory,
  type StitchPriceBreakdown,
  type StitchTimeWindowOption,
  type StitchTimingOption,
} from "@/components/customer/stitch-flow-data";
import type { LiveMoveOffer } from "@/components/customer/move-live-data";
import type { BookingPriceBreakdown } from "@/types/booking";

const VEHICLE_TYPE_LABELS = {
  van: "Van",
  ute: "Ute",
  small_truck: "Small truck",
  large_truck: "Large truck",
  trailer: "Trailer",
} as const;

export type CustomerFlowDataMode = "mock" | "live";

export interface CustomerFlowRouteDraft {
  pickup: string;
  pickupNote: string;
  dropoff: string;
  dropoffNote: string;
}

export interface CustomerFlowSelectedItem {
  itemId: string;
  category: StitchItemCategory;
  label: string;
  variantId: string;
  variantLabel: string;
  quantity: number;
  helperRecommended: boolean;
  basePriceCents: number;
  notes: string;
  photoStatus: "missing" | "mock_attached" | "uploaded";
  photoPath?: string | null;
  photoPreviewUrl?: string | null;
}

export interface CustomerFlowAccessDraft {
  pickup: StitchAccessPoint;
  dropoff: StitchAccessPoint;
  customerCanHelp: boolean;
}

export interface CustomerFlowTimingDraft {
  dateOptionId: string;
  windowOptionId: string;
  openNearbyDays: boolean;
  openAnyWindow: boolean;
}

export interface CustomerFlowMatchCard {
  match: StitchDriverMatch;
  price: StitchPriceBreakdown;
  matchExplanation: string;
  trustSummary: string;
  source: CustomerFlowDataMode;
  offerId?: string | null;
  listingId?: string | null;
}

export interface CustomerFlowBookingPresenter {
  statusLabel: string;
  routeLabel: string;
  driverName: string;
  totalCents: number;
  proofRequired: boolean;
  receiptReady: boolean;
}

export interface CustomerFlowViewModel {
  mode: CustomerFlowDataMode;
  route: CustomerFlowRouteDraft;
  items: StitchItem[];
  selectedItem: CustomerFlowSelectedItem;
  selectedItems: CustomerFlowSelectedItem[];
  access: CustomerFlowAccessDraft;
  dateOptions: StitchTimingOption[];
  timeWindows: StitchTimeWindowOption[];
  timing: CustomerFlowTimingDraft;
  matches: CustomerFlowMatchCard[];
  activeBooking: CustomerFlowBookingPresenter;
  timeline: typeof stitchTimelineSteps;
  bookingHistory: typeof stitchBookingHistory;
  accountRows: typeof stitchAccountRows;
}

export function createDefaultCustomerFlowRoute(): CustomerFlowRouteDraft {
  return {
    pickup: "Surry Hills NSW",
    pickupNote: "Apartment pickup, lift available",
    dropoff: "Marrickville NSW",
    dropoffNote: "Townhouse drop-off, easy parking",
  };
}

export function createDefaultCustomerFlowAccess(): CustomerFlowAccessDraft {
  return {
    pickup: stitchAccessDefaults.pickup,
    dropoff: stitchAccessDefaults.dropoff,
    customerCanHelp: true,
  };
}

export function createDefaultCustomerFlowTiming(): CustomerFlowTimingDraft {
  return {
    dateOptionId: stitchTimingOptions[0]?.id ?? "",
    windowOptionId: stitchTimeWindows[0]?.id ?? "",
    openNearbyDays: true,
    openAnyWindow: false,
  };
}

export function getSelectedCustomerFlowItem({
  itemId,
  variantId,
  quantity,
  photoAttached,
  photoPath,
  photoPreviewUrl,
}: {
  itemId: string;
  variantId?: string;
  quantity?: number;
  photoAttached?: boolean;
  photoPath?: string | null;
  photoPreviewUrl?: string | null;
}): CustomerFlowSelectedItem {
  const item = stitchItems.find((entry) => entry.id === itemId) ?? stitchItems[0];
  const variant =
    item?.variants.find((entry) => entry.id === variantId) ??
    item?.variants.find((entry) => entry.id === item.selectedVariantId) ??
    item?.variants[0];

  if (!item || !variant) {
    throw new Error("Stitch customer flow requires at least one mock item and variant.");
  }

  return {
    itemId: item.id,
    category: item.category,
    label: item.label,
    variantId: variant.id,
    variantLabel: variant.label,
    quantity: Math.max(1, quantity ?? item.quantity),
    helperRecommended: variant.helperRecommended,
    basePriceCents: variant.basePriceCents,
    notes: variant.notes,
    photoStatus: photoPath ? "uploaded" : photoAttached ? "mock_attached" : "missing",
    photoPath: photoPath ?? null,
    photoPreviewUrl: photoPreviewUrl ?? null,
  };
}

export function getSelectedCustomerFlowItems(
  entries: Array<{
    itemId: string;
    variantId?: string;
    quantity?: number;
    photoAttached?: boolean;
    photoPath?: string | null;
    photoPreviewUrl?: string | null;
  }>,
) {
  return entries.map((entry) => getSelectedCustomerFlowItem(entry));
}

export function presentCustomerFlowMatches(): CustomerFlowMatchCard[] {
  return stitchDriverMatches.map((match) => {
    const price = getCustomerFlowPrice(match.priceBreakdownId);

    return {
      match,
      price,
      matchExplanation: `${match.driverName.split(" ")[0]} is already travelling this corridor in the selected window.`,
      trustSummary: match.trustSignals.join(" · "),
      source: "mock",
      offerId: null,
      listingId: null,
    };
  });
}

function toStitchPriceBreakdown({
  id,
  driverMatchId,
  pricing,
}: {
  id: string;
  driverMatchId: string;
  pricing: BookingPriceBreakdown;
}): StitchPriceBreakdown {
  return {
    id,
    driverMatchId,
    currency: "AUD",
    basePriceCents: pricing.basePriceCents,
    stairsCents: pricing.stairsFeeCents,
    helperCents: pricing.helperFeeCents + pricing.secondMoverFeeCents,
    bookingFeeCents: 0,
    platformCommissionCents: pricing.platformFeeCents,
    totalCents: pricing.totalPriceCents,
    lines: [
      { id: `${id}-base`, label: "Base route price", amountCents: pricing.basePriceCents },
      { id: `${id}-stairs`, label: "Stairs and access", amountCents: pricing.stairsFeeCents },
      { id: `${id}-helper`, label: "Second mover / helper", amountCents: pricing.helperFeeCents + pricing.secondMoverFeeCents },
      { id: `${id}-adjustment`, label: "Adjustment", amountCents: pricing.adjustmentFeeCents },
      { id: `${id}-gst`, label: "GST", amountCents: pricing.gstCents },
    ].filter((line) => line.amountCents > 0),
  };
}

export function presentLiveCustomerFlowMatches(liveOffers: LiveMoveOffer[]): CustomerFlowMatchCard[] {
  return liveOffers.map(({ offer, trip }, index) => {
    const vehicleType = VEHICLE_TYPE_LABELS[trip.vehicle.type] ?? "Vehicle";
    const match: StitchDriverMatch = {
      id: offer.id,
      driverName: trip.carrier.businessName,
      vehicleLabel: `${vehicleType}${trip.vehicle.regoPlate ? ` · ${trip.vehicle.regoPlate}` : ""}`,
      routeLabel: trip.route.label || `${trip.route.originSuburb} → ${trip.route.destinationSuburb}`,
      matchRank: index + 1,
      matchScore: Math.round(offer.rankingScore),
      accentLabel: offer.matchExplanation,
      trustSignals: [
        trip.carrier.isVerified ? "Verified carrier" : "Carrier profile",
        `${trip.carrier.averageRating.toFixed(1)} rating`,
        `${trip.remainingCapacityPct}% capacity free`,
      ],
      etaWindow: `${trip.timeWindow.replaceAll("_", " ")} · ${trip.tripDate}`,
      priceBreakdownId: `live-price-${offer.id}`,
    };

    return {
      match,
      price: toStitchPriceBreakdown({
        id: `live-price-${offer.id}`,
        driverMatchId: offer.id,
        pricing: offer.pricing,
      }),
      matchExplanation: offer.matchExplanation,
      trustSummary: match.trustSignals.join(" · "),
      source: "live",
      offerId: offer.id,
      listingId: offer.listingId,
    };
  });
}

export function getCustomerFlowPrice(priceBreakdownId: string) {
  const price = stitchPriceBreakdowns.find((entry) => entry.id === priceBreakdownId) ?? stitchPriceBreakdowns[0];

  if (!price) {
    throw new Error("Stitch customer flow requires at least one price breakdown.");
  }

  return price;
}

export function presentCustomerFlowBooking(): CustomerFlowBookingPresenter {
  return {
    statusLabel: stitchActiveBooking.statusLabel,
    routeLabel: stitchActiveBooking.routeLabel,
    driverName: stitchActiveBooking.driverName,
    totalCents: stitchActiveBooking.totalCents,
    proofRequired: true,
    receiptReady: true,
  };
}

export function validateCustomerFlowDraft({
  route,
  selectedItem,
  selectedItems,
  access,
  timing,
}: {
  route: CustomerFlowRouteDraft;
  selectedItem?: CustomerFlowSelectedItem | null;
  selectedItems?: CustomerFlowSelectedItem[];
  access: CustomerFlowAccessDraft;
  timing: CustomerFlowTimingDraft;
}) {
  const errors: string[] = [];
  const itemsToValidate = selectedItems?.length ? selectedItems : selectedItem ? [selectedItem] : [];

  if (!route.pickup.trim()) errors.push("Pickup is required.");
  if (!route.dropoff.trim()) errors.push("Drop-off is required.");
  if (itemsToValidate.length < 1) errors.push("Add at least one item.");
  for (const item of itemsToValidate) {
    if (!item.itemId || !item.variantId) errors.push("Each item needs a type and variant.");
    if (item.quantity < 1) errors.push("Quantity must be at least one.");
  }
  if (access.pickup.stairs < 0 || access.dropoff.stairs < 0) errors.push("Stairs cannot be negative.");
  if (!timing.dateOptionId) errors.push("A date option is required.");
  if (!timing.windowOptionId) errors.push("A time window is required.");

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function createMockCustomerFlowViewModel({
  route = createDefaultCustomerFlowRoute(),
  access = createDefaultCustomerFlowAccess(),
  timing = createDefaultCustomerFlowTiming(),
  selectedItemId = stitchItems[0]?.id ?? "",
  selectedItems,
  selectedVariantId,
  selectedQuantity,
  photoAttached,
}: {
  route?: CustomerFlowRouteDraft;
  access?: CustomerFlowAccessDraft;
  timing?: CustomerFlowTimingDraft;
  selectedItemId?: string;
  selectedItems?: Array<{
    itemId: string;
    variantId?: string;
    quantity?: number;
    photoAttached?: boolean;
    photoPath?: string | null;
    photoPreviewUrl?: string | null;
  }>;
  selectedVariantId?: string;
  selectedQuantity?: number;
  photoAttached?: boolean;
} = {}): CustomerFlowViewModel {
  const selectedItemEntries = selectedItems?.length
    ? selectedItems
    : [{
        itemId: selectedItemId,
        variantId: selectedVariantId,
        quantity: selectedQuantity,
        photoAttached,
      }];
  const selectedFlowItems = getSelectedCustomerFlowItems(selectedItemEntries);
  const selectedItem = selectedFlowItems[0] ?? getSelectedCustomerFlowItem({
    itemId: selectedItemId,
    variantId: selectedVariantId,
    quantity: selectedQuantity,
    photoAttached,
  });

  return {
    mode: "mock",
    route,
    items: stitchItems,
    selectedItem,
    selectedItems: selectedFlowItems,
    access,
    dateOptions: stitchTimingOptions,
    timeWindows: stitchTimeWindows,
    timing,
    matches: presentCustomerFlowMatches(),
    activeBooking: presentCustomerFlowBooking(),
    timeline: stitchTimelineSteps,
    bookingHistory: stitchBookingHistory,
    accountRows: stitchAccountRows,
  };
}
