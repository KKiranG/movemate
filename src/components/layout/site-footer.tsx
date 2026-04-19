import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex w-full max-w-content flex-col gap-4 px-4 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:px-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-text">moverrr</p>
          <p className="max-w-xl text-sm text-text-secondary">
            Tell moverrr what needs moving and get ranked spare-capacity matches
            with transparent pricing and trust signals.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-text-secondary">
          <Link
            href="/trust"
            className="inline-flex min-h-[44px] items-center rounded-lg px-2 active:bg-black/[0.04] dark:active:bg-white/[0.08]"
          >
            Trust & Safety
          </Link>
          <Link
            href="/privacy"
            className="inline-flex min-h-[44px] items-center rounded-lg px-2 active:bg-black/[0.04] dark:active:bg-white/[0.08]"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="inline-flex min-h-[44px] items-center rounded-lg px-2 active:bg-black/[0.04] dark:active:bg-white/[0.08]"
          >
            Terms of Service
          </Link>
          <a
            href="mailto:hello@moverrr.com.au"
            className="inline-flex min-h-[44px] items-center rounded-lg px-2 active:bg-black/[0.04] dark:active:bg-white/[0.08]"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
