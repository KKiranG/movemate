import type { Metadata } from "next";

import { requirePageSessionUser } from "@/lib/auth";
import { listUnmatchedRequestsForCustomer } from "@/lib/data/unmatched-requests";
import { listUserSavedSearchesWithOptions } from "@/lib/data/saved-searches";
import { PageIntro } from "@/components/layout/page-intro";
import { AlertsManager } from "@/components/search/alerts-manager";

export const metadata: Metadata = {
  title: "Alerts",
  description: "Manage route alerts so moverrr can notify you when matching spare-capacity supply appears.",
};

export default async function AlertsPage() {
  const user = await requirePageSessionUser();
  const [alerts, routeRequests] = await Promise.all([
    listUserSavedSearchesWithOptions(user.id, {
      includeInactive: true,
    }),
    listUnmatchedRequestsForCustomer(user.id),
  ]);

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Alerts"
        title="Manage your route alerts"
        description="Keep route alerts active, review recovery alerts from declined or expired requests, and pause or resume follow-up when your move need changes."
      />

      <AlertsManager alerts={alerts} routeRequests={routeRequests} />
    </main>
  );
}
