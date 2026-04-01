"use client";

import { useAuthRefresh } from "@/hooks/useAuthRefresh";

export function AppClientEffects() {
  useAuthRefresh();
  return null;
}
