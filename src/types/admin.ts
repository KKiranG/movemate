export interface ValidationMetric {
  label: string;
  value: number;
  kind?: "number" | "percentage" | "currency";
  helperText?: string;
}

export type OperatorTaskType =
  | "unmatched_sla_breach"
  | "stale_trip_followup"
  | "concierge_followup"
  | "dispute_review"
  | "verification_review"
  | "payout_blocker";

export type OperatorTaskStatus = "open" | "in_progress" | "resolved" | "cancelled";

export type OperatorTaskPriority = "urgent" | "high" | "normal" | "low";

export interface OperatorTask {
  id: string;
  taskType: OperatorTaskType;
  status: OperatorTaskStatus;
  priority: OperatorTaskPriority;
  unmatchedRequestId?: string | null;
  listingId?: string | null;
  bookingId?: string | null;
  disputeId?: string | null;
  carrierId?: string | null;
  corridorKey?: string | null;
  title: string;
  blocker?: string | null;
  nextAction?: string | null;
  dueAt?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

export interface ConciergeOfferRecord {
  id: string;
  unmatchedRequestId: string;
  customerId?: string | null;
  moveRequestId?: string | null;
  listingId?: string | null;
  offerId?: string | null;
  bookingRequestId?: string | null;
  carrierId: string;
  carrierBusinessName?: string | null;
  operatorTaskId?: string | null;
  status: "draft" | "sent" | "accepted" | "declined" | "cancelled";
  quotedTotalPriceCents: number;
  note?: string | null;
  sentAt?: string | null;
  respondedAt?: string | null;
  cancelledReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminActionEvent {
  id: string;
  adminUserId?: string | null;
  actorRole?: "admin" | "system";
  entityType:
    | "unmatched_request"
    | "listing"
    | "booking"
    | "dispute"
    | "carrier"
    | "concierge_offer"
    | "operator_task"
    | "booking_request"
    | "request_group"
    | "condition_adjustment";
  entityId: string;
  actionType: string;
  reason?: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface MatchedAlertNotificationRecord {
  id: string;
  unmatchedRequestId: string;
  customerId?: string | null;
  carrierId?: string | null;
  channel: "email";
  status: "pending" | "sent" | "failed" | "skipped";
  dedupeKey: string;
  sentAt?: string | null;
  failureReason?: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}
