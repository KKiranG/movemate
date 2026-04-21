import { redirect } from "next/navigation";

export default function BookOfferIndexPage({
  params,
  searchParams,
}: {
  params: { offerId: string };
  searchParams?: {
    moveRequestId?: string;
  };
}) {
  const next = searchParams?.moveRequestId
    ? `?moveRequestId=${encodeURIComponent(searchParams.moveRequestId)}`
    : "";

  redirect(`/move/new/results/${params.offerId}${next}`);
}
