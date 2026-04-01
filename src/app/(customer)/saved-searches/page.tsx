import { requirePageSessionUser } from "@/lib/auth";
import { listUserSavedSearchesWithOptions } from "@/lib/data/saved-searches";
import { PageIntro } from "@/components/layout/page-intro";
import { SavedSearchesManager } from "@/components/search/saved-searches-manager";

export default async function SavedSearchesPage() {
  const user = await requirePageSessionUser();
  const searches = await listUserSavedSearchesWithOptions(user.id, {
    includeInactive: true,
  });

  return (
    <main id="main-content" className="page-shell">
      <PageIntro
        eyebrow="Saved searches"
        title="Manage your route alerts"
        description="Edit destination windows, pause noisy alerts, and keep your browse-to-book routes tidy."
      />

      <SavedSearchesManager searches={searches} />
    </main>
  );
}
