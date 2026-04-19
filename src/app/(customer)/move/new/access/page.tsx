import { StickyCta, WizardHeader } from "@/components/spec/wizard";

const stairsOptions = ["None", "1–2 flights", "3+ flights"];

function ChoiceGroup({
  title,
  options,
  columns = 3,
}: {
  title: string;
  options: ReadonlyArray<string>;
  columns?: 2 | 3;
}) {
  return (
    <div className="surface-1">
      <p className="title">{title}</p>
      <div className={`mt-3 grid gap-2 ${columns === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
        {options.map((option, index) => (
          <button
            key={option}
            type="button"
            className={`min-h-[48px] rounded-[var(--radius-md)] border px-2 text-[13px] font-medium ${
              index === 0
                ? "border-[var(--text-primary)] bg-[var(--bg-elevated-2)] text-[var(--text-primary)]"
                : "border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function MoveAccessPage() {
  return (
    <main className="pb-28">
      <WizardHeader step={4} backHref="/move/new/timing" />
      <section className="screen screen-wide space-y-4">
        <div className="space-y-3">
          <p className="eyebrow">Access & handling</p>
          <h1 className="heading">A few details that prevent bad matches</h1>
          <p className="body text-[var(--text-secondary)]">
            We use this up front so the wrong carriers never make it into your shortlist.
          </p>
        </div>

        <ChoiceGroup title="Stairs at pickup" options={stairsOptions} />
        <ChoiceGroup title="Stairs at drop-off" options={stairsOptions} />
        <ChoiceGroup title="Lift available?" options={["Yes", "No"]} columns={2} />
        <ChoiceGroup title="Someone can help lift?" options={["Yes", "No"]} columns={2} />
        <ChoiceGroup title="Parking difficulty" options={["Easy", "Unsure", "Difficult"]} />
      </section>
      <StickyCta href="/move/new/results" label="See ranked matches" />
    </main>
  );
}
