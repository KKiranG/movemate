import { TopAppBar } from "@/components/spec/chrome";

export default function AccountProfilePage() {
  return (
    <main>
      <TopAppBar title="Profile" backHref="/account" />
      <section className="screen space-y-3">
        <input className="ios-input" defaultValue="Ava" aria-label="First name" />
        <input className="ios-input" defaultValue="Parker" aria-label="Last name" />
        <button
          type="button"
          className="flex min-h-[52px] min-w-[44px] w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] text-[15px] font-medium text-[var(--text-on-accent)] hover:bg-[var(--accent-hover)] active:bg-[var(--accent-pressed)]"
        >
          Save profile
        </button>
      </section>
    </main>
  );
}
