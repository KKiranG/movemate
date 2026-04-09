---
name: verify-api
description: Verify API routes with direct execution, error handling, and one adversarial input.
when_to_use: Use after backend or API changes that affect validation, booking, search, or trust-critical flows.
argument-hint: [route: /api/route-path]
paths:
  - src/app/api/**
  - src/lib/data/**
---

# Verify API

Use `$ARGUMENTS` to scope to a specific route (e.g. `/api/bookings/[id]/confirm`).

## Check

- direct route or function exercise with representative input
- response shape and status code
- error handling: missing fields, invalid values, unauthorized access
- one boundary or adversarial case
- graceful degradation where relevant (Supabase env, Stripe config)

## Adversarial Probe

Run at least one named probe and report it by name:

- missing-auth: call the route without a valid session and confirm 401/403
- invalid-body: send malformed or incomplete JSON and confirm 400 with useful message
- duplicate-action: submit the same mutation twice and confirm idempotent or correct rejection
- role-mismatch: call a carrier route as a customer (or vice versa) and confirm rejection

## Report

End every run with:

```
Route tested: [path and method]
Checks run: [list]
Evidence observed: [response status, body shape, error messages]
Pass / fail / partial: [verdict]
Adversarial probe: [name of probe + what you sent + what you got back]
Residual risk: [anything not verified]
```
