# moverrr — 55 Tasks for Codex

> **Context for Codex:** moverrr is a Next.js 14 app (App Router, TypeScript, Tailwind, Supabase, Stripe). It is an iOS-first browse-first spare-capacity marketplace. Carriers post trips with spare space; customers book into them. 15% commission on base price + $5 flat fee. This folder is the full project root. Run `npm run check` after every task to verify lint + typecheck passes.

**Key rule:** Do NOT change commission math in `src/lib/pricing/breakdown.ts`. Do NOT add AI/matching/bidding features. Every interactive element in carrier flow needs `min-h-[44px]`.

---

## SECTION A — Backend / API Bug Fixes (12 tasks)

### Task A1 — Past-date validation on trip creation
**File:** `src/lib/validation/trip.ts`

**Change:** Replace the `tripDate` field:
```ts
// Before:
tripDate: z.string().min(1),

// After:
tripDate: z.string().min(1).refine(
  (date) => {
    const today = new Date().toISOString().split('T')[0];
    return date >= today;
  },
  { message: 'Trip date cannot be in the past' }
),
```
Apply the same fix to `tripDate` in `tripUpdateSchema` below it.

**Outcome:** POSTing a trip with yesterday's date returns a 400 validation error.

---

### Task A2 — MIME type validation on file upload
**File:** `src/app/api/upload/route.ts`

**Change:** After `if (!(file instanceof File))` check, add immediately after:
```ts
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'application/pdf',
];

if (!ALLOWED_MIME_TYPES.includes(file.type)) {
  throw new AppError(
    `File type '${file.type}' is not allowed.`,
    400,
    'invalid_file_type',
  );
}
```

**Outcome:** Uploading a .exe or .zip returns 400. HEIC/HEIF (iOS camera default) are accepted.

---

### Task A3 — Max file size check on upload (before parsing formData)
**File:** `src/app/api/upload/route.ts`

**Change:** At the top of the POST handler body, before `const formData = await request.formData()`, add:
```ts
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB
const contentLength = request.headers.get('content-length');
if (contentLength && parseInt(contentLength, 10) > MAX_UPLOAD_BYTES) {
  return NextResponse.json(
    { error: 'File too large. Maximum upload size is 10MB.' },
    { status: 413 },
  );
}
```

**Outcome:** Requests with Content-Length > 10MB rejected immediately with 413, before parsing.

---

### Task A4 — Webhook: verify booking row was actually updated
**File:** `src/app/api/payments/webhook/route.ts`

**Change:** Replace each `await supabase.from("bookings").update(...)` block with a version that checks rows updated. Example for the `payment_failed` branch:
```ts
const { data: failedRows, error: failedError } = await supabase
  .from("bookings")
  .update({ payment_status: "failed" })
  .eq("id", bookingId)
  .select("id");

if (failedError || !failedRows || failedRows.length === 0) {
  console.error(`[webhook] booking not found for id=${bookingId} event=${event.type}`);
  // Return 200 to Stripe anyway — retrying won't help a missing booking
}
```
Apply same pattern to the `authorized` branch.

**Outcome:** Missing bookingId in webhook no longer silently succeeds. Error is logged.

---

### Task A5 — Email failure logging in notifications
**File:** `src/lib/notifications.ts`

**Change:** Import `captureAppError` from `@/lib/sentry` and wrap the send:
```ts
import { Resend } from "resend";
import { hasResendEnv } from "@/lib/env";
import { captureAppError } from "@/lib/sentry";

export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  const resend = getResendClient();
  if (!resend) return { skipped: true };

  const result = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL as string,
    to: [params.to],
    subject: params.subject,
    html: params.html,
  });

  if (result.error) {
    captureAppError(result.error, {
      context: 'sendTransactionalEmail',
      to: params.to,
      subject: params.subject,
    });
  }

  return result;
}
```

**Outcome:** Email send failures are captured to Sentry instead of being silently discarded.

---

### Task A6 — Add assertRequiredEnv for production startup validation
**File:** `src/lib/env.ts` and `next.config.js`

**Change 1** — Add to `src/lib/env.ts`:
```ts
export function assertRequiredEnv() {
  if (process.env.NODE_ENV !== 'production') return;

  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
  ];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }
}
```

