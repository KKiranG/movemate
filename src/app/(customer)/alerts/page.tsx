import type { Metadata } from "next";

import { requirePageSessionUser } from "@/lib/auth";
import { listUserSavedSearchesWithOptions } from "@/lib/data/saved-searches";
import { PageIntro } from "@/components/layout/page-intro";
import { AlertsManager } from "@/components/search/alerts-manager";

export const metadata: Metadata = {
  title: "Alerts",
  description: "Manage route alerts so moverrr can notify you when matching spare-capacity supply appears.",
};

export default async function AlertsPage() {
  const user = await requirePageSessionUser();
  const alerts = await listUserSavedSearchesWithOptions(user.id, {
    includeInactive: true,
  });

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Alerts"
        title="Manage your route alerts"
        description="Keep route alerts active, tighten the date window, and pause or resume follow-up when your move need changes."
      />

      <AlertsManager alerts={alerts} />
    </main>
  );
}
