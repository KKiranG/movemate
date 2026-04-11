## 2026-04-11 - [Open Redirect in Auth Login]
**Vulnerability:** Next parameter was blindly passed to router.push() in the login form, creating an Open Redirect vulnerability where an attacker could redirect users to malicious domains after logging in by manipulating the ?next= query string.
**Learning:** Next.js router.push() accepts absolute URLs. Any client-side routing component that consumes dynamic query parameters for its target route needs validation to restrict navigation to safe, relative, in-app paths.
**Prevention:** Created and enforced the usage of a `getSafeRedirectUrl` utility function that asserts URLs begin with exactly one `/` and rejects protocol-relative (`//`) or backslash-escaped (`/\`) inputs.
