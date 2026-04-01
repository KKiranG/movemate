# Auth

## Auth model

Supabase Auth with email and password.

The product shape is simple:
- public browsing is allowed
- booking requires auth
- posting capacity requires auth
- admin actions require trusted internal access

## User shapes

- customer
- carrier
- admin

Carrier and customer are distinct operational roles even if they begin from the same auth system.

## Trust requirements

- verified email for real usage
- verified carrier documents before marketplace trust expands
- no anonymous booking
- no silent privilege escalation around admin behavior

## When editing auth-sensitive work

Check:
- who is allowed to do the action
- whether the route or page enforces that clearly
- whether the user gets a recoverable next step when blocked
