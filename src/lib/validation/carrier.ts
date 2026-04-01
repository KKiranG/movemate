import { z } from "zod";

export const carrierOnboardingSchema = z.object({
  businessName: z.string().min(2).max(120),
  contactName: z.string().min(2).max(120),
  phone: z.string().min(8).max(24),
  email: z.email(),
  abn: z.string().max(32).optional(),
  bio: z.string().max(400).optional(),
  licencePhotoUrl: z.string().url().optional(),
  insurancePhotoUrl: z.string().url().optional(),
  vehiclePhotoUrl: z.string().url().optional(),
  licenceExpiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  insuranceExpiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  serviceSuburbs: z.array(z.string().min(2)).max(20).default([]),
});

export type CarrierOnboardingInput = z.infer<typeof carrierOnboardingSchema>;
