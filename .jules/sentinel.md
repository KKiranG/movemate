## 2024-05-24 - Unvalidated redirect

**Vulnerability:** Open Redirect vulnerability in the login form, where `searchParams.get("next")` was passed directly to `router.push()`.
**Learning:** React Router / Next.js `router.push()` can take absolute URLs leading to open redirects if unvalidated input is passed.
**Prevention:** Use a `getSafeRedirectUrl` utility function to enforce relative path redirection for internal paths, preventing arbitrary external navigation.
