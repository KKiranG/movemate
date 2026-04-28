import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CustomerBookingDetailView } from "@/components/booking/customer-booking-detail-view";
import { CustomerBookingRequestDetailView } from "@/components/booking/customer-booking-request-detail-view";
import { requirePageSessionUser } from "@/lib/auth";
import {
  getCustomerBookingDetailById,
  getCustomerBookingRequestDetailById,
} from "@/lib/data/customer-booking-detail";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Booking detail",
  };
}

export default async function BookingLiveViewPage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
  const user = await requirePageSessionUser();
  const [bookingDetail, requestDetail] = await Promise.all([
    getCustomerBookingDetailById(user.id, params.id),
    getCustomerBookingRequestDetailById(user.id, params.id),
  ]);

  if (bookingDetail) {
    return <CustomerBookingDetailView detail={bookingDetail} />;
  }

  if (requestDetail) {
    return <CustomerBookingRequestDetailView detail={requestDetail} />;
  }

  notFound();
}
