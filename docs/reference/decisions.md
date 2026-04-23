# Decisions

## 2026-04-18

- Host-routing matrix was implemented explicitly for `moverrr.com` (customer surface) and `carrier.moverrr.com` (carrier surface) in middleware routing logic.
- Local development host fallback was intentionally kept non-invasive: `localhost`, `127.0.0.1`, `::1`, and `*.localhost` bypass host-based rewrites/redirects to preserve existing local behavior.
- Protected-route unauthenticated redirects were standardized to `/auth/login` with `next` preserving the original external pathname.
- Role-stickiness fallback was kept deterministic without DB `last_active_role`: host determines shell context (`carrier` host -> carrier routes; customer host -> customer routes), avoiding inferred role switching.
- Unknown or out-of-scope carrier-host paths use a safe redirect-to-root fallback (`/`) to avoid leaking customer shell on carrier host.
- Spec-driven UI scaffold placeholders were allowed to remain where backend wiring is not yet present, to avoid speculative data coupling.

## Completion Checklist

- [x] Host/path rewrite and redirect matrix documented and implemented.
- [x] Local-dev host bypass behavior documented and implemented.
- [x] Auth redirect target (`/auth/login`) documented and implemented.
- [x] Deterministic role fallback documented (no `last_active_role` dependency).
- [x] Placeholder/scaffold stance documented pending backend integration.
