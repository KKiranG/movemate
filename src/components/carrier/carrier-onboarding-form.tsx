"use client";

import { useEffect, useState, useTransition } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";

import { FileSelectionPreview } from "@/components/ui/file-selection-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CarrierProfile } from "@/types/carrier";
import { isValidAbn } from "@/lib/validation/carrier";

type DraftState = {
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  abn: string;
  serviceSuburbs: string;
  bio: string;
  vehicleType: string;
  regoPlate: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleVolumeM3: string;
  vehicleWeightKg: string;
  licenceExpiryDate: string;
  insuranceExpiryDate: string;
};

const DEFAULT_DRAFT = (defaultEmail: string): DraftState => ({
  businessName: "",
  contactName: "",
  phone: "",
  email: defaultEmail,
  abn: "",
  serviceSuburbs: "",
  bio: "",
  vehicleType: "",
  regoPlate: "",
  vehicleMake: "",
  vehicleModel: "",
  vehicleVolumeM3: "",
  vehicleWeightKg: "",
  licenceExpiryDate: "",
  insuranceExpiryDate: "",
});

function getDraftStorageKey(storageScope: string) {
  return `moverrr:carrier-onboarding:draft:${storageScope || "default"}`;
}

function readDraft(storageScope: string, defaultEmail: string) {
  if (typeof window === "undefined") {
    return DEFAULT_DRAFT(defaultEmail);
  }

  const raw = window.localStorage.getItem(getDraftStorageKey(storageScope));

  if (!raw) {
    return DEFAULT_DRAFT(defaultEmail);
  }

  try {
    return {
      ...DEFAULT_DRAFT(defaultEmail),
      ...(JSON.parse(raw) as Partial<DraftState>),
    };
  } catch {
    return DEFAULT_DRAFT(defaultEmail);
  }
}

function getVerificationBlockers(carrier?: CarrierProfile | null) {
  if (!carrier) {
    return [
      "Complete business details, vehicle details, and both verification documents.",
      "Add document expiry dates so we can remind you before they lapse.",
    ];
  }

  if (carrier.verificationStatus === "rejected") {
    return [
      carrier.verificationNotes ??
        "Admin review flagged an issue with the submission.",
      "Replace the rejected document or details, then resubmit this form.",
    ];
  }

  if (carrier.verificationStatus === "submitted") {
    return [
      "Your application is under review.",
      carrier.verificationNotes ??
        "We will contact you if any document or detail needs changes.",
    ];
  }

  return [];
}