**Change 2** — Add to `next.config.js` at the top:
```js
const { assertRequiredEnv } = require('./src/lib/env');
assertRequiredEnv();
```

**Outcome:** Deploying to production without required env vars fails at build/startup with a clear error message.

---

### Task A7 — sanitizeText utility + apply to freetext fields
**File:** `src/lib/utils.ts` (add function), `src/lib/validation/booking.ts` (apply)

**Change 1** — Add to `src/lib/utils.ts`:
```ts
export function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')      // strip HTML tags
    .replace(/\s+/g, ' ')         // normalize whitespace
    .trim();
}
```

**Change 2** — In `src/lib/validation/booking.ts`, after parsing with `bookingSchema.parse(body)`, apply:
```ts
parsed.itemDescription = sanitizeText(parsed.itemDescription);
if (parsed.specialNotes) parsed.specialNotes = sanitizeText(parsed.specialNotes);
```

**Change 3** — In `src/app/api/trips/route.ts`, after `tripSchema.parse(body)`:
```ts
if (parsed.specialNotes) parsed.specialNotes = sanitizeText(parsed.specialNotes);
```

**Outcome:** HTML injection via item descriptions or notes is stripped before DB write.

---

### Task A8 — Fix Origin header validation (CSRF) on booking and payment routes
**File:** `src/middleware.ts`

**Change:** Add Origin check for mutating API routes. In the middleware, before letting the request through to `/api/bookings` POST and `/api/payments` POST routes:
```ts
if (
  request.method === 'POST' &&
  (pathname.startsWith('/api/bookings') || pathname.startsWith('/api/payments'))
) {
  const origin = request.headers.get('origin');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const allowedOrigins = [siteUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'];

  if (origin && !allowedOrigins.some((o) => origin.startsWith(o))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
```

**Outcome:** Cross-origin POST requests to booking and payment endpoints are rejected.

---

### Task A9 — Add 404 not-found page for deleted/missing trips
**File:** Create `src/app/(customer)/trip/[id]/not-found.tsx`

**Content:**
```tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function TripNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">
        Trip not available
      </h1>
      <p className="text-gray-500 mb-6 max-w-sm">
        This trip may have been cancelled or is no longer accepting bookings.
      </p>
      <Button asChild>
        <Link href="/search">Browse available trips</Link>
      </Button>
    </div>
  );
}
```

Also in `src/app/(customer)/trip/[id]/page.tsx`, after fetching the trip, if `!trip` call `notFound()` from `'next/navigation'`.

**Outcome:** Visiting a deleted trip URL shows a helpful 404 page instead of a blank/crashed page.

---

### Task A10 — Add 404 not-found page for missing bookings
**File:** Create `src/app/(customer)/bookings/[id]/not-found.tsx`

**Content:** Same pattern as A9 but message: "Booking not found" with link to `/bookings`.

Also in `src/app/(customer)/bookings/[id]/page.tsx`, call `notFound()` if booking is null.

**Outcome:** Visiting a booking URL you don't own or that doesn't exist shows a proper 404 page.

---

### Task A11 — Validate tripUpdateSchema also blocks past dates
**File:** `src/lib/validation/trip.ts`

**Change:** Apply the same `.refine()` past-date check from Task A1 to `tripUpdateSchema.tripDate`.

**Outcome:** Carriers cannot edit a trip to have a past date.

---

### Task A12 — Return 409 conflict when booking fails due to capacity
**File:** `src/app/api/bookings/route.ts`

**Change:** In the error handling block around `createBookingForCustomer`, specifically catch `AppError` with code `'listing_not_bookable'` and return status 409:
```ts
if (error instanceof AppError && error.code === 'listing_not_bookable') {
  return NextResponse.json({ error: error.message, code: error.code }, { status: 409 });
}
```

**Outcome:** Frontend can distinguish "listing full" (409) from generic errors (500) and show appropriate message.

---

## SECTION B — Frontend / UI Fixes (18 tasks)

### Task B1 — Landing page: value prop above fold on mobile (375px)
**File:** `src/app/page.tsx`

**Change:** In the hero section, ensure the main headline and a one-line value prop (e.g. "Save on Sydney moves — book spare space on existing carrier routes.") appear BEFORE the search form in DOM order. The search form should be below the hero text. At 375px width, the headline must be fully visible without scrolling.

