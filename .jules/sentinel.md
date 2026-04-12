
## 2025-02-12 - Prevent Open Redirect in Login Redirects
**Vulnerability:** Open Redirect vulnerability through `searchParams.get("next")` without validation in the login form. This could allow attackers to redirect users to malicious websites after successful login.
**Learning:** `useSearchParams` or `searchParams` from Next.js APIs does not guarantee safe redirect paths. It is simple to trick users by sending links like `/login?next=//evil.com`.
**Prevention:** Use a wrapper function `getSafeRedirectUrl` (now in `src/lib/utils.ts`) that verifies the provided URL starts with a single `/` and parses it against `http://localhost` to ensure the host doesn't change unexpectedly. This guarantees relative redirect paths remain securely bound to the current application origin. Always wrap any dynamic redirect input using this utility.
