import { z } from "zod";

import { hasSupabaseEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import type { SavedSearch } from "@/types/customer";
import type { Database } from "@/types/database";

const savedSearchSchema = z.object({
  fromSuburb: z.string().min(2).max(120),
  fromPostcode: z.string().min(3).max(8).optional(),
  toSuburb: z.string().min(2).max(120),
  toPostcode: z.string().min(3).max(8).optional(),
  itemCategory: z.string().min(1).max(40).optional(),
  dateFrom: z.string().min(1).optional(),
  dateTo: z.string().min(1).optional(),
  notifyEmail: z.string().email(),
});

type SavedSearchRow = Database["public"]["Tables"]["saved_searches"]["Row"];

function toSavedSearch(row: SavedSearchRow): SavedSearch {
  return {
    id: row.id,
    userId: row.user_id,
    fromSuburb: row.from_suburb,
    fromPostcode: row.from_postcode,
    toSuburb: row.to_suburb,
    toPostcode: row.to_postcode,
    itemCategory: row.item_category,
    dateFrom: row.date_from,
    dateTo: row.date_to,
    notifyEmail: row.notify_email,
    lastNotifiedAt: row.last_notified_at,
    notificationCount: row.notification_count,
    expiresAt: row.expires_at,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export async function createSavedSearch(
  userId: string,
  params: {
    fromSuburb: string;
    fromPostcode?: string;
    toSuburb: string;
    toPostcode?: string;
    itemCategory?: string;
    dateFrom?: string;
    dateTo?: string;
    notifyEmail: string;
  },
) {
  if (!hasSupabaseEnv()) {
    throw new AppError("Supabase is not configured.", 503, "supabase_unavailable");
  }

  const parsed = savedSearchSchema.safeParse(params);

  if (!parsed.success) {
    throw new AppError("Saved search payload is invalid.", 400, "invalid_saved_search");
  }

  const supabase = createServerSupabaseClient();
  const insertPayload: Database["public"]["Tables"]["saved_searches"]["Insert"] = {
    user_id: userId,
    from_suburb: parsed.data.fromSuburb,
    from_postcode: parsed.data.fromPostcode ?? null,
    to_suburb: parsed.data.toSuburb,
    to_postcode: parsed.data.toPostcode ?? null,
    item_category: parsed.data.itemCategory ?? null,
    date_from: parsed.data.dateFrom ?? null,
    date_to: parsed.data.dateTo ?? null,
    notify_email: parsed.data.notifyEmail,
  };

  const { data, error } = await supabase
    .from("saved_searches")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    throw new AppError(error.message, 500, "saved_search_create_failed");
  }

  return toSavedSearch(data);
}

export async function listUserSavedSearches(userId: string) {
  if (!hasSupabaseEnv()) {
    return [] as SavedSearch[];
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("saved_searches")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError(error.message, 500, "saved_search_query_failed");
  }

  return (data ?? []).map(toSavedSearch);
}

export async function deleteSavedSearch(id: string, userId: string) {
  if (!hasSupabaseEnv()) {
    return;
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("saved_searches")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw new AppError(error.message, 500, "saved_search_delete_failed");
  }
}

export async function deactivateSavedSearch(id: string) {
  if (!hasSupabaseEnv()) {
    return;
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("saved_searches")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    throw new AppError(error.message, 500, "saved_search_deactivate_failed");
  }
}
