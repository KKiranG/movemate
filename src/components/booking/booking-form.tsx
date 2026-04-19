"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Camera, Upload } from "lucide-react";

import { ManagePaymentMethodButton } from "@/components/customer/manage-payment-method-button";
import { FileSelectionPreview } from "@/components/ui/file-selection-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GoogleAutocompleteInput } from "@/components/shared/google-autocomplete-input";
import {
  ITEM_SIZE_DESCRIPTIONS,
  MANUAL_HANDLING_POLICY_LINES,
  PROHIBITED_ITEM_POLICY_LINES,
} from "@/lib/constants";
import { calculateBookingBreakdown } from "@/lib/pricing/breakdown";
import { getBookingTrustIssues } from "@/lib/validation/booking";
import { formatCurrency } from "@/lib/utils";
import type { MoveRequest } from "@/types/move-request";
import type { ItemCategory, Trip } from "@/types/trip";
import type { CustomerPaymentProfile } from "@/lib/data/customer-payments";

interface ResolvedAddress {
  label: string;
  suburb: string;
  postcode: string;
  latitude: number;
  longitude: number;
}

export type RequestMode = "single" | "fast_match";

interface BookingFormProps {
  trip: Trip;
  isAuthenticated: boolean;
  id?: string;
  requestMode: RequestMode;
  existingMoveRequest?: MoveRequest | null;
  initialOfferId?: string | null;
  customerPaymentProfile?: CustomerPaymentProfile | null;
  onRequestModeChange?: (mode: RequestMode) => void;
  onOptionsChange?: (options: {
    needsStairs: boolean;
    needsHelper: boolean;
  }) => void;
}

interface RequestSuccessState {
  moveRequestId: string;
  requestMode: RequestMode;
  requestCount: number;
}

type FormStage = "item" | "route" | "review";

const FORM_STAGES: FormStage[] = ["item", "route", "review"];

