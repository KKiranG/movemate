import type { AddressValue } from "@/components/shared/google-autocomplete-input";
import type { MoveRequestInput } from "@/lib/validation/move-request";
import type { MoveRequest } from "@/types/move-request";
import type { ItemCategory, TimeWindow } from "@/types/trip";

export const MOVE_REQUEST_DRAFT_STORAGE_KEY = "moverrr:customer-move-request-draft";

export interface MoveRequestDraft {
  pickup: AddressValue | null;
  dropoff: AddressValue | null;
  itemDescription: string;
  itemCategory: ItemCategory;
  itemSizeClass: "" | "S" | "M" | "L" | "XL";
  itemWeightBand: "" | "under_20kg" | "20_to_50kg" | "50_to_100kg" | "over_100kg";
  itemDimensions: string;
  itemWeightKg: string;
  preferredDate: string;
  preferredTimeWindow: TimeWindow;
  pickupAccessNotes: string;
  dropoffAccessNotes: string;
  needsStairs: boolean;
  needsHelper: boolean;
  customerMoverPreference: "one_mover" | "customer_help" | "two_movers";
  stairsLevelPickup: "none" | "low" | "medium" | "high";
  stairsLevelDropoff: "none" | "low" | "medium" | "high";
  liftAvailablePickup: boolean;
  liftAvailableDropoff: boolean;
  specialInstructions: string;
  persistedMoveRequestId: string | null;
  persistedFingerprint: string | null;
}

const DEFAULT_MOVE_REQUEST_DRAFT: MoveRequestDraft = {
  pickup: null,
  dropoff: null,
  itemDescription: "",
  itemCategory: "furniture",
  itemSizeClass: "",
  itemWeightBand: "",
  itemDimensions: "",
  itemWeightKg: "",
  preferredDate: "",
  preferredTimeWindow: "flexible",
  pickupAccessNotes: "",
  dropoffAccessNotes: "",
  needsStairs: false,
  needsHelper: false,
  customerMoverPreference: "one_mover" as const,
  stairsLevelPickup: "none" as const,
  stairsLevelDropoff: "none" as const,
  liftAvailablePickup: false,
  liftAvailableDropoff: false,
  specialInstructions: "",
  persistedMoveRequestId: null,
  persistedFingerprint: null,
};

function normaliseAddressValue(value: unknown): AddressValue | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<AddressValue>;

  if (
    typeof candidate.label !== "string" ||
    typeof candidate.suburb !== "string" ||
    typeof candidate.postcode !== "string" ||
    typeof candidate.latitude !== "number" ||
    typeof candidate.longitude !== "number"
  ) {
    return null;
  }

  return {
    label: candidate.label,
    suburb: candidate.suburb,
    postcode: candidate.postcode,
    latitude: candidate.latitude,
    longitude: candidate.longitude,
  };
}

export function createDefaultMoveRequestDraft() {
  return {
    ...DEFAULT_MOVE_REQUEST_DRAFT,
  } satisfies MoveRequestDraft;
}

