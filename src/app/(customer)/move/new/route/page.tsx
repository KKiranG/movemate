import { Input } from "@/components/ui/input";
import { StickyCta, WizardHeader } from "@/components/spec/wizard";

export default function MoveRoutePage() {
  return (
    <main className="pb-28">
      <WizardHeader step={1} backHref="/" />
      <section className="screen screen-wide space-y-5">
        <div className="space-y-3">
          <p className="eyebrow">Route</p>
          <h1 className="heading max-w-[10ch]">Where are we picking up?</h1>
          <p className="body text-[var(--text-secondary)]">
            Start with the route. moverrr works best when we match the need first, not when you browse drivers.
          </p>
        </div>

        <div className="surface-1 space-y-4">
          <div>
            <label className="eyebrow">Pickup</label>
            <Input className="mt-2" placeholder="Pickup suburb or address" aria-label="Pickup address" />
          </div>
          <div>
            <label className="eyebrow">Drop-off</label>
            <Input className="mt-2" placeholder="Drop-off suburb or address" aria-label="Drop-off address" />
          </div>
          <p className="caption">Couldn’t find the address? A suburb name is enough to start.</p>
        </div>
      </section>
      <StickyCta href="/move/new/item" label="Continue to the item" />
    </main>
  );
}
