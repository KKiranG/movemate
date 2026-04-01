import { z } from "zod";

export function isValidAbn(value: string) {
  const digits = value.replace(/\s+/g, "").replace(/\D/g, "");

  if (digits.length !== 11) {
    return false;
  }

  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  const numbers = digits.split("").map((digit) => Number(digit));

  if (numbers.some((digit) => Number.isNaN(digit))) {
    return false;
  }

  const adjusted = numbers.map((digit, index) => (index === 0 ? digit - 1 : digit));
  const sum = adjusted.reduce((total, digit, index) => total + digit * weights[index], 0);

  return sum % 89 === 0;
}

export const carrierOnboardingSchema = z.object({
  businessName: z.string().min(2).max(120),
  contactName: z.string().min(2).max(120),
  phone: z.string().min(8).max(24),
  email: z.email(),
  abn: z
    .string()
    .max(32)
    .optional()
    .refine((value) => !value || isValidAbn(value), "Invalid ABN format."),
  bio: z.string().max(400).optional(),
  licencePhotoUrl: z.string().url().optional(),
  insurancePhotoUrl: z.string().url().optional(),
  vehiclePhotoUrl: z.string().url().optional(),
  licenceExpiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  insuranceExpiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  serviceSuburbs: z.array(z.string().min(2)).max(20).default([]),
});

export type CarrierOnboardingInput = z.infer<typeof carrierOnboardingSchema>;
