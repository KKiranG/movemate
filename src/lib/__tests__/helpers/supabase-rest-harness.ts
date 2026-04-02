import type { Database } from "@/types/database";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type BookingEventRow = Database["public"]["Tables"]["booking_events"]["Row"];
type CarrierRow = Database["public"]["Tables"]["carriers"]["Row"];
type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];
type DisputeRow = Database["public"]["Tables"]["disputes"]["Row"];

export interface SupabaseRequestLog {
  method: string;
  pathname: string;
  search: string;
  body: unknown;
}

export interface SupabaseRpcCall {
  name: string;
  args: Record<string, unknown> | null;
}

export interface SupabaseRestHarnessSeed {
  bookings?: BookingRow[];
  bookingEvents?: BookingEventRow[];
  carriers?: CarrierRow[];
  customers?: CustomerRow[];
  disputes?: DisputeRow[];
}

export interface SupabaseRestHarnessState {
  bookings: BookingRow[];
  bookingEvents: BookingEventRow[];
  carriers: CarrierRow[];
  customers: CustomerRow[];
  disputes: DisputeRow[];
  requests: SupabaseRequestLog[];
  rpcCalls: SupabaseRpcCall[];
}

interface EnvSnapshot {
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

const SUPABASE_TEST_URL = "http://supabase.test";
const SUPABASE_TEST_ANON_KEY = "anon-test-key";
const SUPABASE_TEST_SERVICE_ROLE_KEY = "service-role-test-key";
const DEFAULT_POINT = {
  type: "Point",
  coordinates: [151.2093, -33.8688],
} as const;
const DEFAULT_TIMESTAMP = "2026-04-02T10:00:00.000Z";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function nextTimestamp(offsetMinutes = 0) {
  return new Date(
    new Date(DEFAULT_TIMESTAMP).getTime() + offsetMinutes * 60_000,
  ).toISOString();
}

function parseFilterValues(rawValue: string) {
  if (rawValue.startsWith("eq.")) {
    return { operator: "eq" as const, values: [rawValue.slice(3)] };
  }

  if (rawValue.startsWith("in.(") && rawValue.endsWith(")")) {
    return {
      operator: "in" as const,
      values: rawValue
        .slice(4, -1)
        .split(",")
        .map((value) => value.trim()),
    };
  }

  if (rawValue.startsWith("ilike.")) {
    return { operator: "ilike" as const, values: [rawValue.slice(6)] };
  }

  return null;
}

function matchesFilter(
  row: Record<string, unknown>,
  column: string,
  rawValue: string,
) {
  const parsed = parseFilterValues(rawValue);

  if (!parsed) {
    return true;
  }

  const currentValue = row[column];

  if (parsed.operator === "eq") {
    return String(currentValue) === parsed.values[0];
  }

  if (parsed.operator === "in") {
    return parsed.values.includes(String(currentValue));
  }

  if (parsed.operator === "ilike") {
    const needle = parsed.values[0].replaceAll("%", "").toLowerCase();
    return String(currentValue ?? "").toLowerCase().includes(needle);
  }

  return true;
}

function filterRows<T extends Record<string, unknown>>(
  rows: T[],
  searchParams: URLSearchParams,
) {
  return rows.filter((row) => {
    for (const [column, rawValue] of Array.from(searchParams.entries())) {
      if (column === "select") {
        continue;
      }

      if (!matchesFilter(row, column, rawValue)) {
        return false;
      }
    }

    return true;
  });
}

function shapeResponse(
  headers: Headers,
  rows: Record<string, unknown>[],
) {
  const accept = headers.get("accept") ?? "";

  if (accept.includes("application/vnd.pgrst.object+json")) {
    return rows[0] ?? null;
  }

  return rows;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

function withBookingEvents(
  row: BookingRow,
  state: SupabaseRestHarnessState,
): BookingRow & { events: BookingEventRow[] } {
  return {
    ...row,
    events: state.bookingEvents.filter((event) => event.booking_id === row.id),
  };
}

function captureSupabaseEnv() {
  return {
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  } satisfies EnvSnapshot;
}

function restoreSupabaseEnv(snapshot: EnvSnapshot) {
  for (const [key, value] of Object.entries(snapshot)) {
    if (value === undefined) {
      delete process.env[key];
      continue;
    }

    process.env[key] = value;
  }
}

function applyPatch<T extends Record<string, unknown>>(row: T, patch: unknown): T {
  if (!patch || typeof patch !== "object") {
    return row;
  }

  return {
    ...row,
    ...(patch as Partial<T>),
  };
}

export function installSupabaseRestHarness(
  seed: SupabaseRestHarnessSeed = {},
) {
  const envSnapshot = captureSupabaseEnv();
  const originalFetch = global.fetch;
  const state: SupabaseRestHarnessState = {
    bookings: clone(seed.bookings ?? []),
    bookingEvents: clone(seed.bookingEvents ?? []),
    carriers: clone(seed.carriers ?? []),
    customers: clone(seed.customers ?? []),
    disputes: clone(seed.disputes ?? []),
    requests: [],
    rpcCalls: [],
  };

  process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_TEST_URL;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = SUPABASE_TEST_ANON_KEY;
  process.env.SUPABASE_SERVICE_ROLE_KEY = SUPABASE_TEST_SERVICE_ROLE_KEY;

  global.fetch = (async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => {
    const request = new Request(input, init);
    const url = new URL(request.url);

    if (
      url.origin !== SUPABASE_TEST_URL ||
      !url.pathname.startsWith("/rest/v1/")
    ) {
      if (!originalFetch) {
        throw new Error(`Unhandled external fetch: ${request.url}`);
      }

      return originalFetch(request);
    }

    const bodyText =
      request.method === "GET" || request.method === "HEAD"
        ? null
        : await request.text();
    const parsedBody = bodyText ? JSON.parse(bodyText) : null;

    state.requests.push({
      method: request.method,
      pathname: url.pathname,
      search: url.search,
      body: parsedBody,
    });

    if (url.pathname === "/rest/v1/bookings") {
      if (request.method === "GET") {
        const rows = filterRows(state.bookings, url.searchParams).map((row) =>
          withBookingEvents(row, state),
        );
        return jsonResponse(shapeResponse(request.headers, rows));
      }

      if (request.method === "PATCH") {
        const rows = filterRows(state.bookings, url.searchParams);

        for (const row of rows) {
          Object.assign(
            row,
            applyPatch(row, parsedBody),
            { updated_at: nextTimestamp(5) },
          );
        }

        return jsonResponse(
          shapeResponse(
            request.headers,
            rows.map((row) => withBookingEvents(row, state)),
          ),
        );
      }
    }

    if (url.pathname === "/rest/v1/disputes" && request.method === "GET") {
      const rows = filterRows(state.disputes, url.searchParams);
      return jsonResponse(shapeResponse(request.headers, rows));
    }

    if (url.pathname === "/rest/v1/customers" && request.method === "GET") {
      const rows = filterRows(state.customers, url.searchParams);
      return jsonResponse(shapeResponse(request.headers, rows));
    }

    if (url.pathname === "/rest/v1/carriers" && request.method === "GET") {
      const rows = filterRows(state.carriers, url.searchParams);
      return jsonResponse(shapeResponse(request.headers, rows));
    }

    if (url.pathname === "/rest/v1/booking_events" && request.method === "POST") {
      const inserts = Array.isArray(parsedBody) ? parsedBody : [parsedBody];
      const insertedRows = inserts.map((insert, index) => ({
        id: `booking-event-${state.bookingEvents.length + index + 1}`,
        booking_id: String((insert as { booking_id?: unknown }).booking_id ?? ""),
        event_type: String((insert as { event_type?: unknown }).event_type ?? ""),
        actor_role: String((insert as { actor_role?: unknown }).actor_role ?? ""),
        actor_user_id:
          typeof (insert as { actor_user_id?: unknown }).actor_user_id === "string"
            ? String((insert as { actor_user_id?: unknown }).actor_user_id)
            : null,
        metadata:
          typeof (insert as { metadata?: unknown }).metadata === "object" &&
          (insert as { metadata?: unknown }).metadata !== null
            ? ((insert as { metadata: BookingEventRow["metadata"] }).metadata)
            : {},
        created_at: nextTimestamp(10 + index),
      } satisfies BookingEventRow));

      state.bookingEvents.push(...insertedRows);
      return jsonResponse(shapeResponse(request.headers, insertedRows), 201);
    }

    if (
      url.pathname === "/rest/v1/rpc/recalculate_listing_capacity" &&
      request.method === "POST"
    ) {
      state.rpcCalls.push({
        name: "recalculate_listing_capacity",
        args:
          parsedBody && typeof parsedBody === "object"
            ? (parsedBody as Record<string, unknown>)
            : null,
      });

      return jsonResponse([
        {
          remaining_capacity_pct: 55,
          listing_status: "booked_partial",
        },
      ]);
    }

    throw new Error(
      `Unhandled Supabase request in test harness: ${request.method} ${url.pathname}${url.search}`,
    );
  }) as typeof fetch;

  return {
    state,
    getBooking(bookingId: string) {
      return state.bookings.find((booking) => booking.id === bookingId);
    },
    restore() {
      global.fetch = originalFetch;
      restoreSupabaseEnv(envSnapshot);
    },
  };
}

export function createBookingRow(
  overrides: Partial<BookingRow> = {},
): BookingRow {
  return {
    id: "booking-1",
    listing_id: "listing-1",
    customer_id: "customer-1",
    carrier_id: "carrier-1",
    item_description: "Three sealed archive boxes",
    item_category: "boxes",
    item_dimensions: "0.8m x 0.6m x 0.5m",
    item_weight_kg: 18,
    item_photo_urls: [],
    needs_stairs: false,
    needs_helper: false,
    special_instructions: null,
    pickup_address: "1 George St, Sydney NSW",
    pickup_suburb: "Sydney",
    pickup_postcode: "2000",
    pickup_point: DEFAULT_POINT,
    pickup_access_notes: null,
    pickup_contact_name: null,
    pickup_contact_phone: null,
    dropoff_address: "10 Crown St, Surry Hills NSW",
    dropoff_suburb: "Surry Hills",
    dropoff_postcode: "2010",
    dropoff_point: DEFAULT_POINT,
    dropoff_access_notes: null,
    dropoff_contact_name: null,
    dropoff_contact_phone: null,
    base_price_cents: 12_000,
    stairs_fee_cents: 0,
    helper_fee_cents: 0,
    booking_fee_cents: 500,
    total_price_cents: 12_500,
    carrier_payout_cents: 10_200,
    platform_commission_cents: 1_800,
    booking_reference: "MVR-2026-0421",
    stripe_payment_intent_id: null,
    payment_status: "pending",
    payment_failure_code: null,
    payment_failure_reason: null,
    status: "pending",
    pickup_proof_photo_url: null,
    delivery_proof_photo_url: null,
    pickup_at: null,
    delivered_at: null,
    completed_at: null,
    customer_confirmed_at: null,
    cancelled_at: null,
    cancellation_reason: null,
    cancellation_reason_code: null,
    pending_expires_at: nextTimestamp(120),
    created_at: DEFAULT_TIMESTAMP,
    updated_at: DEFAULT_TIMESTAMP,
    ...overrides,
  };
}

export function createCustomerRow(
  overrides: Partial<CustomerRow> = {},
): CustomerRow {
  return {
    id: "customer-1",
    user_id: "customer-user-1",
    full_name: "Chris Customer",
    phone: "0400000000",
    email: "customer@example.com",
    total_bookings: 1,
    average_rating: 5,
    created_at: DEFAULT_TIMESTAMP,
    ...overrides,
  };
}

export function createCarrierRow(
  overrides: Partial<CarrierRow> = {},
): CarrierRow {
  return {
    id: "carrier-1",
    user_id: "carrier-user-1",
    business_name: "Sydney Spare Runs",
    contact_name: "Casey Carrier",
    phone: "0411000000",
    email: "carrier@example.com",
    abn: null,
    is_verified: true,
    verification_status: "verified",
    licence_photo_url: null,
    insurance_photo_url: null,
    vehicle_photo_url: null,
    bio: null,
    profile_photo_url: null,
    service_suburbs: ["Sydney"],
    total_trips: 4,
    total_bookings_completed: 2,
    average_rating: 5,
    rating_count: 2,
    stripe_account_id: null,
    stripe_onboarding_complete: true,
    onboarding_completed_at: DEFAULT_TIMESTAMP,
    verification_submitted_at: DEFAULT_TIMESTAMP,
    verified_at: DEFAULT_TIMESTAMP,
    verification_notes: null,
    internal_notes: null,
    internal_tags: [],
    licence_expiry_date: null,
    insurance_expiry_date: null,
    created_at: DEFAULT_TIMESTAMP,
    updated_at: DEFAULT_TIMESTAMP,
    ...overrides,
  };
}

export function createDisputeRow(
  overrides: Partial<DisputeRow> = {},
): DisputeRow {
  return {
    id: "dispute-1",
    booking_id: "booking-1",
    raised_by: "customer",
    raiser_id: "customer-1",
    category: "damage",
    description: "The item was delivered with fresh corner damage.",
    photo_urls: [],
    status: "open",
    resolution_notes: null,
    resolved_by: null,
    assigned_admin_user_id: null,
    created_at: DEFAULT_TIMESTAMP,
    resolved_at: null,
    ...overrides,
  };
}
