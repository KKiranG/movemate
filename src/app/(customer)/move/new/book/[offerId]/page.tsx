import { redirect } from "next/navigation";

export default async function BookOfferIndexPage(
  props: {
    params: Promise<{ offerId: string }>;
    searchParams?: Promise<{
      moveRequestId?: string;
    }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const next = searchParams?.moveRequestId
    ? `?moveRequestId=${encodeURIComponent(searchParams.moveRequestId)}`
    : "";

  redirect(`/move/new/results/${params.offerId}${next}`);
}
