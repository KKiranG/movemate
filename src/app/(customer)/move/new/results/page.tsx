import { MoveResultsClient } from "@/components/customer/move-results-client";
import { getOptionalSessionUser } from "@/lib/auth";

export default async function MoveResultsPage(
  props: {
    searchParams?: Promise<{
      moveRequestId?: string;
    }>;
  }
) {
  const searchParams = await props.searchParams;
  const user = await getOptionalSessionUser();

  return (
    <MoveResultsClient
      isAuthenticated={Boolean(user)}
      initialMoveRequestId={searchParams?.moveRequestId ?? null}
    />
  );
}
