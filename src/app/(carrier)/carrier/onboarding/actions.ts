"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireSessionUser } from "@/lib/auth";
import { upsertCarrierOnboarding } from "@/lib/data/carriers";

export async function saveCarrierOnboarding(formData: FormData) {
  const user = await requireSessionUser();
  const vehiclePhotoUrl = String(formData.get("vehiclePhotoUrl") ?? "").trim();
  const licenceExpiryDate = String(formData.get("licenceExpiryDate") ?? "").trim();
  const insuranceExpiryDate = String(formData.get("insuranceExpiryDate") ?? "").trim();

  await upsertCarrierOnboarding(user.id, {
    businessName: String(formData.get("businessName") ?? ""),
    contactName: String(formData.get("contactName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    abn: String(formData.get("abn") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    licencePhotoUrl: String(formData.get("licencePhotoUrl") ?? ""),
    insurancePhotoUrl: String(formData.get("insurancePhotoUrl") ?? ""),
    vehiclePhotoUrl: vehiclePhotoUrl || undefined,
    licenceExpiryDate: licenceExpiryDate || undefined,
    insuranceExpiryDate: insuranceExpiryDate || undefined,
    serviceSuburbs: String(formData.get("serviceSuburbs") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    vehicleType: String(formData.get("vehicleType") ?? "van") as
      | "van"
      | "ute"
      | "small_truck"
      | "large_truck"
      | "trailer",
    vehicleMake: String(formData.get("vehicleMake") ?? ""),
    vehicleModel: String(formData.get("vehicleModel") ?? ""),
    vehicleVolumeM3: Number(formData.get("vehicleVolumeM3") ?? "1"),
    vehicleWeightKg: Number(formData.get("vehicleWeightKg") ?? "100"),
    regoPlate: String(formData.get("regoPlate") ?? ""),
  });

  revalidatePath("/carrier/onboarding");
  revalidatePath("/carrier/dashboard");
  redirect("/carrier/post");
}
