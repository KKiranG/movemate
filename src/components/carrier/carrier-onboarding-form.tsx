"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function CarrierOnboardingForm({
  action,
  defaultEmail,
}: {
  action: (formData: FormData) => Promise<void>;
  defaultEmail: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadedDocuments, setUploadedDocuments] = useState<{
    licence: boolean;
    insurance: boolean;
  }>({ licence: false, insurance: false });
  const [businessName, setBusinessName] = useState("");
  const [abn, setAbn] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [hasLicenceFile, setHasLicenceFile] = useState(false);
  const [hasInsuranceFile, setHasInsuranceFile] = useState(false);

  const sections = [
    {
      label: "Business details",
      complete: Boolean(businessName.trim() && abn.trim() && phone.trim()),
      reason: "We need legal business details to verify who is posting trips.",
    },
    {
      label: "Documents uploaded",
      complete: Boolean(hasLicenceFile && hasInsuranceFile),
      reason: "Licence and insurance are required before verification can start.",
    },
    {
      label: "Vehicle added",
      complete: Boolean(vehicleType),
      reason: "Vehicle details tell customers what spare capacity is available.",
    },
  ];
  const completedCount = sections.filter((section) => section.complete).length;
  const progressPct = Math.round((completedCount / sections.length) * 100);
  const isReadyToSubmit = completedCount === sections.length;

  async function uploadDocument(file: File | null) {
    if (!file) {
      return "";
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "carrier-documents");

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const currentTarget = event.currentTarget;
    const formData = new FormData(currentTarget);

    try {
      const licence = currentTarget.licence.files?.[0] ?? null;
      const insurance = currentTarget.insurance.files?.[0] ?? null;
      setUploadPercent(10);
      setUploadedDocuments({ licence: false, insurance: false });
      const licencePhotoUrl = await uploadDocument(licence);
      setUploadPercent(55);
      setUploadedDocuments((current) => ({ ...current, licence: Boolean(licencePhotoUrl) }));
      const insurancePhotoUrl = await uploadDocument(insurance);
      setUploadPercent(100);
      setUploadedDocuments((current) => ({
        ...current,
        insurance: Boolean(insurancePhotoUrl),
      }));
      formData.set("licencePhotoUrl", licencePhotoUrl);
      formData.set("insurancePhotoUrl", insurancePhotoUrl);

      startTransition(async () => {
        try {
          await action(formData);
          setMessage("Carrier onboarding saved. Your verification is ready for admin review.");
        } catch (caught) {
          setError(
            caught instanceof Error ? caught.message : "Unable to save onboarding.",
          );
        }
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to upload documents.");
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
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
        <div className="grid gap-2">
          {sections.filter((section) => !section.complete).map((section) => (
            <div
              key={section.label}
              className="flex items-start gap-2 rounded-xl bg-error/5 px-3 py-2"
            >
              <span className="mt-1 h-2.5 w-2.5 flex-none rounded-full bg-error" />
              <div>
                <p className="text-sm font-medium text-text">{section.label}</p>
                <p className="text-sm text-text-secondary">{section.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-border p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-text">Document upload progress</span>
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
            placeholder="Business name"
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            required
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-text">Contact name</span>
          <Input name="contactName" placeholder="Contact name" required />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-text">Phone</span>
          <Input
            name="phone"
            placeholder="+61 400 000 000"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-text">Email</span>
          <Input name="email" defaultValue={defaultEmail} required />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-text">ABN</span>
          <Input
            name="abn"
            placeholder="ABN"
            value={abn}
            onChange={(event) => setAbn(event.target.value)}
            required
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-text">Service suburbs</span>
          <Input name="serviceSuburbs" placeholder="Penrith, Parramatta, Bondi" />
        </label>
      </div>
      <label className="grid gap-2">
        <span className="text-sm font-medium text-text">Business bio</span>
        <Textarea name="bio" placeholder="What kind of jobs do you usually take?" />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-text">Vehicle type</span>
          <select
            name="vehicleType"
            className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text"
            value={vehicleType}
            onChange={(event) => setVehicleType(event.target.value)}
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
          <Input name="regoPlate" placeholder="Rego plate" />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-text">Vehicle make</span>
          <Input name="vehicleMake" placeholder="Make" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-text">Vehicle model</span>
          <Input name="vehicleModel" placeholder="Model" />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-text">Vehicle volume (m3)</span>
          <Input
            name="vehicleVolumeM3"
            type="number"
            step="0.1"
            placeholder="Volume m3"
            required
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-text">Vehicle weight (kg)</span>
          <Input
            name="vehicleWeightKg"
            type="number"
            step="1"
            placeholder="Weight kg"
            required
          />
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-text">
          Licence photo
          {uploadedDocuments.licence ? <CheckCircle2 className="h-4 w-4 text-success" /> : null}
        </span>
        <Input
          name="licence"
          type="file"
          accept="image/*,image/heic,image/heif,application/pdf"
          onChange={(event) => setHasLicenceFile(Boolean(event.target.files?.[0]))}
          required
        />
      </label>
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
          onChange={(event) => setHasInsuranceFile(Boolean(event.target.files?.[0]))}
          required
        />
      </label>

      {error ? <p className="text-sm text-error">{error}</p> : null}
      {message ? <p className="text-sm text-success">{message}</p> : null}
      {!isReadyToSubmit ? (
        <p className="text-sm text-text-secondary">
          Complete all sections to submit for verification.
        </p>
      ) : null}
      <Button type="submit" disabled={pending || !isReadyToSubmit}>
        {pending ? "Saving..." : "Submit for verification"}
      </Button>
    </form>
  );
}
