import { redirect } from "next/navigation";

export default function BookOfferIndexPage({ params }: { params: { offerId: string } }) {
  redirect(`/move/new/book/${params.offerId}/item`);
}
