-- Migration 039: Mover handling policy + stairs tranches (Issue #70)
--
-- Adds three-option handling policy to carrier trips/templates, replaces the
-- binary stairs flag with per-tranche pricing, and adds structured
-- mover-preference and access fields to customer move requests and bookings.
--
-- Old columns (helper_available, helper_extra_cents, needs_helper,
-- helper_fee_cents, needs_stairs, stairs_ok, stairs_extra_cents) are kept for
-- backward compatibility. New fields drive all new logic.

-- ─── Carrier-side enums ──────────────────────────────────────────────────────

create type handling_policy as enum (
  'solo_only',           -- carrier travels alone; single-person jobs only
  'solo_customer_help',  -- carrier alone; accepts jobs where customer helps lift
  'two_movers'           -- carrier brings two people; eligible for two-mover jobs
);

-- ─── Customer-side enums ─────────────────────────────────────────────────────

create type mover_preference as enum (
  'one_mover',    -- item is manageable, access is simple
  'customer_help', -- customer will help lift
  'two_movers'    -- carrier must supply two movers
);

create type stairs_level as enum (
  'none',   -- ground floor or no significant stairs
  'low',    -- 1 flight or basement/underground access
  'medium', -- 2 flights
  'high'    -- 3 or more flights
);

-- ─── capacity_listings ───────────────────────────────────────────────────────

alter table capacity_listings
  add column handling_policy       handling_policy not null default 'solo_only',
  add column stairs_low_cents      integer         not null default 0,
  add column stairs_medium_cents   integer         not null default 0,
  add column stairs_high_cents     integer         not null default 0,
  add column second_mover_extra_cents integer      not null default 0;

-- Backfill handling_policy from legacy helper_available
update capacity_listings
  set handling_policy = 'solo_customer_help'
  where helper_available = true;

-- Backfill stairs tranche from legacy single stairs_extra_cents
update capacity_listings
  set stairs_low_cents = stairs_extra_cents
  where stairs_ok = true and stairs_extra_cents > 0;

-- Backfill second mover from legacy helper_extra_cents
update capacity_listings
  set second_mover_extra_cents = helper_extra_cents
  where helper_extra_cents > 0;

-- ─── trip_templates ──────────────────────────────────────────────────────────

alter table trip_templates
  add column handling_policy       handling_policy not null default 'solo_only',
  add column stairs_low_cents      integer         not null default 0,
  add column stairs_medium_cents   integer         not null default 0,
  add column stairs_high_cents     integer         not null default 0,
  add column second_mover_extra_cents integer      not null default 0;

update trip_templates
  set handling_policy = 'solo_customer_help'
  where helper_available = true;

update trip_templates
  set stairs_low_cents = stairs_extra_cents
  where stairs_ok = true and stairs_extra_cents > 0;

update trip_templates
  set second_mover_extra_cents = helper_extra_cents
  where helper_extra_cents > 0;

-- ─── move_requests ───────────────────────────────────────────────────────────

alter table move_requests
  add column customer_mover_preference mover_preference not null default 'one_mover',
  add column stairs_level_pickup       stairs_level     not null default 'none',
  add column stairs_level_dropoff      stairs_level     not null default 'none',
  add column lift_available_pickup     boolean          not null default false,
  add column lift_available_dropoff    boolean          not null default false;

-- Backfill: needs_helper=true → customer_help (conservative approximation)
update move_requests
  set customer_mover_preference = 'customer_help'
  where needs_helper = true;

-- Backfill: needs_stairs=true → low (conservative: we don't know the actual level)
update move_requests
  set stairs_level_pickup = 'low'
  where needs_stairs = true;

-- ─── bookings ────────────────────────────────────────────────────────────────

alter table bookings
  add column customer_mover_preference mover_preference not null default 'one_mover',
  add column stairs_level_pickup       stairs_level     not null default 'none',
  add column stairs_level_dropoff      stairs_level     not null default 'none',
  add column lift_available_pickup     boolean          not null default false,
  add column lift_available_dropoff    boolean          not null default false,
  add column second_mover_fee_cents    integer          not null default 0;

update bookings
  set customer_mover_preference = 'customer_help'
  where needs_helper = true;

update bookings
  set stairs_level_pickup = 'low'
  where needs_stairs = true;

-- Backfill second_mover_fee_cents from legacy helper_fee_cents
update bookings
  set second_mover_fee_cents = helper_fee_cents
  where helper_fee_cents > 0;