export function BookingForm({
  trip,
  isAuthenticated,
  id,
  requestMode,
  existingMoveRequest,
  initialOfferId,
  customerPaymentProfile,
  onRequestModeChange,
  onOptionsChange,
}: BookingFormProps) {
  const router = useRouter();
  const [pickup, setPickup] = useState<ResolvedAddress | null>(
    existingMoveRequest
      ? {
          label: existingMoveRequest.route.pickupAddress,
          suburb: existingMoveRequest.route.pickupSuburb,
          postcode: existingMoveRequest.route.pickupPostcode,
          latitude: existingMoveRequest.route.pickupLatitude,
          longitude: existingMoveRequest.route.pickupLongitude,
        }
      : null,
  );
  const [dropoff, setDropoff] = useState<ResolvedAddress | null>(
    existingMoveRequest
      ? {
          label: existingMoveRequest.route.dropoffAddress,
          suburb: existingMoveRequest.route.dropoffSuburb,
          postcode: existingMoveRequest.route.dropoffPostcode,
          latitude: existingMoveRequest.route.dropoffLatitude,
          longitude: existingMoveRequest.route.dropoffLongitude,
        }
      : null,
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [itemDescription, setItemDescription] = useState(existingMoveRequest?.item.description ?? "");
  const [itemCategory, setItemCategory] = useState<ItemCategory>(
    existingMoveRequest?.item.category ?? "furniture",
  );
  const [itemSizeClass, setItemSizeClass] = useState<"" | "S" | "M" | "L" | "XL">(
    existingMoveRequest?.item.sizeClass ?? "",
  );
  const [itemWeightBand, setItemWeightBand] = useState<
    "" | "under_20kg" | "20_to_50kg" | "50_to_100kg" | "over_100kg"
  >(existingMoveRequest?.item.weightBand ?? "");
  const [itemDimensions, setItemDimensions] = useState(existingMoveRequest?.item.dimensions ?? "");
  const [itemWeightKg, setItemWeightKg] = useState(
    existingMoveRequest?.item.weightKg ? String(existingMoveRequest.item.weightKg) : "",
  );
  const [pickupAccessNotes, setPickupAccessNotes] = useState(
    existingMoveRequest?.route.pickupAccessNotes ?? "",
  );
  const [dropoffAccessNotes, setDropoffAccessNotes] = useState(
    existingMoveRequest?.route.dropoffAccessNotes ?? "",
  );
  const [specialInstructions, setSpecialInstructions] = useState(
    existingMoveRequest?.specialInstructions ?? "",
  );
  const [needsStairs, setNeedsStairs] = useState(existingMoveRequest?.needsStairs ?? false);
  const [needsHelper, setNeedsHelper] = useState(existingMoveRequest?.needsHelper ?? false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStage, setSubmissionStage] = useState<
    "idle" | "uploading_photo" | "creating_move_request" | "creating_request"
  >("idle");
  const [successState, setSuccessState] = useState<RequestSuccessState | null>(null);
  const [activeStage, setActiveStage] = useState<FormStage>("item");
  const draftKey = useMemo(() => `moverrr:request-draft:${trip.id}`, [trip.id]);
  const moveRequestIdRef = useRef<string | null>(existingMoveRequest?.id ?? null);
  const stairsUnsupported = needsStairs && !trip.rules.stairsOk;
  const isAddressResolved = Boolean(pickup && dropoff);
  const pricing = calculateBookingBreakdown({
    basePriceCents: trip.priceCents,
    needsStairs,
    stairsExtraCents: trip.rules.stairsExtraCents,
    needsHelper,
    helperExtraCents: trip.rules.helperExtraCents,
  });

  const defaultPickup = useMemo(
    () => `${trip.route.originSuburb} NSW ${trip.route.originPostcode ?? ""}`.trim(),
    [trip.route.originPostcode, trip.route.originSuburb],
  );
  const defaultDropoff = useMemo(
    () =>
      `${trip.route.destinationSuburb} NSW ${trip.route.destinationPostcode ?? ""}`.trim(),
    [trip.route.destinationPostcode, trip.route.destinationSuburb],
  );
  const accountReturnHref = useMemo(() => {
    const tripParams = new URLSearchParams();

    if (moveRequestIdRef.current) {
      tripParams.set("moveRequestId", moveRequestIdRef.current);
    } else if (existingMoveRequest?.id) {
      tripParams.set("moveRequestId", existingMoveRequest.id);
    }

    if (initialOfferId) {
      tripParams.set("offerId", initialOfferId);
    }

    const returnTo = `/trip/${trip.id}${tripParams.toString() ? `?${tripParams.toString()}` : ""}`;
    const next = new URLSearchParams({
      focus: "payments",
      returnTo,
    });

    return `/account?${next.toString()}`;
  }, [existingMoveRequest?.id, initialOfferId, trip.id]);
  const trustIssues = useMemo(
    () =>
      getBookingTrustIssues({
        itemDescription,
        specialInstructions,
        itemSizeClass: itemSizeClass || undefined,
        itemWeightKg: itemWeightKg.trim() ? Number(itemWeightKg) : undefined,
        itemWeightBand: itemWeightBand || undefined,
        needsHelper,
        pickupAccessNotes,
        dropoffAccessNotes,
        itemPhotoCount: photoFile ? 1 : (existingMoveRequest?.item.photoUrls.length ?? 0),
      }),
    [
      dropoffAccessNotes,
      itemDescription,
      itemSizeClass,
      itemWeightKg,
      itemWeightBand,
      needsHelper,
      pickupAccessNotes,
      photoFile,
      specialInstructions,
      existingMoveRequest?.item.photoUrls.length,
    ],
  );
  const blockingTrustIssues = trustIssues.filter((issue) => issue.severity === "blocking");
  const warningTrustIssues = trustIssues.filter((issue) => issue.severity === "warning");
  const helperWarning = warningTrustIssues.find(
    (issue) => issue.code === "manual_handling_helper_recommended",
  );
  const accessWarning = warningTrustIssues.find(
    (issue) => issue.code === "manual_handling_access_notes_missing",
  );
  const reviewReady =
    isAddressResolved &&
    Boolean(itemSizeClass) &&
    Boolean(itemWeightBand) &&
    blockingTrustIssues.length === 0 &&
    !stairsUnsupported;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const draft = window.sessionStorage.getItem(draftKey);

    if (!draft) {
      return;
    }

    try {
      const parsed = JSON.parse(draft) as Partial<{
        itemDescription: string;
        itemCategory: ItemCategory;
        itemSizeClass: "" | "S" | "M" | "L" | "XL";
        itemWeightBand: "" | "under_20kg" | "20_to_50kg" | "50_to_100kg" | "over_100kg";
        itemDimensions: string;
        itemWeightKg: string;
        pickupAccessNotes: string;
        dropoffAccessNotes: string;
        specialInstructions: string;
        needsStairs: boolean;
        needsHelper: boolean;
        pickup: ResolvedAddress;
        dropoff: ResolvedAddress;
        requestMode: RequestMode;
      }>;

      if (parsed.itemDescription !== undefined) setItemDescription(parsed.itemDescription);
      if (parsed.itemCategory !== undefined) setItemCategory(parsed.itemCategory);
      if (parsed.itemSizeClass !== undefined) setItemSizeClass(parsed.itemSizeClass);
      if (parsed.itemWeightBand !== undefined) setItemWeightBand(parsed.itemWeightBand);
      if (parsed.itemDimensions !== undefined) setItemDimensions(parsed.itemDimensions);
      if (parsed.itemWeightKg !== undefined) setItemWeightKg(parsed.itemWeightKg);
      if (parsed.pickupAccessNotes !== undefined) setPickupAccessNotes(parsed.pickupAccessNotes);
      if (parsed.dropoffAccessNotes !== undefined) setDropoffAccessNotes(parsed.dropoffAccessNotes);
      if (parsed.specialInstructions !== undefined) setSpecialInstructions(parsed.specialInstructions);
      if (parsed.needsStairs !== undefined) setNeedsStairs(parsed.needsStairs);
      if (parsed.needsHelper !== undefined) setNeedsHelper(parsed.needsHelper);
      if (parsed.pickup !== undefined) setPickup(parsed.pickup);
      if (parsed.dropoff !== undefined) setDropoff(parsed.dropoff);
      if (parsed.requestMode !== undefined) onRequestModeChange?.(parsed.requestMode);
    } catch {
      window.sessionStorage.removeItem(draftKey);
    }
  }, [draftKey, onRequestModeChange]);

  useEffect(() => {
    onOptionsChange?.({ needsStairs, needsHelper });
  }, [needsStairs, needsHelper, onOptionsChange]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const payload = {
      itemDescription,
      itemCategory,
      itemSizeClass,
      itemWeightBand,
      itemDimensions,
      itemWeightKg,
      pickupAccessNotes,
      dropoffAccessNotes,
      specialInstructions,
      needsStairs,
      needsHelper,
      pickup,
      dropoff,
      requestMode,
    };

    window.sessionStorage.setItem(draftKey, JSON.stringify(payload));
  }, [
    draftKey,
    dropoff,
    dropoffAccessNotes,
    itemCategory,
    itemDescription,
    itemDimensions,
    itemSizeClass,
    itemWeightBand,
    itemWeightKg,
    needsHelper,
    needsStairs,
    pickup,
    pickupAccessNotes,
    requestMode,
    specialInstructions,
  ]);

  useEffect(() => {
    if (!photoFile || !photoFile.type.startsWith("image/")) {
      setPhotoPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(photoFile);
    setPhotoPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [photoFile]);

  function canReuseExistingMoveRequest() {
    if (!existingMoveRequest || photoFile) {
      return false;
    }

    if (!pickup || !dropoff) {
      return false;
    }

    return (
      itemDescription.trim() === existingMoveRequest.item.description &&
      itemCategory === existingMoveRequest.item.category &&
      (itemSizeClass || null) === (existingMoveRequest.item.sizeClass ?? null) &&
      (itemWeightBand || null) === (existingMoveRequest.item.weightBand ?? null) &&
      (itemDimensions.trim() || null) === (existingMoveRequest.item.dimensions ?? null) &&
      (itemWeightKg.trim() ? Number(itemWeightKg) : null) === (existingMoveRequest.item.weightKg ?? null) &&
      pickup.label === existingMoveRequest.route.pickupAddress &&
      pickup.suburb === existingMoveRequest.route.pickupSuburb &&
      pickup.postcode === existingMoveRequest.route.pickupPostcode &&
      pickup.latitude === existingMoveRequest.route.pickupLatitude &&
      pickup.longitude === existingMoveRequest.route.pickupLongitude &&
      (pickupAccessNotes.trim() || null) === (existingMoveRequest.route.pickupAccessNotes ?? null) &&
      dropoff.label === existingMoveRequest.route.dropoffAddress &&
      dropoff.suburb === existingMoveRequest.route.dropoffSuburb &&
      dropoff.postcode === existingMoveRequest.route.dropoffPostcode &&
      dropoff.latitude === existingMoveRequest.route.dropoffLatitude &&
      dropoff.longitude === existingMoveRequest.route.dropoffLongitude &&
      (dropoffAccessNotes.trim() || null) === (existingMoveRequest.route.dropoffAccessNotes ?? null) &&
      needsStairs === existingMoveRequest.needsStairs &&
      needsHelper === existingMoveRequest.needsHelper &&
      (specialInstructions.trim() || null) === (existingMoveRequest.specialInstructions ?? null)
    );
  }

  async function uploadPhotoIfNeeded() {
    if (!photoFile) {
      return [] as string[];
    }

    const formData = new FormData();
    formData.append("file", photoFile);
    formData.append("bucket", "item-photos");

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to upload item photo.");
    }

    return [payload.path as string];
  }

  async function createMoveRequest(itemPhotoUrls: string[]) {
    const response = await fetch("/api/move-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemDescription,
        itemCategory,
        itemSizeClass: itemSizeClass || undefined,
        itemWeightBand: itemWeightBand || undefined,
        itemDimensions: itemDimensions.trim() || undefined,
        itemWeightKg: itemWeightKg.trim() ? Number(itemWeightKg) : undefined,
        itemPhotoUrls,
        pickupAddress: pickup?.label,
        pickupSuburb: pickup?.suburb,
        pickupPostcode: pickup?.postcode,
        pickupLatitude: pickup?.latitude,
        pickupLongitude: pickup?.longitude,
        pickupAccessNotes: pickupAccessNotes.trim() || undefined,
        dropoffAddress: dropoff?.label,
        dropoffSuburb: dropoff?.suburb,
        dropoffPostcode: dropoff?.postcode,
        dropoffLatitude: dropoff?.latitude,
        dropoffLongitude: dropoff?.longitude,
        dropoffAccessNotes: dropoffAccessNotes.trim() || undefined,
        preferredDate: trip.tripDate,
        preferredTimeWindow: trip.timeWindow,
        needsStairs,
        needsHelper,
        specialInstructions: specialInstructions.trim() || undefined,
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to create move request.");
    }

    return payload.moveRequest as { id: string };
  }

  async function createSingleRequest(moveRequestId: string, reuseExistingMoveRequest: boolean) {
    const response = await fetch("/api/booking-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moveRequestId,
        ...(reuseExistingMoveRequest && initialOfferId
          ? { offerId: initialOfferId }
          : { listingId: trip.id }),
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to send request to this carrier.");
    }

    return payload as {
      bookingRequest: { id: string };
    };
  }

  async function createFastMatch(moveRequestId: string) {
    const response = await fetch("/api/booking-requests/fast-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moveRequestId,
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to start Fast Match.");
    }

    return payload as {
      bookingRequests: Array<{ id: string }>;
    };
  }

  function getStageIndex(stage: FormStage) {
    return FORM_STAGES.indexOf(stage);
  }

  function goToNextStage() {
    setError(null);

    if (activeStage === "item") {
      if (!itemDescription.trim()) {
        setError("Add a short item description before continuing.");
        return;
      }

      if (!itemSizeClass || !itemWeightBand) {
        setError("Choose the item size and weight band before continuing.");
        return;
      }

      if (blockingTrustIssues.length > 0) {
        setError(blockingTrustIssues[0]?.message ?? "Resolve the blocked item issues first.");
        return;
      }
    }

    if (activeStage === "route") {
      if (!reviewReady) {
        if (!pickup || !dropoff) {
          setError("Choose both pickup and dropoff addresses from the suggestions.");
          return;
        }

        if (stairsUnsupported) {
          setError("This route does not support stairs. Change the stairs selection or choose another trip.");
          return;
        }

        setError("Complete the access details before moving to review.");
        return;
      }
    }

    const nextStage = FORM_STAGES[getStageIndex(activeStage) + 1];

    if (nextStage) {
      setActiveStage(nextStage);
    }
  }

  function goToPreviousStage() {
    setError(null);
    const previousStage = FORM_STAGES[getStageIndex(activeStage) - 1];

    if (previousStage) {
      setActiveStage(previousStage);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isAuthenticated) {
      const next = new URLSearchParams({
        ...(existingMoveRequest ? { moveRequestId: existingMoveRequest.id } : {}),
        ...(initialOfferId ? { offerId: initialOfferId } : {}),
      }).toString();
      router.push(`/login?next=/trip/${trip.id}${next ? `?${next}` : ""}`);
      return;
    }

    if (!reviewReady) {
      setError("Finish the review details before sending the request.");
      return;
    }

    setIsSubmitting(true);

    try {
      setSubmissionStage("uploading_photo");
      const itemPhotoUrls = await uploadPhotoIfNeeded();
      setSubmissionStage("creating_move_request");
      const reuseExistingMoveRequest =
        moveRequestIdRef.current !== null && canReuseExistingMoveRequest();
      const moveRequest =
        !reuseExistingMoveRequest
          ? await createMoveRequest(itemPhotoUrls)
          : { id: moveRequestIdRef.current! };

      moveRequestIdRef.current = moveRequest.id;
      setSubmissionStage("creating_request");

      if (requestMode === "single") {
        const result = await createSingleRequest(moveRequest.id, reuseExistingMoveRequest);
        setSuccessState({
          moveRequestId: moveRequest.id,
          requestMode,
          requestCount: result.bookingRequest ? 1 : 0,
        });
      } else {
        const result = await createFastMatch(moveRequest.id);
        setSuccessState({
          moveRequestId: moveRequest.id,
          requestMode,
          requestCount: result.bookingRequests.length,
        });
      }

      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(draftKey);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to send the request.");
    } finally {
      setIsSubmitting(false);
      setSubmissionStage("idle");
    }
  }

  if (successState) {
    const shortReference = successState.moveRequestId.slice(0, 8).toUpperCase();

    return (
      <div className="grid gap-4 rounded-2xl border border-success/20 bg-success/5 p-4">
        <div>
          <p className="section-label">Request submitted</p>
          <h2 className="mt-1 text-lg text-text">
            {successState.requestMode === "single"
              ? "The carrier now has your request"
              : "Fast Match is now asking the next-best carriers"}
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            {successState.requestMode === "single"
              ? "The carrier reviews the route, fit, and access details in moverrr before anything becomes a live booking."
              : "moverrr sent this move request to up to three matching carriers and will stop the rest once one accepts."}
          </p>
        </div>
        <div className="rounded-xl border border-success/20 bg-background px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
            Move request reference
          </p>
          <p className="mt-2 text-2xl font-medium text-text">{shortReference}</p>
        </div>
        <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-secondary">
          <p>
            {successState.requestMode === "single"
              ? "The carrier can now accept, decline, or ask for one factual clarification round inside moverrr."
              : `Fast Match created ${successState.requestCount} live request${successState.requestCount === 1 ? "" : "s"} for this move.`}
          </p>
          <p className="mt-2">
            Exact street details and direct contact stay hidden until a carrier accepts and the booking becomes active.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/alerts">Go to alerts</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/search">Find another match</Link>
          </Button>
        </div>
      </div>
    );
  }

  const stageIndex = getStageIndex(activeStage);
  const completedProgressSteps = stageIndex;
  const flowProgressPercent = Math.round(((stageIndex + 1) / FORM_STAGES.length) * 100);

  return (
    <form id={id} className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-3 rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="section-label">Confirmation flow</p>
            <p className="mt-1 text-sm text-text">
              Step {stageIndex + 1} of {FORM_STAGES.length}
            </p>
          </div>
          <p className="text-xs text-text-secondary">
            {completedProgressSteps === FORM_STAGES.length - 1
              ? "Ready to send"
              : `${FORM_STAGES.length - (stageIndex + 1)} step${FORM_STAGES.length - (stageIndex + 1) === 1 ? "" : "s"} left`}
          </p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-accent transition-[width]"
            style={{ width: `${flowProgressPercent}%` }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {FORM_STAGES.map((stage, index) => {
            const active = stage === activeStage;
            const completed = index < stageIndex;
            const label =
              stage === "item" ? "Item" : stage === "route" ? "Route & access" : "Review";

            return (
              <div
                key={stage}
                className={`inline-flex min-h-[44px] items-center rounded-full px-3 text-sm ${
                  active
                    ? "bg-accent text-white"
                    : completed
                      ? "border border-success/20 bg-success/10 text-success"
                      : "border border-border bg-surface text-text-secondary"
                }`}
              >
                {index + 1}. {label}
              </div>
            );
          })}
        </div>
        <div>
          <h2 className="mt-1 text-lg text-text">
            {activeStage === "item"
              ? "Describe the item clearly"
              : activeStage === "route"
                ? "Confirm access and route fit"
                : "Review the request before sending"}
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            {activeStage === "item"
              ? "Give the carrier enough detail to judge fit without turning this into a freight-style quote form."
              : activeStage === "route"
                ? "Use exact addresses for matching. They stay hidden from the carrier until a booking is accepted."
                : "Check the route, pricing, and request path one more time before moverrr opens the carrier response window."}
          </p>
        </div>
      </div>

      {activeStage === "item" ? (
        <fieldset disabled={isSubmitting} className="grid gap-4">
          <label className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-text">What are you moving?</span>
              <span className="text-xs text-text-secondary">{itemDescription.length}/200</span>
            </div>
            <Input
              name="itemDescription"
              value={itemDescription}
              maxLength={200}
              onChange={(event) => setItemDescription(event.target.value)}
              placeholder="e.g. Three-seat sofa, Samsung fridge, 10 moving boxes"
              minLength={4}
              required
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-text">Category</span>
              <select
                name="itemCategory"
                className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
                value={itemCategory}
                onChange={(event) => setItemCategory(event.target.value as ItemCategory)}
              >
                <option value="furniture">Furniture</option>
                <option value="boxes">Boxes</option>
                <option value="appliance">Appliance</option>
                <option value="fragile">Fragile</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-text">Size class</span>
              <select
                name="itemSizeClass"
                className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
                value={itemSizeClass}
                onChange={(event) => setItemSizeClass(event.target.value as "" | "S" | "M" | "L" | "XL")}
                required
              >
                <option value="">Choose a size</option>
                {Object.entries(ITEM_SIZE_DESCRIPTIONS).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-text">How heavy is it to lift?</span>
              <select
                name="itemWeightBand"
                className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
                value={itemWeightBand}
                onChange={(event) =>
                  setItemWeightBand(
                    event.target.value as
                      | ""
                      | "under_20kg"
                      | "20_to_50kg"
                      | "50_to_100kg"
                      | "over_100kg",
                  )
                }
                required
              >
                <option value="">Choose the closest lift band</option>
                <option value="under_20kg">Light carry (under 20kg)</option>
                <option value="20_to_50kg">Bulky one-person lift (20 to 50kg)</option>
                <option value="50_to_100kg">Heavy item or careful two-person lift (50 to 100kg)</option>
                <option value="over_100kg">Very heavy or specialist check (over 100kg)</option>
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-text">Approx dimensions</span>
              <Input
                name="itemDimensions"
                value={itemDimensions}
                onChange={(event) => setItemDimensions(event.target.value)}
                placeholder="200cm x 90cm x 85cm"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-text">Approx weight if you know it</span>
            <Input
              name="itemWeightKg"
              type="number"
              min="0"
              max="500"
              step="0.1"
              value={itemWeightKg}
              onChange={(event) => setItemWeightKg(event.target.value)}
              placeholder="Optional exact weight in kg"
            />
          </label>

          <div className="space-y-3 rounded-xl border border-border p-3">
            <div>
              <p className="text-sm font-medium text-text">Size guide</p>
              <p className="mt-1 text-sm text-text-secondary">
                Match your item to the closest everyday size so the carrier can judge fit quickly.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-4">
              {Object.entries(ITEM_SIZE_DESCRIPTIONS).map(([value, config]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setItemSizeClass(value as "S" | "M" | "L" | "XL")}
                  className={`rounded-xl border p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 ${
                    itemSizeClass === value ? "border-accent bg-accent/10" : "border-border"
                  }`}
                >
                  <p className="text-sm font-medium text-text">{config.label}</p>
                  <p className="mt-1 text-sm text-text-secondary">{config.description}</p>
                  <p className="mt-2 text-xs text-text-secondary">{config.dimensionsHint}</p>
                </button>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-text">Item photo</span>
            <div className="space-y-2">
              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white focus-within:ring-2 focus-within:ring-accent/25 active:opacity-80">
                  <Camera className="h-4 w-4" />
                  Take photo
                  <input
                    type="file"
                    accept="image/*,image/heic,image/heif"
                    capture="environment"
                    className="sr-only"
                    onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)}
                  />
                </label>
                <label className="hidden min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-text focus-within:ring-2 focus-within:ring-accent/25 active:bg-black/[0.04] sm:flex dark:active:bg-white/[0.08]">
                  <Upload className="h-4 w-4" />
                  Upload file
                  <input
                    type="file"
                    accept="image/*,image/heic,image/heif"
                    capture="environment"
                    className="sr-only"
                    onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
              {photoFile ? (
                <FileSelectionPreview
                  file={photoFile}
                  imageUrl={photoPreviewUrl}
                  label="Item photo"
                  onRemove={() => setPhotoFile(null)}
                />
              ) : null}
            </div>
          </label>

          <div className="space-y-3 rounded-xl border border-border bg-black/[0.02] p-3 dark:bg-white/[0.04]">
            <div>
              <p className="text-sm font-medium text-text">Safety policy before you send</p>
              <p className="mt-1 text-sm text-text-secondary">
                moverrr is for ordinary spare-capacity moves, not specialist disposal or unsafe loads.
              </p>
            </div>
            <div className="grid gap-2">
              {PROHIBITED_ITEM_POLICY_LINES.map((line) => (
                <p key={line} className="text-sm text-text-secondary">
                  {line}
                </p>
              ))}
            </div>
          </div>

          {trustIssues.length > 0 ? (
            <div
              className={`rounded-xl border p-3 ${
                blockingTrustIssues.length > 0
                  ? "border-warning/20 bg-warning/10"
                  : "border-border bg-black/[0.02] dark:bg-white/[0.04]"
              }`}
            >
              <p className="text-sm font-medium text-text">
                {blockingTrustIssues.length > 0
                  ? "Resolve these before you continue"
                  : "Manual-handling and trust prompts"}
              </p>
              {blockingTrustIssues.length > 0 ? (
                <p className="mt-1 text-sm text-text-secondary">
                  Prohibited items stay blocked because they do not belong in moverrr&apos;s spare-capacity marketplace.
                </p>
              ) : null}
              <div className="mt-2 grid gap-2">
                {trustIssues.map((issue) => (
                  <div
                    key={`${issue.code}:${issue.message}`}
                    className={`rounded-xl border px-3 py-2 text-sm ${
                      issue.severity === "blocking"
                        ? "border-warning/20 bg-white/70 text-text"
                        : "border-border bg-background text-text-secondary"
                    }`}
                  >
                    <p className="font-medium text-text">{issue.message}</p>
                    <p className="mt-1">{issue.hint}</p>
                  </div>
                ))}
              </div>
              {warningTrustIssues.length > 0 ? (
                <div className="mt-3 rounded-xl border border-border bg-background px-3 py-2 text-sm text-text-secondary">
                  {MANUAL_HANDLING_POLICY_LINES.map((line) => (
                    <p key={line} className="mt-1 first:mt-0">
                      {line}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </fieldset>
      ) : null}

      {activeStage === "route" ? (
        <fieldset disabled={isSubmitting} className="grid gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-text">Pickup address</span>
            <GoogleAutocompleteInput
              name="pickupAddressInput"
              defaultValue={defaultPickup}
              placeholder="Pickup address"
              initialResolvedValue={pickup ?? undefined}
              onResolved={setPickup}
            />
            <span className={`text-xs ${pickup ? "text-success" : "text-text-secondary"}`}>
              {pickup ? "Pickup address confirmed." : "Select a suggested address to confirm pickup."}
            </span>
          </label>

          <label className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-text">Pickup access notes</span>
              <span className="text-xs text-text-secondary">{pickupAccessNotes.length}/240</span>
            </div>
            <Textarea
              name="pickupAccessNotes"
              value={pickupAccessNotes}
              maxLength={240}
              onChange={(event) => setPickupAccessNotes(event.target.value)}
              placeholder="Stairs, loading dock, gate code"
            />
            {accessWarning ? (
              <span className="text-xs text-warning">{accessWarning.hint}</span>
            ) : (
              <span className="text-xs text-text-secondary">
                Include stairs, lifts, loading docks, gate codes, parking difficulty, or long carries.
              </span>
            )}
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-text">Dropoff address</span>
            <GoogleAutocompleteInput
              name="dropoffAddressInput"
              defaultValue={defaultDropoff}
              placeholder="Dropoff address"
              initialResolvedValue={dropoff ?? undefined}
              onResolved={setDropoff}
            />
            <span className={`text-xs ${dropoff ? "text-success" : "text-text-secondary"}`}>
              {dropoff ? "Dropoff address confirmed." : "Select a suggested address to confirm dropoff."}
            </span>
          </label>

          <label className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-text">Dropoff access notes</span>
              <span className="text-xs text-text-secondary">{dropoffAccessNotes.length}/240</span>
            </div>
            <Textarea
              name="dropoffAccessNotes"
              value={dropoffAccessNotes}
              maxLength={240}
              onChange={(event) => setDropoffAccessNotes(event.target.value)}
              placeholder="Apartment access or delivery notes"
            />
            {accessWarning ? (
              <span className="text-xs text-warning">{accessWarning.hint}</span>
            ) : (
              <span className="text-xs text-text-secondary">
                Include stairs, lifts, loading docks, gate codes, parking difficulty, or long carries.
              </span>
            )}
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-text">Stairs?</span>
              <select
                name="needsStairs"
                className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
                value={needsStairs ? "yes" : "no"}
                onChange={(event) => setNeedsStairs(event.target.value === "yes")}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-text">Need a helper?</span>
              <select
                name="needsHelper"
                className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
                value={needsHelper ? "yes" : "no"}
                onChange={(event) => setNeedsHelper(event.target.value === "yes")}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
              {helperWarning ? (
                <span className="text-xs text-warning">{helperWarning.hint}</span>
              ) : (
                <span className="text-xs text-text-secondary">
                  Use this when the item is bulky, awkward, or not safe for one-person handling.
                </span>
              )}
            </label>
          </div>

          {stairsUnsupported ? (
            <div className="rounded-xl border border-warning/20 bg-warning/10 p-3 text-sm text-text">
              This carrier does not offer stairs support. Choose &quot;No&quot; for stairs or find a different trip before continuing.
            </div>
          ) : null}

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-text">Anything the carrier should know?</span>
            <Textarea
              name="specialInstructions"
              value={specialInstructions}
              maxLength={280}
              onChange={(event) => setSpecialInstructions(event.target.value)}
              placeholder="Fragile edges, preferred loading side, timing constraints"
            />
          </label>

          <div className="rounded-xl border border-border bg-black/[0.02] p-3 text-sm text-text-secondary dark:bg-white/[0.04]">
            Exact street details help moverrr judge route fit, but the carrier only gets suburb-level matching until a request is accepted.
          </div>

          <div className="rounded-xl border border-border bg-black/[0.02] p-3 text-sm text-text-secondary dark:bg-white/[0.04]">
            <p className="font-medium text-text">Bulky or risky item reminder</p>
            <div className="mt-1 grid gap-2">
              <p>
                If the item is heavy, awkward, or likely unsafe for one person, add helper and access details now rather than leaving it for pickup day.
              </p>
              {MANUAL_HANDLING_POLICY_LINES.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        </fieldset>
      ) : null}

      {activeStage === "review" ? (
        <fieldset disabled={isSubmitting} className="grid gap-4">
          <div className="rounded-xl border border-border p-4">
            <p className="section-label">Request path</p>
            <h3 className="mt-1 text-lg text-text">
              {requestMode === "single" ? "Request to Book" : "Fast Match"}
            </h3>
            <p className="mt-2 text-sm text-text-secondary">
              {requestMode === "single"
                ? `This sends the request straight to ${trip.carrier.businessName} for this exact trip.`
                : "This asks up to three matching carriers at once and closes the others as soon as one accepts."}
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-border p-4">
              <p className="section-label">Item summary</p>
              <div className="mt-3 space-y-2 text-sm text-text-secondary">
                <p className="text-text">{itemDescription}</p>
                <p>
                  {ITEM_SIZE_DESCRIPTIONS[itemSizeClass || "M"].label} · {itemWeightBand.replaceAll("_", " ")}
                </p>
                {itemDimensions ? <p>Dimensions: {itemDimensions}</p> : null}
                {itemWeightKg ? <p>Approx weight: {itemWeightKg}kg</p> : null}
                {photoFile ? <p>Item photo attached for fit review.</p> : null}
              </div>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="section-label">Route summary</p>
              <div className="mt-3 space-y-2 text-sm text-text-secondary">
                <p className="text-text">
                  {pickup?.suburb} to {dropoff?.suburb}
                </p>
                <p>{trip.tripDate} · {trip.timeWindow}</p>
                <p>
                  {needsStairs ? "Stairs requested" : "No stairs"} · {needsHelper ? "Helper requested" : "No helper"}
                </p>
                {pickupAccessNotes ? <p>Pickup: {pickupAccessNotes}</p> : null}
                {dropoffAccessNotes ? <p>Dropoff: {dropoffAccessNotes}</p> : null}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="section-label">Price before send</p>
            <div className="mt-3 grid gap-2 text-sm text-text-secondary">
              <div className="flex items-center justify-between gap-4">
                <span>Carrier route price</span>
                <span className="text-text">{formatCurrency(pricing.basePriceCents)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Stairs add-on</span>
                <span className="text-text">{formatCurrency(pricing.stairsFeeCents)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Helper add-on</span>
                <span className="text-text">{formatCurrency(pricing.helperFeeCents)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Platform fee</span>
                <span className="text-text">{formatCurrency(pricing.platformFeeCents)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>GST</span>
                <span className="text-text">{formatCurrency(pricing.gstCents)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-border pt-2">
                <span className="font-medium text-text">Customer total</span>
                <span className="text-base font-medium text-text">
                  {formatCurrency(pricing.totalPriceCents)}
                </span>
              </div>
            </div>
            <p className="mt-3 text-xs text-text-secondary">
              No off-platform payment or side-deal extras. If anything changes after review, it must stay inside moverrr.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-black/[0.02] p-4 text-sm text-text-secondary dark:bg-white/[0.04]">
            <p className="font-medium text-text">Payment setup and return path</p>
            <div className="mt-2 grid gap-2">
              {customerPaymentProfile?.stripeConfigured ? (
                customerPaymentProfile.defaultPaymentMethod ? (
                  <p>
                    Saved card on file: {customerPaymentProfile.defaultPaymentMethod.brand.toUpperCase()} ending in{" "}
                    {customerPaymentProfile.defaultPaymentMethod.last4}. Update it here if this request should use a different card later.
                  </p>
                ) : (
                  <p>
                    No saved card on file yet. Add one now so an accepted booking does not stall when payment setup needs to happen.
                  </p>
                )
              ) : (
                <p>
                  Need to check payment details before sending? moverrr keeps this request draft on
                  this device, so you can jump to account and come back safely.
                </p>
              )}
              <div className="pt-1">
                {customerPaymentProfile?.stripeConfigured ? (
                  <ManagePaymentMethodButton
                    returnTo={accountReturnHref}
                    label={
                      customerPaymentProfile.hasSavedPaymentMethod
                        ? "Update saved card securely"
                        : "Add saved card securely"
                    }
                  />
                ) : (
                  <Button asChild variant="secondary" className="min-h-[44px]">
                    <Link href={accountReturnHref}>Review payment help in account</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-black/[0.02] p-4 text-sm text-text-secondary dark:bg-white/[0.04]">
            <p className="font-medium text-text">What happens after you send</p>
            <div className="mt-2 grid gap-2">
              <p>1. moverrr opens the carrier response window with your route, fit, and access details.</p>
              <p>2. The carrier can accept, decline, or ask for clarification inside moverrr.</p>
              <p>3. Once accepted, the request becomes a live booking and fuller handoff details can be shared safely.</p>
            </div>
          </div>
        </fieldset>
      ) : null}

      <div className="space-y-3">
        {submissionStage !== "idle" ? (
          <p className="text-sm text-text-secondary">
            {submissionStage === "uploading_photo"
              ? "Uploading photo..."
              : submissionStage === "creating_move_request"
                ? "Saving move request..."
                : requestMode === "single"
                  ? "Sending request to this carrier..."
                  : "Starting Fast Match..."}
          </p>
        ) : null}
        {error ? <p className="text-sm text-error">{error}</p> : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          {activeStage !== "item" ? (
            <Button type="button" variant="secondary" onClick={goToPreviousStage}>
              Back
            </Button>
          ) : null}
          {activeStage !== "review" ? (
            <Button type="button" onClick={goToNextStage}>
              Continue
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting || !reviewReady}>
              {isSubmitting
                ? requestMode === "single"
                  ? "Sending request..."
                  : "Starting Fast Match..."
                : requestMode === "single"
                  ? "Send Request to Book"
                  : "Start Fast Match"}
            </Button>
          )}
        </div>

        {activeStage === "review" ? (
          <p className="text-sm text-text-secondary">
            Need to switch paths? Use the request choice card above or go back to adjust the item and access details.
          </p>
        ) : null}
      </div>
    </form>
  );
}