**Outcome:** iPhone SE users see the value proposition before the search form.

---

### Task B2 — Search empty state: actionable "Get notified" CTA
**File:** The search results/empty-state component — find by searching for "No trips" or "no results" text in `src/app/(customer)/search/page.tsx` or `src/components/search/`

**Change:** Replace any plain "No trips found" or empty-state text with:
```tsx
<div className="text-center py-12 px-4">
  <h3 className="text-lg font-semibold text-gray-900 mb-2">
    No trips available for this route yet
  </h3>
  <p className="text-gray-500 text-sm mb-6">
    Carriers are adding new trips daily. Save this search and we'll notify you by email when a match appears.
  </p>
  <button
    className="bg-blue-600 text-white px-6 py-3 rounded-lg min-h-[44px] active:bg-blue-700 font-medium"
    onClick={() => {/* placeholder — logs analytics, shows coming-soon toast */
      alert('Coming soon — we'll notify you when this feature is ready!');
    }}
  >
    Notify me when trips appear
  </button>
</div>
```

**Outcome:** Empty search result is actionable. Demand signal is not silently lost.

---

### Task B3 — Carrier dashboard: color-coded booking status badges
**File:** `src/app/(carrier)/carrier/dashboard/page.tsx`

**Change:** In the bookings list section, wrap booking status in a `<Badge>` (from `@/components/ui/badge`) with appropriate variant:
- `pending` → yellow/warning: `className="bg-yellow-100 text-yellow-800"`
- `confirmed` → green: `className="bg-green-100 text-green-800"`
- `disputed` → red: `className="bg-red-100 text-red-800"`
- `cancelled` → gray: `className="bg-gray-100 text-gray-600"`
- `completed` → blue: `className="bg-blue-100 text-blue-800"`

**Outcome:** Carrier sees booking urgency at a glance on their dashboard.

---

### Task B4 — Booking form: specific payment error messages + retry
**File:** `src/components/booking/booking-form.tsx`

**Change:** In the Stripe payment error handler, map Stripe error codes to user-friendly messages:
```ts
function getPaymentErrorMessage(code?: string): string {
  const messages: Record<string, string> = {
    card_declined: 'Your card was declined. Please try a different card.',
    insufficient_funds: 'Insufficient funds. Please try a different card.',
    expired_card: 'Your card has expired. Please try a different card.',
    incorrect_cvc: 'Incorrect CVC. Please check your card details.',
    processing_error: 'Payment processing error. Please try again.',
  };
  return messages[code ?? ''] ?? 'Payment failed. Please try again or use a different card.';
}
```
Show this message below the payment form. Add a "Try again" button that calls `stripe.elements` reset to clear the card field.

**Outcome:** Payment failures show actionable messages instead of generic "An error occurred".

---

### Task B5 — Carrier document upload: progress indicator + success state
**File:** `src/app/(carrier)/carrier/onboarding/page.tsx` (or the relevant upload component)

**Change:** For each document upload (license, insurance):
1. Replace instant file input with a wrapper that tracks upload state: `idle | uploading | success | error`
2. During `uploading`: show a progress bar div with `width: ${progress}%` using `XMLHttpRequest` or Fetch with progress monitoring
3. On `success`: show a green checkmark icon (Lucide `CheckCircle2`) and "Uploaded ✓" text
4. On `error`: show red text with "Upload failed — try again" and re-enable the input

**Outcome:** Carrier knows their documents are uploading and can confirm they uploaded successfully.

---

### Task B6 — Admin carrier verification: loading state on action buttons
**File:** `src/app/(admin)/admin/verification/page.tsx`

**Change:** Find the Approve / Reject / Request More Info buttons. Add a `loadingId` state (string | null). On click, set `loadingId = carrierId`. Disable all three buttons and show a spinner (Lucide `Loader2` with `animate-spin`) on the active button. After the action resolves, reset `loadingId = null`.

**Outcome:** Admin can't double-click approve/reject. Visual feedback during async operation.

---

### Task B7 — Customer booking: vertical status stepper
**File:** Create `src/components/booking/booking-status-stepper.tsx`, use in `src/app/(customer)/bookings/[id]/page.tsx`

