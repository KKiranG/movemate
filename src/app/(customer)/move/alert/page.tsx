import { AlertNetworkClient } from "@/app/(customer)/move/alert/alert-network-client";
import { TopAppBar } from "@/components/spec/chrome";
import { requirePageSessionUser } from "@/lib/auth";
import { getMoveRequestByIdForCustomer } from "@/lib/data/move-requests";
import { getCustomerProfileForUser } from "@/lib/data/profiles";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function AlertNetworkPage({
  searchParams,
}: {
  searchParams?: { moveRequestId?: string };
}) {
  const requestedMoveRequestId = searchParams?.moveRequestId;
  const user = requestedMoveRequestId && UUID_PATTERN.test(requestedMoveRequestId)
    ? await requirePageSessionUser()
    : null;
  const customer = user ? await getCustomerProfileForUser(user.id) : null;
  const moveRequest =
    customer && requestedMoveRequestId
      ? await getMoveRequestByIdForCustomer(customer.id, requestedMoveRequestId)
      : null;

  return (
    <main>
      <TopAppBar title="Alert the Network" backHref="/move/new/results" />
      <section className="screen space-y-5">
        <div className="space-y-2">
          <p className="eyebrow">Zero-match recovery</p>
          <h1 className="heading">No drivers going that way — yet.</h1>
          <p className="body text-[var(--text-secondary)]">
            We’ll alert verified drivers on similar corridors and tell you the moment someone posts your route.
          </p>
        </div>
        <AlertNetworkClient
          moveRequestId={requestedMoveRequestId}
          moveRequest={
            moveRequest
              ? {
                  id: moveRequest.id,
                  itemDescription: moveRequest.item.description,
                  pickupSuburb: moveRequest.route.pickupSuburb,
                  dropoffSuburb: moveRequest.route.dropoffSuburb,
                  preferredDate: moveRequest.route.preferredDate,
                }
              : null
          }
        />
      </section>
    </main>
  );
}
