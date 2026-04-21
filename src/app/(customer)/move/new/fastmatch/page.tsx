import { MoveFastMatchClient } from "@/components/customer/move-fast-match-client";
import { getOptionalSessionUser } from "@/lib/auth";

export default async function FastMatchPage({
  searchParams,
}: {
  searchParams?: {
    moveRequestId?: string;
  };
}) {
  const user = await getOptionalSessionUser();

  return (
    <MoveFastMatchClient
      isAuthenticated={Boolean(user)}
      initialMoveRequestId={searchParams?.moveRequestId ?? null}
    />
  );
}