**Change:** Create a vertical stepper component showing: Pending → Confirmed → Picked Up → In Transit → Delivered → Completed. Current step: blue circle with step number. Completed steps: green with checkmark. Future steps: gray. Line connector between steps.

```tsx
const STEPS: { status: BookingStatus; label: string }[] = [
  { status: 'pending', label: 'Awaiting Confirmation' },
  { status: 'confirmed', label: 'Confirmed' },
  { status: 'picked_up', label: 'Picked Up' },
  { status: 'in_transit', label: 'In Transit' },
  { status: 'delivered', label: 'Delivered' },
  { status: 'completed', label: 'Completed' },
];
```

Show disputed status as a red warning above the stepper (not a step).

**Outcome:** Customer sees clear visual progress instead of a text status string.

---

### Task B8 — Search autocomplete: keyboard navigation
**File:** Find the suburb autocomplete component in `src/components/search/` or `src/app/(customer)/search/`

**Change:** Add keyboard handling to the suggestion dropdown:
- `ArrowDown`: move selection down (or wrap to first)
- `ArrowUp`: move selection up (or wrap to last)
- `Enter`: select highlighted suggestion
- `Escape`: close dropdown
- Add `aria-activedescendant`, `role="listbox"` on the list, `role="option"` on each item

**Outcome:** Users navigating with keyboard can select suburbs without a mouse.

---

### Task B9 — Proof upload: camera as primary on mobile
**File:** Find proof/photo upload component — likely in `src/components/booking/status-update-actions.tsx` or carrier trip detail

**Change:** On viewport < 768px, show TWO buttons:
```tsx
{/* Primary — opens camera directly on iOS */}
<label className="... min-h-[44px] active:opacity-80 cursor-pointer">
  <Camera className="w-4 h-4 mr-2" /> Take Photo
  <input
    type="file"
    accept="image/*,image/heic,image/heif"
    capture="environment"
    className="sr-only"
    onChange={handleFile}
  />
</label>

{/* Secondary — opens file picker */}
<label className="... min-h-[44px] active:opacity-80 cursor-pointer">
  <Upload className="w-4 h-4 mr-2" /> Upload from Library
  <input
    type="file"
    accept="image/*,image/heic,image/heif"
    className="sr-only"
    onChange={handleFile}
  />
</label>
```
On desktop (≥768px), show only the file picker.

**Outcome:** Carriers on iPhone get the rear camera as the default proof upload action.

---

### Task B10 — Add aria-labels to all icon-only buttons
**Files:** `src/components/layout/site-header.tsx`, `src/components/carrier/carrier-trip-wizard.tsx`, `src/app/(admin)/admin/verification/page.tsx`, and any other file with icon-only buttons

**Change:** Search for `<button` or `<Button` containing only a Lucide icon component with no visible text. Add `aria-label="[descriptive action]"` to each. Examples:
- Close button: `aria-label="Close"`
- Edit button: `aria-label="Edit trip"`
- Delete button: `aria-label="Delete"`

**Outcome:** Screen readers announce button purposes for all icon-only interactive elements.

---

### Task B11 — Character counter for item description in booking form
**File:** `src/components/booking/booking-form.tsx`

**Change:** Below the item description textarea, add:
```tsx
<p className="text-xs text-gray-400 text-right mt-1">
  {itemDescription.length}/200 characters
</p>
```
Where `itemDescription` is the controlled state value for that field.

**Outcome:** Users know how many characters they have left when describing their item.

---

### Task B12 — Character counter for special notes in carrier trip wizard
**File:** `src/components/carrier/carrier-trip-wizard.tsx`

**Change:** Same pattern as B11 — below the specialNotes textarea, show `{specialNotes.length}/280 characters`.

**Outcome:** Carrier knows character limit when adding trip notes.

---

### Task B13 — Carrier rating display on search result cards
**File:** Find the search result / trip listing card component in `src/components/search/` or `src/components/trip/`

**Change:** After the carrier name, add:
```tsx
{listing.carrier.rating_count > 0 ? (
  <span className="text-sm text-gray-500">
    ★ {listing.carrier.average_rating.toFixed(1)} ({listing.carrier.rating_count})
  </span>
) : (
  <span className="text-sm text-gray-400">New carrier</span>
)}
```