export function normaliseMoveRequestDraft(value: unknown) {
  const base = createDefaultMoveRequestDraft();

  if (!value || typeof value !== "object") {
    return base;
  }

  const candidate = value as Partial<MoveRequestDraft> & {
    moveRequestId?: string | null;
  };

  return {
    pickup: normaliseAddressValue(candidate.pickup),
    dropoff: normaliseAddressValue(candidate.dropoff),
    itemDescription:
      typeof candidate.itemDescription === "string" ? candidate.itemDescription : base.itemDescription,
    itemCategory:
      candidate.itemCategory === "furniture" ||
      candidate.itemCategory === "boxes" ||
      candidate.itemCategory === "appliance" ||
      candidate.itemCategory === "fragile" ||
      candidate.itemCategory === "other"
        ? candidate.itemCategory
        : base.itemCategory,
    itemSizeClass:
      candidate.itemSizeClass === "S" ||
      candidate.itemSizeClass === "M" ||
      candidate.itemSizeClass === "L" ||
      candidate.itemSizeClass === "XL"
        ? candidate.itemSizeClass
        : "",
    itemWeightBand:
      candidate.itemWeightBand === "under_20kg" ||
      candidate.itemWeightBand === "20_to_50kg" ||
      candidate.itemWeightBand === "50_to_100kg" ||
      candidate.itemWeightBand === "over_100kg"
        ? candidate.itemWeightBand
        : "",
    itemDimensions:
      typeof candidate.itemDimensions === "string" ? candidate.itemDimensions : base.itemDimensions,
    itemWeightKg:
      typeof candidate.itemWeightKg === "string" ? candidate.itemWeightKg : base.itemWeightKg,
    preferredDate:
      typeof candidate.preferredDate === "string" ? candidate.preferredDate : base.preferredDate,
    preferredTimeWindow:
      candidate.preferredTimeWindow === "morning" ||
      candidate.preferredTimeWindow === "afternoon" ||
      candidate.preferredTimeWindow === "evening" ||
      candidate.preferredTimeWindow === "flexible"
        ? candidate.preferredTimeWindow
        : base.preferredTimeWindow,
    pickupAccessNotes:
      typeof candidate.pickupAccessNotes === "string"
        ? candidate.pickupAccessNotes
        : base.pickupAccessNotes,
    dropoffAccessNotes:
      typeof candidate.dropoffAccessNotes === "string"
        ? candidate.dropoffAccessNotes
        : base.dropoffAccessNotes,
    needsStairs:
      typeof candidate.needsStairs === "boolean" ? candidate.needsStairs : base.needsStairs,
    needsHelper:
      typeof candidate.needsHelper === "boolean" ? candidate.needsHelper : base.needsHelper,
    specialInstructions:
      typeof candidate.specialInstructions === "string"
        ? candidate.specialInstructions
        : base.specialInstructions,
    customerMoverPreference:
      candidate.customerMoverPreference === "one_mover" ||
      candidate.customerMoverPreference === "customer_help" ||
      candidate.customerMoverPreference === "two_movers"
        ? candidate.customerMoverPreference
        : base.customerMoverPreference,
    stairsLevelPickup:
      candidate.stairsLevelPickup === "none" ||
      candidate.stairsLevelPickup === "low" ||
      candidate.stairsLevelPickup === "medium" ||
      candidate.stairsLevelPickup === "high"
        ? candidate.stairsLevelPickup
        : base.stairsLevelPickup,
    stairsLevelDropoff:
      candidate.stairsLevelDropoff === "none" ||
      candidate.stairsLevelDropoff === "low" ||
      candidate.stairsLevelDropoff === "medium" ||
      candidate.stairsLevelDropoff === "high"
        ? candidate.stairsLevelDropoff
        : base.stairsLevelDropoff,
    liftAvailablePickup:
      typeof candidate.liftAvailablePickup === "boolean"
        ? candidate.liftAvailablePickup
        : base.liftAvailablePickup,
    liftAvailableDropoff:
      typeof candidate.liftAvailableDropoff === "boolean"
        ? candidate.liftAvailableDropoff
        : base.liftAvailableDropoff,
    persistedMoveRequestId:
      typeof candidate.persistedMoveRequestId === "string"
        ? candidate.persistedMoveRequestId
        : typeof candidate.moveRequestId === "string"
          ? candidate.moveRequestId
          : null,
    persistedFingerprint:
      typeof candidate.persistedFingerprint === "string" ? candidate.persistedFingerprint : null,
  } satisfies MoveRequestDraft;
}

export function readMoveRequestDraft() {
  if (typeof window === "undefined") {
    return createDefaultMoveRequestDraft();
  }

  const raw = window.sessionStorage.getItem(MOVE_REQUEST_DRAFT_STORAGE_KEY);

  if (!raw) {
    return createDefaultMoveRequestDraft();
  }

  try {
    return normaliseMoveRequestDraft(JSON.parse(raw));
  } catch {
    window.sessionStorage.removeItem(MOVE_REQUEST_DRAFT_STORAGE_KEY);
    return createDefaultMoveRequestDraft();
  }
}

export function writeMoveRequestDraft(draft: MoveRequestDraft) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    MOVE_REQUEST_DRAFT_STORAGE_KEY,
    JSON.stringify(normaliseMoveRequestDraft(draft)),
  );
}

export function clearMoveRequestDraft() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(MOVE_REQUEST_DRAFT_STORAGE_KEY);
}

// Category-to-description fallback so the server always receives a non-empty
// itemDescription even when the intake's optional note field is blank.
const CATEGORY_DESCRIPTION_FALLBACK: Record<string, string> = {
  furniture: "Furniture",
  boxes: "Boxes",
  appliance: "Appliance",
  fragile: "Fragile item",
  other: "Bulky item",
};

export function toMoveRequestInputFromDraft(draft: MoveRequestDraft): MoveRequestInput | null {
  if (!draft.pickup || !draft.dropoff) {
    return null;
  }

  // Derive description: prefer the customer's note; fall back to category label.
  const derivedDescription =
    draft.itemDescription.trim() ||
    draft.specialInstructions.trim() ||
    CATEGORY_DESCRIPTION_FALLBACK[draft.itemCategory] ||
    "Item";

  return {
    itemDescription: derivedDescription,
    itemCategory: draft.itemCategory,
    itemSizeClass: draft.itemSizeClass || undefined,
    itemWeightBand: draft.itemWeightBand || undefined,
    itemDimensions: draft.itemDimensions.trim() || undefined,
    itemWeightKg: draft.itemWeightKg.trim() ? Number(draft.itemWeightKg) : undefined,
    itemPhotoUrls: [],
    pickupAddress: draft.pickup.label,
    pickupSuburb: draft.pickup.suburb,
    pickupPostcode: draft.pickup.postcode,
    pickupLatitude: draft.pickup.latitude,
    pickupLongitude: draft.pickup.longitude,
    pickupAccessNotes: draft.pickupAccessNotes.trim() || undefined,
    dropoffAddress: draft.dropoff.label,
    dropoffSuburb: draft.dropoff.suburb,
    dropoffPostcode: draft.dropoff.postcode,
    dropoffLatitude: draft.dropoff.latitude,
    dropoffLongitude: draft.dropoff.longitude,
    dropoffAccessNotes: draft.dropoffAccessNotes.trim() || undefined,
    preferredDate: draft.preferredDate || undefined,
    preferredTimeWindow: draft.preferredTimeWindow,
    needsStairs: draft.needsStairs,
    needsHelper: draft.needsHelper,
    customerMoverPreference: draft.customerMoverPreference,
    stairsLevelPickup: draft.stairsLevelPickup,
    stairsLevelDropoff: draft.stairsLevelDropoff,
    liftAvailablePickup: draft.liftAvailablePickup,
    liftAvailableDropoff: draft.liftAvailableDropoff,
    specialInstructions: draft.specialInstructions.trim() || undefined,
  } satisfies MoveRequestInput;
}

