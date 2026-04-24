import type {
  BookingRequest,
  BookingRequestEvent,
  BookingRequestStatus,
} from "@/types/booking-request";

export function getBookingRequestUrgencyLabel(responseDeadlineAt: string, now = Date.now()) {
  const deadline = new Date(responseDeadlineAt).getTime();

  if (Number.isNaN(deadline)) {
    return null;
  }

  const diffMs = deadline - now;

  if (diffMs <= 0) {
    return "Expired";
  }

  const hoursLeft = diffMs / (60 * 60 * 1000);

  if (hoursLeft <= 1) {
    return "Less than 1 hour left";
  }

  if (hoursLeft <= 4) {
    return "Due soon";
  }

  return null;
}

export function getBookingRequestOutcomeCopy(status: BookingRequestStatus, typeLabel: string) {
  if (status === "declined") {
    return `${typeLabel} was declined, so MoveMate can route you into the next viable match without restarting from scratch.`;
  }

  if (status === "expired") {
    return typeLabel === "Fast Match"
      ? "Fast Match timed out before any carrier accepted, so MoveMate moved the route into recovery."
      : "The request window closed before this carrier made a decision, so MoveMate moved you into recovery.";
  }

  if (status === "revoked") {
    return "Another Fast Match carrier accepted first, so this request closed automatically and did not stay open in parallel.";
  }

  if (status === "cancelled") {
    return "You cancelled this request before a carrier accepted, so MoveMate reopened the route for a fresh request later.";
  }

  return null;
}

export function buildBookingRequestTimeline(
  bookingRequest: Pick<
    BookingRequest,
    | "status"
    | "createdAt"
    | "clarificationRequestedAt"
    | "customerResponseAt"
    | "respondedAt"
    | "expiresAt"
  >,
  events: BookingRequestEvent[],
) {
  const timeline = [
    {
      key: "submitted",
      title: "Request submitted",
      description: "MoveMate sent the request into the carrier decision queue.",
      createdAt: bookingRequest.createdAt,
    },
  ];

  const orderedEvents = [...events].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );

  for (const event of orderedEvents) {
    switch (event.eventType) {
      case "clarification_requested":
        timeline.push({
          key: `${event.id}:clarification`,
          title: "Clarification requested",
          description:
            typeof event.metadata.message === "string"
              ? event.metadata.message
              : "Carrier asked for one factual clarification round.",
          createdAt: event.createdAt,
        });
        break;
      case "clarification_answered":
        timeline.push({
          key: `${event.id}:response`,
          title: "Customer reply sent",
          description:
            typeof event.metadata.customerResponse === "string"
              ? event.metadata.customerResponse
              : "The missing detail was sent back into the request queue.",
          createdAt: event.createdAt,
        });
        break;
      case "accepted":
        timeline.push({
          key: `${event.id}:accepted`,
          title: "Accepted",
          description: "Carrier accepted and MoveMate converted the request into a booking.",
          createdAt: event.createdAt,
        });
        break;
      case "declined":
        timeline.push({
          key: `${event.id}:declined`,
          title: "Declined",
          description:
            typeof event.metadata.declineReasonLabel === "string"
              ? event.metadata.declineReasonLabel
              : "Carrier declined the request.",
          createdAt: event.createdAt,
        });
        break;
      case "revoked":
        timeline.push({
          key: `${event.id}:revoked`,
          title: "Revoked",
          description: "Another Fast Match carrier accepted first, so this request closed automatically.",
          createdAt: event.createdAt,
        });
        break;
      case "cancelled_by_customer":
        timeline.push({
          key: `${event.id}:cancelled`,
          title: "Cancelled by customer",
          description: "The customer withdrew the request before carrier acceptance.",
          createdAt: event.createdAt,
        });
        break;
      case "expired":
        timeline.push({
          key: `${event.id}:expired`,
          title: "Expired",
          description: "The response or clarification window closed without a final accept.",
          createdAt: event.createdAt,
        });
        break;
      default:
        break;
    }
  }

  if (
    bookingRequest.status === "clarification_requested" &&
    bookingRequest.clarificationRequestedAt &&
    !orderedEvents.some((event) => event.eventType === "clarification_requested")
  ) {
    timeline.push({
      key: "clarification_requested",
      title: "Clarification requested",
      description: "Carrier asked for one factual clarification round.",
      createdAt: bookingRequest.clarificationRequestedAt,
    });
  }

  if (
    bookingRequest.customerResponseAt &&
    !orderedEvents.some((event) => event.eventType === "clarification_answered")
  ) {
    timeline.push({
      key: "clarification_answered",
      title: "Customer reply sent",
      description: "The missing detail was sent back into the request queue.",
      createdAt: bookingRequest.customerResponseAt,
    });
  }

  if (
    bookingRequest.status === "expired" &&
    bookingRequest.expiresAt &&
    !orderedEvents.some((event) => event.eventType === "expired")
  ) {
    timeline.push({
      key: "expired",
      title: "Expired",
      description: "The response or clarification window closed without a final accept.",
      createdAt: bookingRequest.expiresAt,
    });
  }

  return timeline.sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );
}
