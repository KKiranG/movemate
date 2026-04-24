import { redirect } from "next/navigation";

type BookSubmittedPageProps = {
  params: { offerId: string };
  searchParams?: { moveRequestId?: string };
};

export default function BookSubmittedPage({ params, searchParams }: BookSubmittedPageProps) {
  const moveRequestId = searchParams?.moveRequestId;
  const query = moveRequestId ? `?moveRequestId=${encodeURIComponent(moveRequestId)}` : "";
  redirect(`/move/new/results/${params.offerId}${query}`);
}
