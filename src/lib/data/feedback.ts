import { hasSupabaseAdminEnv, hasSupabaseEnv } from "@/lib/env";
import { updateBookingStatusForActor } from "@/lib/data/bookings";
import { buildBookingEmail } from "@/lib/email";
import { AppError } from "@/lib/errors";
import { sendBookingTransactionalEmail } from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { disputeSchema, type DisputeInput } from "@/lib/validation/dispute";
import { reviewSchema, type ReviewInput } from "@/lib/validation/review";
import { sanitizeText } from "@/lib/utils";
import type { Database } from "@/types/database";
import type { Dispute } from "@/types/dispute";
import type { Review } from "@/types/review";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
type DisputeRow = Database["public"]["Tables"]["disputes"]["Row"];

type BookingActorContext = {
  booking: BookingRow;
  actorRole: "customer" | "carrier";
  actorEntityId: string;
  revieweeId: string;
};

function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    bookingId: row.booking_id,
    reviewerType: row.reviewer_type,
    reviewerId: row.reviewer_id,
    revieweeId: row.reviewee_id,
    rating: row.rating,
    comment: row.comment,
    carrierResponse: row.carrier_response,
    carrierRespondedAt: row.carrier_responded_at,
    createdAt: row.created_at,
  };
}

function toDispute(row: DisputeRow): Dispute {
  return {
    id: row.id,
    bookingId: row.booking_id,
    raisedBy: row.raised_by,
    raiserId: row.raiser_id,
    category: row.category,
    description: row.description,
    photoUrls: row.photo_urls ?? [],
    status: row.status,
    resolutionNotes: row.resolution_notes,
    resolvedBy: row.resolved_by,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  };
}

async function getBookingActorContext(
  userId: string,
  bookingId: string,
): Promise<BookingActorContext | null> {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = createServerSupabaseClient();
  const [{ data: customer }, { data: carrier }, { data: booking, error: bookingError }] =
    await Promise.all([
      supabase.from("customers").select("id").eq("user_id", userId).maybeSingle(),
      supabase.from("carriers").select("id").eq("user_id", userId).maybeSingle(),
      supabase.from("bookings").select("*").eq("id", bookingId).maybeSingle(),
    ]);

  if (bookingError) {
    throw new AppError(bookingError.message, 500, "booking_feedback_lookup_failed");
  }

  if (!booking) {
    return null;
  }

  if (customer?.id && booking.customer_id === customer.id) {
    return {
      booking: booking as BookingRow,
      actorRole: "customer",
      actorEntityId: customer.id,
      revieweeId: booking.carrier_id,
    };
  }

  if (carrier?.id && booking.carrier_id === carrier.id) {
    return {
      booking: booking as BookingRow,
      actorRole: "carrier",
      actorEntityId: carrier.id,
      revieweeId: booking.customer_id,
    };
  }

  return null;
}

async function recordBookingEvent(params: {
  bookingId: string;
  actorRole: "customer" | "carrier" | "admin";
  actorUserId?: string | null;
  eventType: string;
  metadata?: Record<string, unknown>;
}) {
  if (!hasSupabaseEnv()) {
    return;
  }

  const supabase = createServerSupabaseClient();
  await supabase.from("booking_events").insert({
    booking_id: params.bookingId,
    actor_role: params.actorRole,
    actor_user_id: params.actorUserId ?? null,
    event_type: params.eventType,
    metadata: params.metadata ?? {},
  });
}

async function refreshRatingAggregate(params: {
  table: "carriers" | "customers";
  revieweeId: string;
}) {
  if (!hasSupabaseAdminEnv()) {
    return;
  }

  const supabase = createAdminClient();
  const { data: reviews, error: reviewsError } = await supabase
    .from("reviews")
    .select("rating")
    .eq("reviewee_id", params.revieweeId);

  if (reviewsError) {
    throw new AppError(reviewsError.message, 500, "review_aggregate_failed");
  }

  const ratingCount = reviews?.length ?? 0;
  const averageRating =
    ratingCount > 0
      ? Number(
          (
            reviews!.reduce((sum, review) => sum + review.rating, 0) / ratingCount
          ).toFixed(2),
        )
      : 0;

  const { error: aggregateError } = await supabase
    .from(params.table)
    .update({
      average_rating: averageRating,
      rating_count: ratingCount,
    })
    .eq("id", params.revieweeId);

  if (aggregateError) {
    throw new AppError(aggregateError.message, 500, "review_aggregate_update_failed");
  }
}

