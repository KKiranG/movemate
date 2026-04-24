import { redirect } from "next/navigation";

type BookPayPageProps = {
  params: { offerId: string };
  searchParams?: { moveRequestId?: string };
};

export default function BookPayPage({ params, searchParams }: BookPayPageProps) {
  const moveRequestId = searchParams?.moveRequestId;
  const query = moveRequestId ? `?moveRequestId=${encodeURIComponent(moveRequestId)}` : "";
  redirect(`/move/new/results/${params.offerId}${query}`);
}
