import { MoveIntakeClient } from "@/components/customer/move-intake-client";
import { RecentMoveRequests } from "@/components/customer/recent-move-requests";
import { TopAppBar } from "@/components/spec/chrome";
import { getOptionalSessionUser } from "@/lib/auth";
import { listRecentMoveRequestsForUser } from "@/lib/data/move-requests";

export default async function MoveNewIndexPage() {
  const user = await getOptionalSessionUser();
  const recentRequests = user ? await listRecentMoveRequestsForUser(user.id) : [];

  return (
    <main className="pb-28">
      <TopAppBar title="New move" rightHref="/" rightLabel="Close" />
      <MoveIntakeClient isAuthenticated={Boolean(user)} />
      <section className="screen space-y-5">
        <RecentMoveRequests requests={recentRequests} />
      </section>
    </main>
  );
}