**Outcome:** Customers can factor in carrier reputation when browsing.

---

### Task B14 — Verified badge on carrier cards in search results
**File:** Same trip card component as B13

**Change:** If `listing.carrier.verification_status === 'verified'`, show a green "Verified" badge next to the carrier name using the existing `<Badge>` component.

**Outcome:** Trust signal visible at the browse stage without opening the trip detail.

---

### Task B15 — React error boundary for search results section
**File:** Create `src/components/shared/error-boundary.tsx` (class component), then use in `src/app/(customer)/search/page.tsx`

**Change:** Standard React class error boundary:
```tsx
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
```
Wrap the search results section with fallback: "Something went wrong loading results. Please refresh."

**Outcome:** Search page doesn't fully crash if a result card throws a render error.

---

### Task B16 — React error boundary for carrier dashboard
**File:** Use the same `ErrorBoundary` from B15 in `src/app/(carrier)/carrier/dashboard/page.tsx`

**Change:** Wrap the trips/bookings list sections with the ErrorBoundary and a fallback: "Dashboard is unavailable. Please refresh or contact support."

**Outcome:** Carrier dashboard doesn't fully crash on component errors.

---

### Task B17 — Add "Re-post similar trip" button on completed/expired carrier trip
**File:** `src/app/(carrier)/carrier/trips/[id]/page.tsx`

**Change:** When trip status is `expired` or `cancelled`, show:
```tsx
<Button asChild variant="outline">
  <Link href={`/carrier/post?from=${trip.originSuburb}&to=${trip.destinationSuburb}&space=${trip.spaceSize}&price=${trip.priceCents}`}>
    Re-post this route
  </Link>
</Button>
```
In `src/app/(carrier)/carrier/post/page.tsx`, read these query params on mount and use them to pre-fill the wizard's initial state.

**Outcome:** Carrier can re-post the same route in under 10 seconds.

---

### Task B18 — Add "Go to dashboard" link after successful trip posting
**File:** `src/app/(carrier)/carrier/post/page.tsx`

**Change:** After the wizard successfully submits and shows the success state, add:
```tsx
<div className="text-center py-8">
  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
  <h2 className="text-xl font-semibold mb-2">Trip posted!</h2>
  <p className="text-gray-500 mb-6">Your trip is now visible to customers.</p>
  <Button asChild>
    <Link href="/carrier/dashboard">Go to Dashboard</Link>
  </Button>
</div>
```

**Outcome:** Carrier knows the action completed and has a clear next step.

---

## SECTION C — iOS-First Compliance (8 tasks)

### Task C1 — Replace checkboxes with custom toggles in carrier trip wizard
**File:** `src/components/carrier/carrier-trip-wizard.tsx`

**Change:** Find all `<input type="checkbox">` elements. Replace with this toggle pattern:
```tsx
<button
  type="button"
  role="switch"
  aria-checked={value}
  onClick={() => setValue(!value)}
  className={cn(
    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
    "active:opacity-90",
    // Extend tap target to 44px using padding
    "min-h-[44px] min-w-[44px] justify-center",
    value ? "bg-blue-600" : "bg-gray-200"
  )}
>
  <span className={cn(
    "absolute h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
    value ? "translate-x-2" : "-translate-x-2"
  )} />
</button>
```
Apply to: `helperAvailable`, `stairsOk`, and any other boolean toggles.

**Outcome:** iOS-compliant 44px touch targets for all wizard toggles.

---

### Task C2 — Add capture="environment" to proof upload inputs
**File:** All `<input type="file">` used for proof photos — search in `src/components/booking/` and `src/app/(carrier)/carrier/`

**Change:** For proof upload inputs (pickup photo, delivery photo):
```tsx
<input
  type="file"
  accept="image/*,image/heic,image/heif"
  capture="environment"
  className="sr-only"
  onChange={handleFile}
/>
```
Do NOT add `capture` to document uploads (license, insurance) — file picker is correct there.

**Outcome:** iOS rear camera opens directly for proof photos. HEIC format supported.

---

### Task C3 — Add safe-area CSS and overscroll to globals.css
**File:** `src/app/globals.css`

