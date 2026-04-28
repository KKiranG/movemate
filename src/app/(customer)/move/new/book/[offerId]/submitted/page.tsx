import { redirect } from "next/navigation";

type BookSubmittedPageProps = {
  params: Promise<{ offerId: string }>;
  searchParams?: Promise<{ moveRequestId?: string }>;
};

export default async function BookSubmittedPage(props: BookSubmittedPageProps) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const moveRequestId = searchParams?.moveRequestId;
  const query = moveRequestId ? `?moveRequestId=${encodeURIComponent(moveRequestId)}` : "";
  redirect(`/move/new/results/${params.offerId}${query}`);
}
