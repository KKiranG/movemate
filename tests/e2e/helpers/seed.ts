// Deterministic E2E seed data — sourced from supabase/seed.sql.
// All IDs and credentials are fixed so tests are reproducible.
// Run `npm run supabase:reset` (local) or `npm run e2e:reset` (cloud dev) before the first run.

export const SEED = {
  carrier: {
    userId: "11111111-1111-1111-1111-111111111111",
    email: process.env.E2E_CARRIER_EMAIL ?? "carrier@example.com",
    password: process.env.E2E_CARRIER_PASSWORD ?? "Password123!",
    name: "Seed Carrier",
  },
  customer: {
    userId: "22222222-2222-2222-2222-222222222222",
    email: process.env.E2E_CUSTOMER_EMAIL ?? "customer@example.com",
    password: process.env.E2E_CUSTOMER_PASSWORD ?? "Password123!",
    name: "Seed Customer",
  },
  // E2E marker appended to created records so cleanup is safe and targeted.
  e2eMarker: "__e2e__",
} as const;

// Routes used across tests — centralised so URL changes are one-line fixes.
export const ROUTES = {
  home: "/",
  login: "/auth/login",
  signup: "/auth/signup",
  moveNew: "/move/new",
  moveRoute: "/move/new/route",
  moveResults: "/move/new/results",
  moveAlert: "/move/alert",
  carrierAuth: "/carrier/auth",
  carrierAuthLogin: "/carrier/auth/login",
  carrierDashboard: "/carrier/dashboard",
  carrierTrips: "/carrier/trips",
  carrierTripNew: "/carrier/trips/new",
  carrierRequests: "/carrier/requests",
  customerBookings: "/bookings",
  customerActivity: "/activity",
  health: "/api/health",
} as const;
