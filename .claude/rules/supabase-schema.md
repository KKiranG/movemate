---
paths:
  - supabase/**
  - src/types/database.ts
  - src/lib/supabase/**
---

# Supabase Schema Rules

Schema work changes runtime truth. Treat it like product infrastructure.

## Expectations

- migrations stay sequential
- every new table gets RLS
- every geography column gets a GIST index
- RPC changes include clear contract intent
- generated types stay in sync with schema truth

## Review Questions

- what invariant does this schema change protect?
- what breaks if the migration partially applies?
- does rollback or forward-fix remain legible?
- does admin-only work stay on `createAdminClient()` paths?

## Verification

- inspect policies
- inspect indexes
- inspect type sync
- test the touched flow against the new contract
