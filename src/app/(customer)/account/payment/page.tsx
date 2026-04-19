import { TopAppBar } from "@/components/spec/chrome";

export default function AccountPaymentPage() {
  return (
    <main>
      <TopAppBar title="Payment methods" backHref="/account" />
      <section className="screen space-y-3">
        <div className="surface-1">
          <p className="caption">Visa •••• 4242</p>
        </div>
        <button
          type="button"
          className="flex min-h-[52px] min-w-[44px] w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--bg-elevated-2)] text-[15px] text-[var(--text-primary)] hover:bg-[var(--bg-elevated-3)] active:bg-[var(--bg-elevated-3)]"
        >
          Add payment method
        </button>
      </section>
    </main>
  );
}
