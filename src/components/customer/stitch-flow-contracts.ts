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
}: {
  itemId: string;
  variantId?: string;
  quantity?: number;
  photoAttached?: boolean;
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
    photoStatus: photoAttached ? "mock_attached" : "missing",
  };
}

export function presentCustomerFlowMatches(): CustomerFlowMatchCard[] {
  return stitchDriverMatches.map((match) => {
    const price = getCustomerFlowPrice(match.priceBreakdownId);

    return {
      match,
      price,
      matchExplanation: `${match.driverName.split(" ")[0]} is already travelling this corridor in the selected window.`,
      trustSummary: match.trustSignals.join(" · "),
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
  access,
  timing,
}: {
  route: CustomerFlowRouteDraft;
  selectedItem: CustomerFlowSelectedItem;
  access: CustomerFlowAccessDraft;
  timing: CustomerFlowTimingDraft;
}) {
  const errors: string[] = [];

  if (!route.pickup.trim()) errors.push("Pickup is required.");
  if (!route.dropoff.trim()) errors.push("Drop-off is required.");
  if (!selectedItem.itemId || !selectedItem.variantId) errors.push("An item and variant are required.");
  if (selectedItem.quantity < 1) errors.push("Quantity must be at least one.");
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
  selectedVariantId,
  selectedQuantity,
  photoAttached,
}: {
  route?: CustomerFlowRouteDraft;
  access?: CustomerFlowAccessDraft;
  timing?: CustomerFlowTimingDraft;
  selectedItemId?: string;
  selectedVariantId?: string;
  selectedQuantity?: number;
  photoAttached?: boolean;
} = {}): CustomerFlowViewModel {
  const selectedItem = getSelectedCustomerFlowItem({
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
