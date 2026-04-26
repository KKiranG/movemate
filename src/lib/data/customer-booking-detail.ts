import { getBookingByIdForUser } from "@/lib/data/bookings";
import {
  getBookingRequestByIdForCustomer,
  getCustomerRequestGroupSummary,
  listCustomerRequestTimeline,
} from "@/lib/data/booking-requests";
import { listBookingDisputesForUser } from "@/lib/data/feedback";
import { getMoveRequestByIdForCustomer } from "@/lib/data/move-requests";
import { getOfferById } from "@/lib/data/offers";
import { requireCustomerProfileForUser } from "@/lib/data/profiles";
import { getTripById } from "@/lib/data/trips";
import type { Booking } from "@/types/booking";
import type {
  BookingRequest,
  BookingRequestEvent,
  CustomerRequestGroupSummary,
} from "@/types/booking-request";
import type { Dispute } from "@/types/dispute";
import type { MoveRequest, Offer } from "@/types/move-request";
import type { Trip } from "@/types/trip";

export interface CustomerBookingDetailData {
  booking: Booking;
  trip: Trip | null;
  disputes: Dispute[];
}

export interface CustomerBookingRequestDetailData {
  bookingRequest: BookingRequest;
  moveRequest: MoveRequest;
  offer: Offer;
  trip: Trip | null;
  timeline: BookingRequestEvent[];
  groupSummary: CustomerRequestGroupSummary | null;
}

export async function getCustomerBookingDetailById(
  userId: string,
  bookingId: string,
): Promise<CustomerBookingDetailData | null> {
  const booking = await getBookingByIdForUser(userId, bookingId);

  if (!booking) {
    return null;
  }

  const [trip, disputes] = await Promise.all([
    getTripById(booking.listingId),
    listBookingDisputesForUser(userId, booking.id),
  ]);

  return {
    booking,
    trip,
    disputes,
  };
}

export async function getCustomerBookingRequestDetailById(
  userId: string,
  bookingRequestId: string,
): Promise<CustomerBookingRequestDetailData | null> {
  const customer = await requireCustomerProfileForUser(userId);
  const bookingRequest = await getBookingRequestByIdForCustomer(userId, bookingRequestId);

  if (!bookingRequest) {
    return null;
  }

  const [moveRequest, offer, trip, timeline, groupSummary] = await Promise.all([
    getMoveRequestByIdForCustomer(customer.id, bookingRequest.moveRequestId),
    getOfferById(bookingRequest.offerId),
    getTripById(bookingRequest.listingId),
    listCustomerRequestTimeline(userId, bookingRequest.id),
    bookingRequest.requestGroupId
      ? getCustomerRequestGroupSummary(userId, bookingRequest.requestGroupId)
      : Promise.resolve(null),
  ]);

  if (!moveRequest || !offer) {
    return null;
  }

  return {
    bookingRequest,
    moveRequest,
    offer,
    trip,
    timeline,
    groupSummary,
  };
}
