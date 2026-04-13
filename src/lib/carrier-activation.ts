import type { CarrierActivationStatus, CarrierProfile } from "@/types/carrier";

export function isCarrierActivationLive(status: CarrierActivationStatus) {
  return status === "active";
}

export function getCarrierActivationLabel(status: CarrierActivationStatus) {
  switch (status) {
    case "not_started":
      return "Not started";
    case "activation_started":
      return "Activation started";
    case "pending_review":
      return "Pending review";
    case "active":
      return "Active";
    case "rejected":
      return "Needs changes";
    case "suspended":
      return "Suspended";
    default:
      return "Activation";
  }
}

export function getCarrierActivationBlockers(carrier: CarrierProfile | null | undefined) {
  if (!carrier) {
    return [
      "Finish business details, vehicle details, and required documents before activation can start.",
    ];
  }

  if (carrier.activationStatus === "rejected") {
    return [
      carrier.verificationNotes ?? "Ops review flagged something that needs to be corrected.",
      "Update the blocked details and resubmit the onboarding flow.",
    ];
  }

  if (carrier.activationStatus === "pending_review") {
    return [
      "Ops is reviewing the activation pack now.",
      carrier.verificationNotes ?? "We will reach out if any document or rule needs a correction.",
    ];
  }

  if (carrier.activationStatus === "suspended") {
    return [
      carrier.verificationNotes ?? "Carrier supply is temporarily suspended from the live marketplace.",
      "Ops needs to clear the suspension before new routes or request accepts can go live again.",
    ];
  }

  const blockers: string[] = [];

  if (!carrier.businessName || !carrier.contactName || !carrier.phone) {
    blockers.push("Business identity and contact details are still incomplete.");
  }

  if (!carrier.vehiclePhotoUrl) {
    blockers.push("Add the active vehicle details and photo.");
  }

  if (!carrier.licencePhotoUrl || !carrier.insurancePhotoUrl) {
    blockers.push("Upload licence and insurance documents before review.");
  }

  if (!carrier.stripeOnboardingComplete) {
    blockers.push("Finish payout setup so completed jobs can release cleanly.");
  }

  return blockers;
}
