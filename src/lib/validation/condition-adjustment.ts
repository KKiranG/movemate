import { z } from "zod";

import {
  CONDITION_ADJUSTMENT_AMOUNTS,
  CONDITION_ADJUSTMENT_REASONS,
} from "@/lib/constants";

const reasonValues = CONDITION_ADJUSTMENT_REASONS.map((reason) => reason.value) as [
  (typeof CONDITION_ADJUSTMENT_REASONS)[number]["value"],
  ...(typeof CONDITION_ADJUSTMENT_REASONS)[number]["value"][],
];

export const conditionAdjustmentCreateSchema = z.object({
  reasonCode: z.enum(reasonValues),
  amountCents: z
    .number()
    .int()
    .refine(
      (value) =>
        CONDITION_ADJUSTMENT_AMOUNTS.includes(
          value as (typeof CONDITION_ADJUSTMENT_AMOUNTS)[number],
        ),
      "Choose one of MoveMate's fixed adjustment amounts.",
    ),
  note: z.string().trim().max(280).optional(),
});

export const conditionAdjustmentResponseSchema = z.object({
  action: z.enum(["accept", "reject"]),
  customerResponseNote: z.string().trim().max(280).optional(),
});

export function getConditionAdjustmentReasonLabel(value: string) {
  return (
    CONDITION_ADJUSTMENT_REASONS.find((reason) => reason.value === value)?.label ??
    "Condition adjustment"
  );
}