async function notifyCounterparty(params: {
  bookingId: string;
  recipientRole: "customer" | "carrier";
  emailType: "review_created" | "dispute_raised";
  subject: string;
  bodyLines: string[];
}) {
  if (!hasSupabaseAdminEnv()) {
    return;
  }

  const supabase = createAdminClient();
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("booking_reference, status, customer:customers(email), carrier:carriers(email)")
    .eq("id", params.bookingId)
    .single();

  if (error) {
    return;
  }

  const recipientEmail =
    params.recipientRole === "customer"
      ? (booking.customer as { email?: string } | null)?.email
      : (booking.carrier as { email?: string } | null)?.email;

  if (!recipientEmail) {
    return;
  }

  await sendBookingTransactionalEmail({
    bookingId: params.bookingId,
    bookingStatus: (booking as { status?: BookingRow["status"] } | null)?.status ?? null,
    emailType: params.emailType,
    to: recipientEmail,
    subject: `${params.subject}: ${(booking as { booking_reference?: string } | null)?.booking_reference ?? params.bookingId}`,
    html: buildBookingEmail({
      eyebrow: params.emailType === "review_created" ? "Review update" : "Dispute update",
      title: params.subject,
      intro:
        params.emailType === "review_created"
          ? "A new review was submitted on this completed MoveMate booking."
          : "A dispute was opened on this MoveMate booking and needs attention in-platform.",
      bookingReference:
        (booking as { booking_reference?: string } | null)?.booking_reference ?? params.bookingId,
      routeLabel: "Open the booking detail for the latest proof, status, and timeline.",
      ctaPath: `/bookings/${params.bookingId}`,
      ctaLabel: "Open booking detail",
      bodyLines: params.bodyLines,
    }),
  });
}

export async function listBookingReviews(bookingId: string) {
  if (!hasSupabaseEnv()) {
    return [] as Review[];
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new AppError(error.message, 500, "review_query_failed");
  }

  return (data ?? []).map((row) => toReview(row as ReviewRow));
}

export async function listReviewsForCarrier(carrierId: string) {
  if (!hasSupabaseEnv()) {
    return [] as Review[];
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("reviewee_id", carrierId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new AppError(error.message, 500, "carrier_review_query_failed");
  }

  return (data ?? []).map((row) => toReview(row as ReviewRow));
}

export async function listBookingDisputesForUser(userId: string, bookingId: string) {
  if (!hasSupabaseEnv()) {
    return [] as Dispute[];
  }

  const context = await getBookingActorContext(userId, bookingId);

  if (!context) {
    return [] as Dispute[];
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("disputes")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError(error.message, 500, "dispute_query_failed");
  }

  return (data ?? []).map((row) => toDispute(row as DisputeRow));
}

export async function getBookingFeedbackForUser(userId: string, bookingId: string) {
  const [context, reviews, disputes] = await Promise.all([
    getBookingActorContext(userId, bookingId),
    listBookingReviews(bookingId),
    listBookingDisputesForUser(userId, bookingId),
  ]);

  return {
    actorRole: context?.actorRole ?? null,
    userReview:
      context?.actorRole
        ? reviews.find((review) => review.reviewerType === context.actorRole) ?? null
        : null,
    reviews,
    disputes,
  };
}

export async function createReviewForBooking(userId: string, bookingId: string, input: ReviewInput) {
  if (!hasSupabaseEnv()) {
    throw new AppError("Supabase is not configured.", 503, "supabase_unavailable");
  }

  const parsed = reviewSchema.safeParse(input);

  if (!parsed.success) {
    throw new AppError("Review payload is invalid.", 400, "invalid_review");
  }

  const context = await getBookingActorContext(userId, bookingId);

  if (!context) {
    throw new AppError("Booking not found.", 404, "booking_not_found");
  }

  if (context.booking.status !== "completed") {
    throw new AppError(
      "Reviews are only available after the booking is completed.",
      400,
      "review_booking_incomplete",
    );
  }

  const supabase = createServerSupabaseClient();
  const { data: existingReview } = await supabase
    .from("reviews")
    .select("*")
    .eq("booking_id", bookingId)
    .eq("reviewer_type", context.actorRole)
    .maybeSingle();

  if (existingReview) {
    throw new AppError("You have already reviewed this booking.", 409, "review_exists");
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      booking_id: bookingId,
      reviewer_type: context.actorRole,
      reviewer_id: context.actorEntityId,
      reviewee_id: context.revieweeId,
      rating: parsed.data.rating,
      comment: parsed.data.comment?.trim() ? parsed.data.comment.trim() : null,
    })
    .select("*")
    .single();

  if (error) {
    throw new AppError(error.message, 500, "review_create_failed");
  }

  await refreshRatingAggregate({
    table: context.actorRole === "customer" ? "carriers" : "customers",
    revieweeId: context.revieweeId,
  });

  await recordBookingEvent({
    bookingId,
    actorRole: context.actorRole,
    actorUserId: userId,
    eventType: "review_created",
    metadata: {
      rating: parsed.data.rating,
    },
  });

  await notifyCounterparty({
    bookingId,
    recipientRole: context.actorRole === "customer" ? "carrier" : "customer",
    emailType: "review_created",
    subject: "New booking review submitted",
    bodyLines: ["A review has been submitted for your completed MoveMate booking."],
  });

  return toReview(data as ReviewRow);
}

