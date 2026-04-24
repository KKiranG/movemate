import Stripe from "stripe";

import { getAppUrl, hasSupabaseAdminEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeServerClient } from "@/lib/stripe/client";

function getConnectReturnUrl() {
  return process.env.STRIPE_CONNECT_RETURN_URL ?? `${getAppUrl()}/api/carrier/stripe/connect-return`;
}

function getConnectRefreshUrl() {
  return process.env.STRIPE_CONNECT_REFRESH_URL ?? `${getAppUrl()}/carrier/onboarding`;
}

function assertConnectReady() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new AppError("Stripe is not configured.", 503, "stripe_unavailable");
  }

  if (!hasSupabaseAdminEnv()) {
    throw new AppError("Supabase admin is not configured.", 503, "supabase_admin_unavailable");
  }
}

function getDisplayName(params: {
  businessName?: string | null;
  contactName?: string | null;
  email?: string | null;
}) {
  return params.businessName?.trim() || params.contactName?.trim() || params.email?.trim() || "MoveMate carrier";
}

export async function getCarrierStripeStateByUserId(userId: string) {
  assertConnectReady();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("carriers")
    .select("id, business_name, contact_name, email, stripe_account_id, stripe_onboarding_complete")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500, "carrier_lookup_failed");
  }

  if (!data) {
    throw new AppError("Carrier profile not found.", 404, "carrier_missing");
  }

  return data;
}

export async function ensureCarrierStripeAccount(params: {
  carrierId: string;
  businessName?: string | null;
  contactName?: string | null;
  email?: string | null;
  existingAccountId?: string | null;
  stripe?: Stripe;
}) {
  assertConnectReady();

  if (params.existingAccountId) {
    return params.existingAccountId;
  }

  const stripe = params.stripe ?? getStripeServerClient();
  const account = await stripe.accounts.create({
    type: "express",
    country: "AU",
    email: params.email ?? undefined,
    business_type: "individual",
    metadata: {
      carrierId: params.carrierId,
    },
    business_profile: {
      name: getDisplayName(params),
      product_description: "Spare-capacity carrier using MoveMate to post real Sydney trips.",
      url: getAppUrl(),
    },
  });

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("carriers")
    .update({
      stripe_account_id: account.id,
      stripe_onboarding_complete: false,
    })
    .eq("id", params.carrierId);

  if (error) {
    throw new AppError(error.message, 500, "carrier_stripe_account_save_failed");
  }

  return account.id;
}

export async function createCarrierConnectAccountLink(params: {
  accountId: string;
  stripe?: Stripe;
}) {
  const stripe = params.stripe ?? getStripeServerClient();
  return stripe.accountLinks.create({
    account: params.accountId,
    refresh_url: getConnectRefreshUrl(),
    return_url: getConnectReturnUrl(),
    type: "account_onboarding",
  });
}

export async function syncCarrierStripeOnboardingStatus(params: {
  carrierId: string;
  accountId: string;
  stripe?: Stripe;
}) {
  assertConnectReady();

  const stripe = params.stripe ?? getStripeServerClient();
  const account = await stripe.accounts.retrieve(params.accountId);
  const onboardingComplete = Boolean(account.charges_enabled && account.payouts_enabled);

  const supabase = createAdminClient();
  const patch = {
    stripe_account_id: account.id,
    stripe_onboarding_complete: onboardingComplete,
    onboarding_completed_at: onboardingComplete ? new Date().toISOString() : null,
  };
  const { error } = await supabase.from("carriers").update(patch).eq("id", params.carrierId);

  if (error) {
    throw new AppError(error.message, 500, "carrier_stripe_sync_failed");
  }

  return {
    accountId: account.id,
    onboardingComplete,
    chargesEnabled: Boolean(account.charges_enabled),
    payoutsEnabled: Boolean(account.payouts_enabled),
    requirementsDue: account.requirements?.currently_due ?? [],
  };
}

export async function syncCarrierStripeOnboardingStatusByAccount(params: {
  accountId: string;
  stripe?: Stripe;
}) {
  assertConnectReady();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("carriers")
    .select("id")
    .eq("stripe_account_id", params.accountId)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500, "carrier_lookup_failed");
  }

  if (!data) {
    return null;
  }

  return syncCarrierStripeOnboardingStatus({
    carrierId: data.id,
    accountId: params.accountId,
    stripe: params.stripe,
  });
}
