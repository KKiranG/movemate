"use client";

import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";

export function useAuthRefresh() {
  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.startAutoRefresh();

      return () => {
        supabase.auth.stopAutoRefresh();
      };
    } catch {
      return;
    }
  }, []);
}
