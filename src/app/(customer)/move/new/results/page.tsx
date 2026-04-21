import { MoveResultsClient } from "@/components/customer/move-results-client";
import { getOptionalSessionUser } from "@/lib/auth";

export default async function MoveResultsPage({
  searchParams,
}: {
  searchParams?: {
    moveRequestId?: string;
  };
}) {
  const user = await getOptionalSessionUser();

  return (
    <MoveResultsClient
      isAuthenticated={Boolean(user)}
      initialMoveRequestId={searchParams?.moveRequestId ?? null}
    />
  );
}
