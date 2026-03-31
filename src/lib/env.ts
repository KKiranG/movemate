import requiredProductionEnv from "../../config/required-production-env.json";

const REQUIRED_PRODUCTION_ENV = requiredProductionEnv as string[];

export function assertRequiredEnv() {
  if (process.env.NODE_ENV !== "production") return;

  const missing = REQUIRED_PRODUCTION_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. App cannot start.`,
    );
  }
}

export function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function hasSupabaseAdminEnv() {
  return hasSupabaseEnv() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function hasMapsEnv() {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY);
}

export function hasStripeEnv() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  );
}

export function hasResendEnv() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export function getSmokeBootstrapSecret() {
  return process.env.SMOKE_BOOTSTRAP_SECRET ?? "";
}