export function CarrierOnboardingForm({
  action,
  defaultEmail,
  existingCarrier,
  draftStorageKey,
}: {
  action: (formData: FormData) => Promise<void>;
  defaultEmail: string;
  existingCarrier?: CarrierProfile | null;
  draftStorageKey: string;
}) {
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<DraftState>(() =>
    DEFAULT_DRAFT(defaultEmail),
  );
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadedDocuments, setUploadedDocuments] = useState<{
    licence: boolean;
    insurance: boolean;
    vehicle: boolean;
  }>({ licence: false, insurance: false, vehicle: false });
  const [licenceFile, setLicenceFile] = useState<File | null>(null);
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [vehicleFile, setVehicleFile] = useState<File | null>(null);
  const [licencePreview, setLicencePreview] = useState<string | null>(null);
  const [insurancePreview, setInsurancePreview] = useState<string | null>(null);
  const [vehiclePreview, setVehiclePreview] = useState<string | null>(null);
  const blockers = getVerificationBlockers(existingCarrier);
  const storageKey = getDraftStorageKey(draftStorageKey);
  const abnIsValid = !draft.abn.trim() || isValidAbn(draft.abn);
  const businessDetailsComplete = Boolean(
    draft.businessName.trim() &&
    draft.abn.trim() &&
    draft.phone.trim() &&
    abnIsValid,
  );

  useEffect(() => {
    const nextDraft = readDraft(draftStorageKey, defaultEmail);
    const hasDraft =
      JSON.stringify(nextDraft) !== JSON.stringify(DEFAULT_DRAFT(defaultEmail));

    if (hasDraft) {
      setShowResumeBanner(true);
    } else {
      setDraft({
        ...nextDraft,
        businessName: existingCarrier?.businessName ?? nextDraft.businessName,
        contactName: existingCarrier?.contactName ?? nextDraft.contactName,
        phone: existingCarrier?.phone ?? nextDraft.phone,
        email: existingCarrier?.email ?? nextDraft.email,
        abn: existingCarrier?.abn ?? nextDraft.abn,
        serviceSuburbs:
          existingCarrier?.serviceSuburbs.join(", ") ??
          nextDraft.serviceSuburbs,
        bio: existingCarrier?.bio ?? nextDraft.bio,
        licenceExpiryDate:
          existingCarrier?.licenceExpiryDate ?? nextDraft.licenceExpiryDate,
        insuranceExpiryDate:
          existingCarrier?.insuranceExpiryDate ?? nextDraft.insuranceExpiryDate,
      });
    }
  }, [defaultEmail, draftStorageKey, existingCarrier]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(draft));
  }, [draft, storageKey]);

  useEffect(() => {
    const objectUrl =
      licenceFile && licenceFile.type.startsWith("image/")
        ? URL.createObjectURL(licenceFile)
        : null;
    setLicencePreview(objectUrl);
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [licenceFile]);

  useEffect(() => {
    const objectUrl =
      insuranceFile && insuranceFile.type.startsWith("image/")
        ? URL.createObjectURL(insuranceFile)
        : null;
    setInsurancePreview(objectUrl);
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [insuranceFile]);

  useEffect(() => {
    const objectUrl =
      vehicleFile && vehicleFile.type.startsWith("image/")
        ? URL.createObjectURL(vehicleFile)
        : null;
    setVehiclePreview(objectUrl);
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [vehicleFile]);

  const sections = [
    {
      label: "Business details",
      complete: businessDetailsComplete,
      reason: "We need legal business details to verify who is posting trips.",
    },
    {
      label: "Documents uploaded",
      complete: Boolean(licenceFile && insuranceFile),
      reason:
        "Licence and insurance are required before verification can start.",
    },
    {
      label: "Vehicle added",
      complete: Boolean(draft.vehicleType),
      reason:
        "Vehicle details tell customers what spare capacity is available.",
    },
  ];
  const completedCount = sections.filter((section) => section.complete).length;
  const progressPct = Math.round((completedCount / sections.length) * 100);
  const isReadyToSubmit = completedCount === sections.length && abnIsValid;

  async function uploadDocument(
    file: File | null,
    bucket: "carrier-documents" | "vehicle-photos",
  ) {
    if (!file) {
      return "";
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucket);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to upload document.");
    }

    return payload.path as string;
  }

  function resumeDraft() {
    setDraft(readDraft(draftStorageKey, defaultEmail));
    setShowResumeBanner(false);
  }

  function resetDraft() {
    const empty = DEFAULT_DRAFT(defaultEmail);
    setDraft(empty);
    setShowResumeBanner(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, JSON.stringify(empty));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const formData = new FormData(event.currentTarget);

    if (!abnIsValid) {
      setError(
        "Invalid ABN format. Enter the 11-digit ABN and check the checksum.",
      );
      return;
    }

    try {
      setUploadPercent(10);
      const licencePhotoUrl = await uploadDocument(
        licenceFile,
        "carrier-documents",
      );
      setUploadPercent(35);
      const insurancePhotoUrl = await uploadDocument(
        insuranceFile,
        "carrier-documents",
      );
      setUploadPercent(65);
      const vehiclePhotoUrl = await uploadDocument(
        vehicleFile,
        "vehicle-photos",
      );
      setUploadPercent(100);
      setUploadedDocuments({
        licence: Boolean(licencePhotoUrl),
        insurance: Boolean(insurancePhotoUrl),
        vehicle: Boolean(vehiclePhotoUrl),
      });
      formData.set("licencePhotoUrl", licencePhotoUrl);
      formData.set("insurancePhotoUrl", insurancePhotoUrl);
      formData.set("vehiclePhotoUrl", vehiclePhotoUrl);

      startTransition(async () => {
        try {
          await action(formData);
          setMessage(
            "Carrier onboarding saved. Your verification is ready for admin review.",
          );
          if (typeof window !== "undefined") {
            window.localStorage.removeItem(storageKey);
          }
        } catch (caught) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to save onboarding.",
          );
        }
      });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to upload documents.",
      );
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      {showResumeBanner ? (
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
          <p className="text-sm font-medium text-text">
            Resume your application
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            We restored your saved business and vehicle details. You will need
            to reattach files before submitting.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Button type="button" onClick={resumeDraft}>
              Resume saved draft
            </Button>
            <Button type="button" variant="secondary" onClick={resetDraft}>
              Start fresh
            </Button>
          </div>
        </div>
      ) : null}

      {blockers.length > 0 ? (
        <div className="rounded-xl border border-warning/20 bg-warning/10 p-4">
          <p className="section-label">Verification blockers</p>
          <div className="mt-3 grid gap-2">
            {blockers.map((blocker) => (
              <div
                key={blocker}
                className="rounded-xl border border-warning/20 bg-white/60 px-3 py-2 text-sm text-text"
              >
                {blocker}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-3 rounded-xl border border-border p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="section-label">Verification progress</p>
            <p className="mt-1 text-sm text-text">
              {completedCount} of {sections.length} sections complete
            </p>
          </div>
          <span className="text-sm font-medium text-text">{progressPct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-border p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-text">
            Document upload progress
          </span>
          <span className="text-xs text-text-secondary">{uploadPercent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-success transition-all"
            style={{ width: `${uploadPercent}%` }}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-text">Business name</span>
          <Input
            name="businessName"
            value={draft.businessName}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                businessName: event.target.value,
              }))
            }
            required
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-text">Contact name</span>
          <Input
            name="contactName"
            value={draft.contactName}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                contactName: event.target.value,
              }))
            }
            required
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-text">Phone</span>
          <Input
            name="phone"
            value={draft.phone}
            onChange={(event) =>
              setDraft((current) => ({ ...current, phone: event.target.value }))
            }
            required
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-text">Email</span>
          <Input
            name="email"
            value={draft.email}
            onChange={(event) =>
              setDraft((current) => ({ ...current, email: event.target.value }))
            }
            required
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-text">ABN</span>
          <Input
            name="abn"
            value={draft.abn}
            onChange={(event) =>
              setDraft((current) => ({ ...current, abn: event.target.value }))
            }
            inputMode="numeric"
            placeholder="11-digit ABN"
            required
          />
          {!abnIsValid && draft.abn.trim() ? (
            <p className="text-sm text-error">
              Invalid ABN format. Check the 11-digit ABN again.
            </p>
          ) : (
            <p className="text-xs text-text-secondary">
              We validate the checksum so invalid ABNs do not reach the review
              queue.
            </p>
          )}
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-text">Service suburbs</span>
          <Input
            name="serviceSuburbs"
            value={draft.serviceSuburbs}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                serviceSuburbs: event.target.value,
              }))
            }
          />
        </label>
      </div>
      <label className="grid gap-2">
        <span className="text-sm font-medium text-text">Business bio</span>
        <Textarea
          name="bio"
          value={draft.bio}
          onChange={(event) =>
            setDraft((current) => ({ ...current, bio: event.target.value }))
          }
          placeholder="What kind of jobs do you usually take?"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-text">Vehicle type</span>
          <select
            name="vehicleType"
            className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text"
            value={draft.vehicleType}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                vehicleType: event.target.value,
              }))
            }
          >
            <option value="">Select vehicle type</option>
            <option value="van">Van</option>
            <option value="ute">Ute</option>
            <option value="small_truck">Small truck</option>
            <option value="large_truck">Large truck</option>
            <option value="trailer">Trailer</option>
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-text">Rego plate</span>
          <Input
            name="regoPlate"
            value={draft.regoPlate}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                regoPlate: event.target.value,
              }))
            }
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-text">Vehicle make</span>
          <Input
            name="vehicleMake"
            value={draft.vehicleMake}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                vehicleMake: event.target.value,
              }))
            }
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-text">Vehicle model</span>
          <Input
            name="vehicleModel"
            value={draft.vehicleModel}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                vehicleModel: event.target.value,
              }))
            }
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-text">
            Vehicle volume (m3)
          </span>
          <Input
            name="vehicleVolumeM3"
            type="number"
            step="0.1"
            value={draft.vehicleVolumeM3}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                vehicleVolumeM3: event.target.value,
              }))
            }
            required
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-text">
            Vehicle weight (kg)
          </span>
          <Input
            name="vehicleWeightKg"
            type="number"
            step="1"
            value={draft.vehicleWeightKg}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                vehicleWeightKg: event.target.value,
              }))
            }
            required
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-text">
            Licence expiry date
          </span>
          <Input
            name="licenceExpiryDate"
            type="date"
            value={draft.licenceExpiryDate}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                licenceExpiryDate: event.target.value,
              }))
            }
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-text">
            Insurance expiry date
          </span>
          <Input
            name="insuranceExpiryDate"
            type="date"
            value={draft.insuranceExpiryDate}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                insuranceExpiryDate: event.target.value,
              }))
            }
          />
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-text">
          Licence photo
          {uploadedDocuments.licence ? (
            <CheckCircle2 className="h-4 w-4 text-success" />
          ) : null}
        </span>
        <Input
          name="licence"
          type="file"
          accept="image/*,image/heic,image/heif,application/pdf"
          onChange={(event) => setLicenceFile(event.target.files?.[0] ?? null)}
          required
        />
      </label>
      {licenceFile ? (
        <FileSelectionPreview
          file={licenceFile}
          imageUrl={licencePreview}
          label="Licence preview"
          onRemove={() => setLicenceFile(null)}
        />
      ) : null}

      <label className="flex flex-col gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-text">
          Insurance document
          {uploadedDocuments.insurance ? (
            <CheckCircle2 className="h-4 w-4 text-success" />
          ) : null}
        </span>
        <Input
          name="insurance"
          type="file"
          accept="image/*,image/heic,image/heif,application/pdf"
          onChange={(event) =>
            setInsuranceFile(event.target.files?.[0] ?? null)
          }
          required
        />
      </label>
      {insuranceFile ? (
        <FileSelectionPreview
          file={insuranceFile}
          imageUrl={insurancePreview}
          label="Insurance preview"
          onRemove={() => setInsuranceFile(null)}
        />
      ) : null}

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text">
          Vehicle photo (optional)
        </span>
        <Input
          name="vehiclePhoto"
          type="file"
          accept="image/*,image/heic,image/heif"
          capture="environment"
          onChange={(event) => setVehicleFile(event.target.files?.[0] ?? null)}
        />
      </label>
      {vehicleFile ? (
        <FileSelectionPreview
          file={vehicleFile}
          imageUrl={vehiclePreview}
          label="Vehicle photo"
          onRemove={() => setVehicleFile(null)}
        />
      ) : null}

      {error ? <p className="text-sm text-error">{error}</p> : null}
      {message ? <p className="text-sm text-success">{message}</p> : null}
      {!isReadyToSubmit ? (
        <p className="text-sm text-text-secondary">
          Complete all sections, enter a valid ABN, and reattach documents to
          submit for verification.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={resetDraft}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Start fresh
        </Button>
        <Button type="submit" disabled={pending || !isReadyToSubmit}>
          {pending ? "Saving..." : "Submit for verification"}
        </Button>
      </div>
    </form>
  );
}
