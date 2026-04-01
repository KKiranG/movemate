import type { MetadataRoute } from "next";

import { getAppUrl } from "@/lib/env";
import { hasSupabaseAdminEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

type ListingRow = {
  id: string;
  updated_at: string;
  publish_at: string | null;
  status: string;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getAppUrl().replace(/\/$/, "");
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
    },
    {
      url: `${siteUrl}/search`,
      lastModified: new Date(),
    },
  ];

  if (!hasSupabaseAdminEnv()) {
    return routes;
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("capacity_listings")
    .select("id, updated_at, publish_at, status")
    .in("status", ["active", "booked_partial"])
    .lte("publish_at", new Date().toISOString())
    .order("updated_at", { ascending: false })
    .limit(1000);

  for (const listing of (data ?? []) as ListingRow[]) {
    routes.push({
      url: `${siteUrl}/trip/${listing.id}`,
      lastModified: listing.updated_at ? new Date(listing.updated_at) : new Date(),
    });
  }

  return routes;
}