export function getMoveRequestDraftFingerprint(draft: MoveRequestDraft) {
  const payload = toMoveRequestInputFromDraft(draft);

  if (!payload) {
    return null;
  }

  return JSON.stringify(payload);
}

export function isMoveRequestDraftReady(draft: MoveRequestDraft) {
  return Boolean(toMoveRequestInputFromDraft(draft));
}

export function getMoveRequestDraftFirstIncompleteStep(draft: MoveRequestDraft) {
  // Intake only requires route + category. Description/size/weight are collected
  // later in the booking form after the customer selects an offer.
  if (!draft.pickup || !draft.dropoff) {
    return "route" as const;
  }

  return null;
}

export function draftFromMoveRequest(moveRequest: MoveRequest) {
  const draft = {
    pickup: {
      label: moveRequest.route.pickupAddress,
      suburb: moveRequest.route.pickupSuburb,
      postcode: moveRequest.route.pickupPostcode,
      latitude: moveRequest.route.pickupLatitude,
      longitude: moveRequest.route.pickupLongitude,
    },
    dropoff: {
      label: moveRequest.route.dropoffAddress,
      suburb: moveRequest.route.dropoffSuburb,
      postcode: moveRequest.route.dropoffPostcode,
      latitude: moveRequest.route.dropoffLatitude,
      longitude: moveRequest.route.dropoffLongitude,
    },
    itemDescription: moveRequest.item.description,
    itemCategory: moveRequest.item.category,
    itemSizeClass: moveRequest.item.sizeClass ?? "",
    itemWeightBand: moveRequest.item.weightBand ?? "",
    itemDimensions: moveRequest.item.dimensions ?? "",
    itemWeightKg:
      typeof moveRequest.item.weightKg === "number" ? String(moveRequest.item.weightKg) : "",
    preferredDate: moveRequest.route.preferredDate ?? "",
    preferredTimeWindow: moveRequest.route.preferredTimeWindow ?? "flexible",
    pickupAccessNotes: moveRequest.route.pickupAccessNotes ?? "",
    dropoffAccessNotes: moveRequest.route.dropoffAccessNotes ?? "",
    needsStairs: moveRequest.needsStairs,
    needsHelper: moveRequest.needsHelper,
    customerMoverPreference: moveRequest.customerMoverPreference ?? "one_mover",
    stairsLevelPickup: moveRequest.stairsLevelPickup ?? "none",
    stairsLevelDropoff: moveRequest.stairsLevelDropoff ?? "none",
    liftAvailablePickup: moveRequest.liftAvailablePickup ?? false,
    liftAvailableDropoff: moveRequest.liftAvailableDropoff ?? false,
    specialInstructions: moveRequest.specialInstructions ?? "",
    persistedMoveRequestId: moveRequest.id,
    persistedFingerprint: null,
  } satisfies MoveRequestDraft;

  return {
    ...draft,
    persistedFingerprint: getMoveRequestDraftFingerprint(draft),
  } satisfies MoveRequestDraft;
}

export function getMoveRequestResultsHref(moveRequestId?: string | null) {
  if (!moveRequestId) {
    return "/move/new/results";
  }

  return `/move/new/results?moveRequestId=${encodeURIComponent(moveRequestId)}`;
}

export function getMoveRequestOfferHref(params: {
  offerId: string;
  moveRequestId?: string | null;
}) {
  const query = params.moveRequestId
    ? `?moveRequestId=${encodeURIComponent(params.moveRequestId)}`
    : "";

  return `/move/new/results/${encodeURIComponent(params.offerId)}${query}`;
}

export function getMoveRequestFastMatchHref(moveRequestId?: string | null) {
  if (!moveRequestId) {
    return "/move/new/fastmatch";
  }

  return `/move/new/fastmatch?moveRequestId=${encodeURIComponent(moveRequestId)}`;
}

export function isPersistedMoveRequestReusable(draft: MoveRequestDraft) {
  const fingerprint = getMoveRequestDraftFingerprint(draft);

  return Boolean(
    fingerprint &&
      draft.persistedMoveRequestId &&
      draft.persistedFingerprint &&
      draft.persistedFingerprint === fingerprint,
  );
}