export async function createDisputeForBooking(
  userId: string,
  bookingId: string,
  input: DisputeInput,
) {
  if (!hasSupabaseEnv()) {
    throw new AppError("Supabase is not configured.", 503, "supabase_unavailable");
  }

  const parsed = disputeSchema.safeParse(input);

  if (!parsed.success) {
    throw new AppError("Dispute payload is invalid.", 400, "invalid_dispute");
  }

  const context = await getBookingActorContext(userId, bookingId);

  if (!context) {
    throw new AppError("Booking not found.", 404, "booking_not_found");
  }

  if (!["delivered", "completed", "disputed"].includes(context.booking.status)) {
    throw new AppError(
      "Disputes are only available after delivery has happened.",
      400,
      "dispute_booking_ineligible",
    );
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("disputes")
    .insert({
      booking_id: bookingId,
      raised_by: context.actorRole,
      raiser_id: context.actorEntityId,
      category: parsed.data.category,
      description: parsed.data.description.trim(),
      photo_urls: parsed.data.photoUrls,
    })
    .select("*")
    .single();

  if (error) {
    throw new AppError(error.message, 500, "dispute_create_failed");
  }

  if (context.booking.status !== "disputed") {
    await updateBookingStatusForActor({
      userId,
      bookingId,
      nextStatus: "disputed",
      actorRole: context.actorRole,
      skipStatusEmails: true,
    });
  }

  await recordBookingEvent({
    bookingId,
    actorRole: context.actorRole,
    actorUserId: userId,
    eventType: "dispute_raised",
    metadata: {
      category: parsed.data.category,
    },
  });

  await notifyCounterparty({
    bookingId,
    recipientRole: context.actorRole === "customer" ? "carrier" : "customer",
    emailType: "dispute_raised",
    subject: "A booking dispute has been raised",
    bodyLines: [
      "A dispute has been opened on one of your MoveMate bookings.",
      "Check the booking timeline and proof details before replying.",
    ],
  });

  return toDispute(data as DisputeRow);
}

export async function respondToReviewAsCarrier(
  userId: string,
  reviewId: string,
  response: string,
) {
  if (!hasSupabaseEnv()) {
    throw new AppError("Supabase is not configured.", 503, "supabase_unavailable");
  }

  const supabase = createServerSupabaseClient();
  const [{ data: carrier }, { data: review, error }] = await Promise.all([
    supabase.from("carriers").select("id").eq("user_id", userId).maybeSingle(),
    supabase.from("reviews").select("*").eq("id", reviewId).maybeSingle(),
  ]);

  if (error) {
    throw new AppError(error.message, 500, "review_lookup_failed");
  }

  if (!carrier || !review || review.reviewee_id !== carrier.id) {
    throw new AppError("Review not found.", 404, "review_not_found");
  }

  if (review.carrier_response) {
    throw new AppError("A response has already been posted for this review.", 409, "review_response_exists");
  }

  const sanitizedResponse = sanitizeText(response);

  if (!sanitizedResponse) {
    throw new AppError("Response is required.", 400, "review_response_required");
  }

  const { data: updatedReview, error: updateError } = await supabase
    .from("reviews")
    .update({
      carrier_response: sanitizedResponse,
      carrier_responded_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .select("*")
    .single();

  if (updateError) {
    throw new AppError(updateError.message, 500, "review_response_failed");
  }

  await recordBookingEvent({
    bookingId: updatedReview.booking_id,
    actorRole: "carrier",
    actorUserId: userId,
    eventType: "review_responded",
  });

  return toReview(updatedReview as ReviewRow);
}
