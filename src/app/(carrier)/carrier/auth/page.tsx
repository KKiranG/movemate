import { CarrierScaffoldPage, ScaffoldCard } from "@/components/spec/carrier-shell-scaffold";

export default function CarrierAuthPage() {
  return (
    <CarrierScaffoldPage
      eyebrow="Carrier auth"
      title="Sign in or create a carrier account"
      description="Auth routes are split so carrier onboarding can continue with clear next actions."
      actions={[
        { href: "/carrier/auth/login", label: "Log in", tone: "primary", operational: true },
        { href: "/carrier/auth/signup", label: "Create account", operational: true },
      ]}
    >
      <ScaffoldCard title="What happens next" description="After signup, carriers land in activation until verification clears." />
    </CarrierScaffoldPage>
  );
}
