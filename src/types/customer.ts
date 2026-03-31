export interface CustomerProfile {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  totalBookings: number;
  averageRating: number;
}

export interface SavedSearch {
  id: string;
  userId?: string | null;
  fromSuburb: string;
  fromPostcode?: string | null;
  toSuburb: string;
  toPostcode?: string | null;
  itemCategory?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  notifyEmail: string;
  lastNotifiedAt?: string | null;
  notificationCount: number;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}