**Change:** Add to the `:root` block:
```css
--safe-area-top: env(safe-area-inset-top, 0px);
--safe-area-bottom: env(safe-area-inset-bottom, 0px);
```

Add a new class at the bottom of the file:
```css
.safe-pb {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
```

Find the main content wrapper class (likely `.page-shell` or the `<main>` element's class in layout). Add:
```css
overscroll-behavior: contain;
-webkit-overflow-scrolling: touch;
```

**Outcome:** Scroll momentum and safe area work correctly on iPhone.

---

### Task C4 — Audit and fix hover-only states in search components
**File:** All files in `src/components/search/`

**Change:** Run `grep -n "hover:" src/components/search/*.tsx` and find every `hover:` class. For each, add the corresponding `active:` equivalent on the same element. Examples:
- `hover:bg-gray-100` → also add `active:bg-gray-200`
- `hover:shadow-md` → also add `active:shadow-sm`
- `hover:opacity-80` → also add `active:opacity-70`

**Outcome:** Search result cards have touch feedback on iOS (where hover doesn't exist).

---

### Task C5 — Audit and fix hover-only states in trip and booking components
**File:** All files in `src/components/trip/` and `src/components/booking/`

**Change:** Same process as C4 — grep for hover: classes without matching active: siblings and add them.

**Outcome:** Trip detail and booking flow interactive elements respond to touch on iOS.

---

### Task C6 — Ensure all carrier flow buttons are min-h-[44px]
**File:** `src/components/carrier/carrier-trip-wizard.tsx`, `src/app/(carrier)/carrier/dashboard/page.tsx`, `src/app/(carrier)/carrier/trips/[id]/page.tsx`

**Change:** Find every `<button>`, `<Button>`, and `<Link>` styled as a button in carrier-facing pages. Ensure each has `min-h-[44px]` in its className. If it already has `h-10` (40px), change to `h-11` (44px) or add `min-h-[44px]`.

**Outcome:** Every carrier-facing tap target meets Apple's 44pt minimum.

---

### Task C7 — Add active: states to all header/nav interactive elements
**File:** `src/components/layout/site-header.tsx`

**Change:** Every `<Link>` and `<button>` in the header needs `active:opacity-70` or `active:bg-gray-100` depending on its visual style.

**Outcome:** Navigation links respond visually to touch on iOS.

---

### Task C8 — Add focus-visible styles globally for keyboard nav
**File:** `src/app/globals.css`

**Change:** Add at the bottom:
```css
/* Keyboard focus — visible only for keyboard navigation, not mouse clicks */
:focus-visible {
  outline: 2px solid #0066FF;
  outline-offset: 2px;
  border-radius: 4px;
}

/* Remove default outline (we're providing our own) */
:focus:not(:focus-visible) {
  outline: none;
}
```

**Outcome:** Keyboard users can see focus states. Mouse users don't see distracting outlines.

---

## SECTION D — Code Quality & Tests (10 tasks)

### Task D1 — Add Vitest to the project
**Files:** `package.json`, `vitest.config.ts` (new), `src/lib/__tests__/.gitkeep` (new directory)

**Change:**
1. Install: `npm install -D vitest @vitest/coverage-v8`
2. Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```
3. Add to `package.json` scripts: `"test": "vitest"`, `"test:coverage": "vitest run --coverage"`
4. Create empty `src/lib/__tests__/` directory with a `.gitkeep`

**Outcome:** `npm run test` works. Test infrastructure ready.

---

### Task D2 — Unit tests for pricing breakdown
**File:** Create `src/lib/__tests__/breakdown.test.ts`

**Tests to write:**
1. Zero extras: `basePriceCents=10000`, both false → total=10500, commission=1500, payout=8500
2. With stairs: if needsStairs=true, stairsExtraCents=2000 → stairs added
3. With helper: if needsHelper=true, helperExtraCents=3000 → helper added
4. Identity test: `totalPriceCents === carrierPayoutCents + platformCommissionCents + bookingFeeCents` for ALL combinations
5. Commission applies ONLY to base, not stairs or helper

**Outcome:** Pricing regression protection. Any change to breakdown.ts breaks this test.

---

### Task D3 — Unit tests for status machine
**File:** Create `src/lib/__tests__/status-machine.test.ts`

**Tests to write:**
1. Valid transitions: all transitions in the allowedTransitions map return true
2. Invalid transitions: `canTransitionBooking('completed', 'pending')` → false, `canTransitionBooking('cancelled', 'confirmed')` → false, `canTransitionBooking('pending', 'delivered')` → false
3. Disputed can go to completed or cancelled (valid), but NOT to pending or confirmed

**Outcome:** State machine changes are caught by tests before reaching production.

---

### Task D4 — Unit tests for matching score
**File:** Create `src/lib/__tests__/score.test.ts`

**Tests to write:**
Read `src/lib/matching/score.ts` first to understand the scoring function. Then write:
1. Returns null (disqualified) when pickup is outside detour radius
2. Returns null when dropoff is outside detour radius
3. Returns null when item category not in listing's accepts array
4. Returns a score between 0-100 when all conditions pass
5. Higher rating → higher score (carrier with 5.0 beats 3.0, all else equal)

**Outcome:** Matching algorithm is regression-tested.

---

### Task D5 — Add booking expiry display on pending bookings
**File:** `src/app/(customer)/bookings/[id]/page.tsx`

**Change:** If `booking.status === 'pending'`, calculate expiry as `booking.created_at + 2 hours`. Show:
```tsx
<p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
  ⏱ Awaiting carrier confirmation.{' '}
  {hoursRemaining > 0
    ? `Expires in ${hoursRemaining}h ${minutesRemaining}m if not confirmed.`
    : 'Expiring soon.'}
</p>
```

**Outcome:** Customer understands their booking will auto-cancel if carrier doesn't respond.

---

### Task D6 — Add tooltips to carrier wizard space size selector
**File:** `src/components/carrier/carrier-trip-wizard.tsx`

**Change:** Below each space size option (S/M/L/XL), add a small descriptor:
- S → `"1-2 boxes, small items"`
- M → `"Single piece of furniture"`
- L → `"Several furniture pieces"`
- XL → `"Small apartment's worth"`

Show as `<span className="text-xs text-gray-400 block mt-0.5">`

**Outcome:** Carrier picks the correct size on first try, reducing mismatch disputes.

---

### Task D7 — Add meta tags to trip detail page
**File:** `src/app/(customer)/trip/[id]/page.tsx`

**Change:** Export a `generateMetadata` function:
```ts
export async function generateMetadata({ params }: { params: { id: string } }) {
  const trip = await getTrip(params.id);
  if (!trip) return {};

  return {
    title: `Move from ${trip.originSuburb} to ${trip.destinationSuburb} — moverrr`,
    description: `${trip.carrier.businessName} · ${trip.spaceSize} space · $${(trip.priceCents / 100).toFixed(0)} · ${trip.tripDate}`,
    openGraph: {
      title: `Spare space: ${trip.originSuburb} → ${trip.destinationSuburb}`,
      description: `Book into an existing carrier route and save vs. a dedicated truck.`,
      type: 'website',
    },
  };
}
```

**Outcome:** Sharing trip URLs on iMessage/WhatsApp shows rich previews.

---

### Task D8 — Admin dispute list: loading state during resolution
**File:** `src/app/(admin)/admin/disputes/page.tsx`

**Change:** Add `resolvingId` state (string | null). When admin clicks "Resolve", set `resolvingId = disputeId`. Disable the button and show `<Loader2 className="animate-spin" />`. After action completes, reset `resolvingId = null`.

**Outcome:** Admin can't double-submit dispute resolutions.

---

### Task D9 — Add item size warning in booking form
**File:** `src/components/booking/booking-form.tsx`

**Change:** If the user fills in `itemVolumeM3` and it's ≥ 80% of the listing's `availableVolumeM3`, show:
```tsx
<p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mt-2">
  This item may fill most of the available space. Confirm suitability with the carrier before booking.
</p>
```

**Outcome:** Reduces disputes caused by items that don't fit the actual available space.

---

### Task D10 — Add admin notes field to carrier verification
**File:** `src/app/(admin)/admin/verification/page.tsx`

**Change:** Add a textarea below each carrier's document list for internal admin notes. On blur, save to localStorage keyed by `carrier-notes-${carrierId}` (simple local persistence for MVP — no DB needed yet). Show previously saved notes on load.

**Outcome:** Admin team can leave notes during verification without losing them between sessions.

---

## SECTION E — Enhancements (7 tasks)

### Task E1 — Skeleton loading for search results
**File:** Create `src/components/search/search-skeleton.tsx`, use in `src/app/(customer)/search/page.tsx`

**Change:** Create a skeleton card matching the trip card structure: gray rounded blocks at the same heights as real content. Show 3 skeleton cards while `isLoading` is true. Use Tailwind's `animate-pulse`.

**Outcome:** Search results load with skeleton UI instead of a blank screen or spinner.

---

### Task E2 — Skeleton loading for carrier dashboard
**File:** `src/app/(carrier)/carrier/dashboard/page.tsx`

**Change:** Same pattern as E1 — show trip/booking skeleton cards while the dashboard data loads. Create inline or reuse the skeleton component.

**Outcome:** Carrier dashboard shows skeletons during load, not an empty or jumping layout.

---

### Task E3 — Add print/PDF functionality to booking confirmation
**File:** `src/app/(customer)/bookings/[id]/page.tsx` and `src/app/globals.css`

**Change 1:** Add a "Print / Save as PDF" button:
```tsx
<button
  onClick={() => window.print()}
  className="text-sm text-gray-500 underline min-h-[44px] active:opacity-70"
>
  Print / Save as PDF
</button>
```

**Change 2:** Add to `globals.css`:
```css
@media print {
  nav, header, .no-print { display: none !important; }
  body { font-size: 12pt; }
  .booking-detail { page-break-inside: avoid; }
}
```

**Outcome:** Customers and carriers can save booking confirmations as PDFs.

---

### Task E4 — Show price range on trip detail page
**File:** `src/app/(customer)/trip/[id]/page.tsx` or trip detail component

**Change:** Below the carrier price, add:
```tsx
<p className="text-sm text-gray-500">
  Typical dedicated truck for this type of move: $150–$300.{' '}
  <span className="text-green-700 font-medium">You save with spare space.</span>
</p>
```
These are static estimates — no API needed. Add the range constants to `src/lib/constants.ts`.

**Outcome:** Customer understands the savings vs. hiring a full truck. Value prop is visible at decision point.

---

### Task E5 — Carrier onboarding: show completion progress
**File:** `src/app/(carrier)/carrier/onboarding/page.tsx`

**Change:** Add a progress indicator at the top showing which sections are complete:
```tsx
const sections = [
  { label: 'Business Details', complete: !!formData.businessName && !!formData.abn },
  { label: 'Documents', complete: !!licenseUrl && !!insuranceUrl },
  { label: 'Vehicle', complete: !!vehicleType },
];
// Show: "2 of 3 sections complete"
```

**Outcome:** Carrier knows exactly what's missing before submitting for verification.

---

### Task E6 — Add "Save this trip" analytics placeholder on trip detail
**File:** `src/app/(customer)/trip/[id]/page.tsx`

**Change:** Add a bookmark button next to the share/other actions:
```tsx
<button
  aria-label="Save this trip"
  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 active:text-blue-600"
  onClick={() => {
    trackAnalyticsEvent('trip_saved', { tripId: trip.id });
    // Visual feedback: toggle filled/outline bookmark icon
    setSaved(!saved);
  }}
>
  {saved ? <BookmarkCheck className="w-5 h-5 text-blue-600" /> : <Bookmark className="w-5 h-5" />}
</button>
```

**Outcome:** Demand signal captured via analytics. UI foundation for future wishlist feature.

---

### Task E7 — Admin carriers list: verification status badges
**File:** `src/app/(admin)/admin/carriers/page.tsx`

**Change:** In the carrier table/list, replace the plain verification_status text with colored badges:
- `pending` → gray badge
- `submitted` → yellow badge ("Awaiting Review")
- `verified` → green badge
- `rejected` → red badge

**Outcome:** Admin can triage the verification queue at a glance.

---

## How to run after completing tasks

```bash
npm run check    # Must pass with zero errors
npm run test     # Must pass (after D1 is done)
```

Each task is independently executable. Do not batch multiple unrelated changes in one commit. Commit after each completed task with a clear message.
