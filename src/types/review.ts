export interface Review {
  id: string;
  bookingId: string;
  reviewerType: "customer" | "carrier";
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string | null;
  carrierResponse?: string | null;
  carrierRespondedAt?: string | null;
  createdAt: string;
}
