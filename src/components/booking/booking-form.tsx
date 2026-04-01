"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Camera, Upload } from "lucide-react";

import { FileSelectionPreview } from "@/components/ui/file-selection-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GoogleAutocompleteInput } from "@/components/shared/google-autocomplete-input";
import { ITEM_SIZE_DESCRIPTIONS } from "@/lib/constants";
import type { Trip } from "@/types/trip";

interface ResolvedAddress {
  label: string;
  suburb: string;
  postcode: string;
  latitude: number;
  longitude: number;
}

interface BookingFormProps {
  trip: Trip;
  isAuthenticated: boolean;
  id?: string;
  onOptionsChange?: (options: {
    needsStairs: boolean;
    needsHelper: boolean;
  }) => void;
}

export function BookingForm({
  trip,
  isAuthenticated,
  id,
  onOptionsChange,
}: BookingFormProps) {
  const router = useRouter();
  const [pickup, setPickup] = useState<ResolvedAddress | null>(null);
  const [dropoff, setDropoff] = useState<ResolvedAddress | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [itemDescription, setItemDescription] = useState("");
  const [itemCategory, setItemCategory] = useState("furniture");
  const [itemDimensions, setItemDimensions] = useState("");
  const [itemWeightKg, setItemWeightKg] = useState("");
  const [pickupAccessNotes, setPickupAccessNotes] = useState("");
  const [dropoffAccessNotes, setDropoffAccessNotes] = useState("");
  const [pickupContactName, setPickupContactName] = useState("");
  const [pickupContactPhone, setPickupContactPhone] = useState("");
  const [dropoffContactName, setDropoffContactName] = useState("");
  const [dropoffContactPhone, setDropoffContactPhone] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [needsStairs, setNeedsStairs] = useState(false);
  const [needsHelper, setNeedsHelper] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStage, setSubmissionStage] = useState<"idle" | "uploading_photo" | "creating_booking" | "creating_payment">("idle");
  const [retryBookingId, setRetryBookingId] = useState<string | null>(null);
  const bookingIdempotencyKeyRef = useRef<string | null>(null);
  const draftKey = useMemo(() => `moverrr:booking-draft:${trip.id}`, [trip.id]);

  const defaultPickup = useMemo(
    () => `${trip.route.originSuburb} NSW ${trip.route.originPostcode ?? ""}`.trim(),
    [trip.route.originPostcode, trip.route.originSuburb],
  );
  const defaultDropoff = useMemo(
    () =>
      `${trip.route.destinationSuburb} NSW ${trip.route.destinationPostcode ?? ""}`.trim(),
    [trip.route.destinationPostcode, trip.route.destinationSuburb],
  );

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
        itemCategory: string;
        itemDimensions: string;
        itemWeightKg: string;
        pickupAccessNotes: string;
        dropoffAccessNotes: string;
        pickupContactName: string;
        pickupContactPhone: string;
        dropoffContactName: string;
        dropoffContactPhone: string;
        specialInstructions: string;
        needsStairs: boolean;
        needsHelper: boolean;
        pickup: ResolvedAddress;
        dropoff: ResolvedAddress;
      }>;

      if (parsed.itemDescription !== undefined) setItemDescription(parsed.itemDescription);
      if (parsed.itemCategory !== undefined) setItemCategory(parsed.itemCategory);
      if (parsed.itemDimensions !== undefined) setItemDimensions(parsed.itemDimensions);
      if (parsed.itemWeightKg !== undefined) setItemWeightKg(parsed.itemWeightKg);
      if (parsed.pickupAccessNotes !== undefined) setPickupAccessNotes(parsed.pickupAccessNotes);
      if (parsed.dropoffAccessNotes !== undefined) setDropoffAccessNotes(parsed.dropoffAccessNotes);
      if (parsed.pickupContactName !== undefined) setPickupContactName(parsed.pickupContactName);
      if (parsed.pickupContactPhone !== undefined) setPickupContactPhone(parsed.pickupContactPhone);
      if (parsed.dropoffContactName !== undefined) setDropoffContactName(parsed.dropoffContactName);
      if (parsed.dropoffContactPhone !== undefined) setDropoffContactPhone(parsed.dropoffContactPhone);
      if (parsed.specialInstructions !== undefined) setSpecialInstructions(parsed.specialInstructions);
      if (parsed.needsStairs !== undefined) setNeedsStairs(parsed.needsStairs);
      if (parsed.needsHelper !== undefined) setNeedsHelper(parsed.needsHelper);
      if (parsed.pickup !== undefined) setPickup(parsed.pickup);
      if (parsed.dropoff !== undefined) setDropoff(parsed.dropoff);
    } catch {
      window.sessionStorage.removeItem(draftKey);
    }
  }, [draftKey]);

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
      itemDimensions,
      itemWeightKg,
      pickupAccessNotes,
      dropoffAccessNotes,
      pickupContactName,
      pickupContactPhone,
      dropoffContactName,
      dropoffContactPhone,
      specialInstructions,
      needsStairs,
      needsHelper,
      pickup,
      dropoff,
    };

    window.sessionStorage.setItem(draftKey, JSON.stringify(payload));
  }, [
    draftKey,
    dropoff,
    dropoffAccessNotes,
    dropoffContactName,
    dropoffContactPhone,
    itemCategory,
    itemDescription,
    itemDimensions,
    itemWeightKg,
    needsHelper,
    needsStairs,
    pickup,
    pickupAccessNotes,
    pickupContactName,
    pickupContactPhone,
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

  function getPaymentErrorMessage(message: string) {
    if (message.toLowerCase().includes("stripe is not configured")) {
      return "Payment setup is temporarily unavailable. Your booking is saved and you can retry payment setup in a moment.";
    }

    if (message.toLowerCase().includes("booking not found")) {
      return "We saved your booking, but payment setup lost sync. Try payment setup again.";
    }

    return "Your booking was saved, but payment setup did not finish. Try again to continue.";
  }

  async function createPaymentIntent(bookingId: string) {
    const response = await fetch("/api/payments/create-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    });

    if (!response.ok) {
      const payload = await response.json();
      throw new Error(getPaymentErrorMessage(payload.error ?? "Payment setup failed."));
    }

    return response.json();
  }

  async function retryPaymentSetup() {
    if (!retryBookingId) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await createPaymentIntent(retryBookingId);
      router.push(`/bookings/${retryBookingId}`);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to resume payment setup.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setRetryBookingId(null);

    if (!isAuthenticated) {
      router.push(`/login?next=/trip/${trip.id}`);
      return;
    }

    if (!pickup || !dropoff) {
      setError("Choose both pickup and dropoff addresses from the address suggestions.");
      return;
    }

    setIsSubmitting(true);

    try {
      setSubmissionStage("uploading_photo");
      const itemPhotoUrls = await uploadPhotoIfNeeded();
      setSubmissionStage("creating_booking");
      const bookingResponse = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key":
            bookingIdempotencyKeyRef.current ??
            (bookingIdempotencyKeyRef.current =
              typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random()}`),
        },
        body: JSON.stringify({
          listingId: trip.id,
          carrierId: trip.carrier.id,
          itemDescription,
          itemCategory,
          itemDimensions: itemDimensions.trim() || undefined,
          itemWeightKg: itemWeightKg.trim() ? Number(itemWeightKg) : undefined,
          itemPhotoUrls,
          needsStairs,
          needsHelper,
          specialInstructions: specialInstructions.trim() || undefined,
          pickupAddress: pickup.label,
          pickupSuburb: pickup.suburb,
          pickupPostcode: pickup.postcode,
          pickupLatitude: pickup.latitude,
          pickupLongitude: pickup.longitude,
          pickupAccessNotes: pickupAccessNotes.trim() || undefined,
          pickupContactName: pickupContactName.trim() || undefined,
          pickupContactPhone: pickupContactPhone.trim() || undefined,
          dropoffAddress: dropoff.label,
          dropoffSuburb: dropoff.suburb,
          dropoffPostcode: dropoff.postcode,
          dropoffLatitude: dropoff.latitude,
          dropoffLongitude: dropoff.longitude,
          dropoffAccessNotes: dropoffAccessNotes.trim() || undefined,
          dropoffContactName: dropoffContactName.trim() || undefined,
          dropoffContactPhone: dropoffContactPhone.trim() || undefined,
        }),
      });
      const bookingPayload = await bookingResponse.json();

      if (!bookingResponse.ok) {
        if (bookingPayload.code === "listing_not_bookable") {
          bookingIdempotencyKeyRef.current = null;
          throw new Error(
            "This trip filled or closed before payment setup finished. Search again for another spare-capacity run.",
          );
        }

        if (bookingPayload.code === "idempotency_key_reused") {
          bookingIdempotencyKeyRef.current = null;
        }

        throw new Error(bookingPayload.error ?? "Failed to create booking.");
      }

      try {
        setSubmissionStage("creating_payment");
        await createPaymentIntent(bookingPayload.booking.id);
        window.sessionStorage.removeItem(draftKey);
      } catch (paymentError) {
        setRetryBookingId(bookingPayload.booking.id);
        throw paymentError;
      }

      router.push(`/bookings/${bookingPayload.booking.id}`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create booking.");
    } finally {
      setIsSubmitting(false);
      setSubmissionStage("idle");
    }
  }

  return (
    <form id={id} className="grid gap-4" onSubmit={handleSubmit}>
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
            className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text"
            value={itemCategory}
            onChange={(event) => setItemCategory(event.target.value)}
          >
            <option value="furniture">Furniture</option>
            <option value="boxes">Boxes</option>
            <option value="appliance">Appliance</option>
            <option value="fragile">Fragile</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text">Dimensions</span>
          <Input
            name="itemDimensions"
            value={itemDimensions}
            onChange={(event) => setItemDimensions(event.target.value)}
            placeholder="200cm x 90cm x 85cm"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text">Weight</span>
        <Input
          name="itemWeightKg"
          type="number"
          min="0"
          max="500"
          step="0.1"
          value={itemWeightKg}
          onChange={(event) => setItemWeightKg(event.target.value)}
          placeholder="Approx weight in kg"
        />
      </label>

      <div className="space-y-3 rounded-xl border border-border p-3">
        <div>
          <p className="text-sm font-medium text-text">Size guide</p>
          <p className="mt-1 text-sm text-text-secondary">
            Match your item to the closest size before you continue.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {Object.entries(ITEM_SIZE_DESCRIPTIONS).map(([value, config]) => (
            <div key={value} className="rounded-xl border border-border p-3">
              <p className="text-sm font-medium text-text">{config.label}</p>
              <p className="mt-1 text-sm text-text-secondary">{config.description}</p>
              <p className="mt-2 text-xs text-text-secondary">{config.dimensionsHint}</p>
            </div>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text">Item photo</span>
        <div className="space-y-2">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white active:opacity-80">
              <Camera className="h-4 w-4" />
              Take Photo
              <input
                type="file"
                accept="image/*,image/heic,image/heif"
                capture="environment"
                className="sr-only"
                onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <label className="hidden min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-text active:bg-black/[0.04] sm:flex dark:active:bg-white/[0.08]">
              <Upload className="h-4 w-4" />
              Upload File
              <input
                type="file"
                accept="image/*,image/heic,image/heif"
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

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text">Pickup address</span>
        <GoogleAutocompleteInput
          name="pickupAddressInput"
          defaultValue={defaultPickup}
          placeholder="Pickup address"
          initialResolvedValue={pickup ?? undefined}
          onResolved={setPickup}
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text">Pickup access notes</span>
        <Textarea
          name="pickupAccessNotes"
          value={pickupAccessNotes}
          onChange={(event) => setPickupAccessNotes(event.target.value)}
          placeholder="Stairs, loading dock, gate code"
        />
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
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text">Dropoff access notes</span>
        <Textarea
          name="dropoffAccessNotes"
          value={dropoffAccessNotes}
          onChange={(event) => setDropoffAccessNotes(event.target.value)}
          placeholder="Apartment access or delivery notes"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text">Stairs?</span>
          <select
            name="needsStairs"
            className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text"
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
            className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text"
            value={needsHelper ? "yes" : "no"}
            onChange={(event) => setNeedsHelper(event.target.value === "yes")}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-text">Pickup contact name</span>
          <Input
            name="pickupContactName"
            value={pickupContactName}
            onChange={(event) => setPickupContactName(event.target.value)}
            placeholder="Pickup contact name"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-text">Pickup contact phone</span>
          <Input
            name="pickupContactPhone"
            value={pickupContactPhone}
            onChange={(event) => setPickupContactPhone(event.target.value)}
            placeholder="Pickup contact phone"
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-text">Dropoff contact name</span>
          <Input
            name="dropoffContactName"
            value={dropoffContactName}
            onChange={(event) => setDropoffContactName(event.target.value)}
            placeholder="Dropoff contact name"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-text">Dropoff contact phone</span>
          <Input
            name="dropoffContactPhone"
            value={dropoffContactPhone}
            onChange={(event) => setDropoffContactPhone(event.target.value)}
            placeholder="Dropoff contact phone"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text">Anything the carrier should know?</span>
        <Textarea
          name="specialInstructions"
          value={specialInstructions}
          onChange={(event) => setSpecialInstructions(event.target.value)}
          placeholder="Fragile edges, preferred loading side, timing constraints"
        />
      </label>
      </fieldset>

      <div className="space-y-3">
        {submissionStage !== "idle" ? (
          <p className="text-sm text-text-secondary">
            {submissionStage === "uploading_photo"
              ? "Uploading photo..."
              : submissionStage === "creating_booking"
                ? "Creating booking..."
                : "Starting payment setup..."}
          </p>
        ) : null}
        {error ? <p className="text-sm text-error">{error}</p> : null}
        {retryBookingId ? (
          <Button type="button" variant="secondary" disabled={isSubmitting} onClick={retryPaymentSetup}>
            {isSubmitting ? "Retrying payment..." : "Try payment setup again"}
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating booking..." : "Continue to payment"}
        </Button>
      </div>
    </form>
  );
}
