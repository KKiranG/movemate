import { TopAppBar } from "@/components/spec/chrome";

export default function AccountHelpPage() {
  return (
    <main>
      <TopAppBar title="Help & policies" backHref="/account" />
      <section className="screen space-y-3">
        <div className="surface-1">
          <p className="caption">Cancellation & misdescription policy</p>
        </div>
        <div className="surface-1">
          <p className="caption">Payment protection policy</p>
        </div>
        <div className="surface-1">
          <p className="caption">Driver verification policy</p>
        </div>
      </section>
    </main>
  );
}
