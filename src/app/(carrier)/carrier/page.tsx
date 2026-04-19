import Link from "next/link";

import { requirePageSessionUser } from "@/lib/auth";
import { getCarrierActivationBlockers, isCarrierActivationLive } from "@/lib/carrier-activation";
import { getCarrierTodaySnapshot } from "@/lib/data/bookings";
import { listCarrierRequestCards } from "@/lib/data/booking-requests";
import { getCarrierByUserId } from "@/lib/data/carriers";
import { listCarrierTrips } from "@/lib/data/trips";
import { formatCurrency } from "@/lib/utils";
import { Wordmark } from "@/components/ui/wordmark";

function HomeCard({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href?: string;
  cta?: string;
}) {
  const content = (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] p-4 shadow-[var(--shadow-card)]">
      <p className="title">{title}</p>
      <p className="mt-2 text-[14px] leading-6 text-[var(--text-secondary)]">{description}</p>
      {cta ? <p className="mt-4 text-[13px] font-semibold text-[var(--text-primary)]">{cta}</p> : null}
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="block hover:opacity-95 active:opacity-90">
      {content}
    </Link>
  );
}

export default async function CarrierHomePage() {
  const user = await requirePageSessionUser();
  const [carrier, requests, trips, snapshot] = await Promise.all([
    getCarrierByUserId(user.id),
    listCarrierRequestCards(user.id),
    listCarrierTrips(user.id, { activeOnly: true }),
    getCarrierTodaySnapshot(user.id),
  ]);

  const activationLive = carrier ? isCarrierActivationLive(carrier.activationStatus) : false;
  const todayIso = new Date().toISOString().slice(0, 10);
  const liveTrips = trips.filter((trip) => ["active", "booked_partial"].includes(trip.status ?? "active"));
  const todayTrips = liveTrips.filter((trip) => trip.tripDate === todayIso);
  const activationBlockers = getCarrierActivationBlockers(carrier);

  const mode = !activationLive
    ? "activation"
    : requests.length > 0 || todayTrips.length > 0 || snapshot.payoutHolds.length > 0
      ? "active"
      : "ready";

  const hero =
    mode === "activation"
      ? {
          eyebrow: carrier ? "Activation" : "For drivers",
          title: carrier ? "You're one step from unlocking jobs." : "Turn the road you're already on into income.",
          description: carrier
            ? "Activation is strict on purpose. Finish setup once, then post clean fixed-price jobs."
            : "Post the trip you're already taking. moverrr sends matched jobs along your route with no bidding.",
          primaryHref: "/carrier/activate",
          primaryLabel: carrier ? "Resume setup" : "Start driver setup",
        }
      : mode === "active"
        ? {
            eyebrow: requests.length > 0 ? "Most urgent" : todayTrips.length > 0 ? "Today" : "Payout blockers",
            title:
              requests.length > 0
                ? "You have a new booking request."
                : todayTrips.length > 0
                  ? "Today's route needs your attention."
                  : "Clear the blocker to release payout.",
            description:
              requests.length > 0
                ? "Review fit, access, and payout before the request expires."
                : todayTrips.length > 0
                  ? "Runsheet mode is designed for large tap targets and one-tap updates."
                  : snapshot.payoutHolds[0]?.explanation ?? "One missing step is holding money back.",
            primaryHref:
              requests.length > 0
                ? "/carrier/requests"
                : todayTrips.length > 0
                  ? `/carrier/trips/${todayTrips[0]?.id}/runsheet`
                  : "/carrier/payouts",
            primaryLabel:
              requests.length > 0
                ? "Review requests"
                : todayTrips.length > 0
                  ? "Open runsheet"
                  : "Open payouts",
          }
        : {
            eyebrow: "Ready to post",
            title: "Post your next route.",
            description: "Supply speed matters most. Quick post and template reuse should feel lighter than dispatch software.",
            primaryHref: "/carrier/trips/new",
            primaryLabel: "Post a trip",
          };

  return (
    <main id="main-content" className="screen safe-bottom-pad space-y-5 pb-[calc(88px+env(safe-area-inset-bottom))]">
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <Wordmark color="#f7f6f2" />
          <p className="rounded-[var(--radius-pill)] border border-[var(--border-subtle)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
            Driver
          </p>
        </div>
        <div>
          <p className="eyebrow">{hero.eyebrow}</p>
          <h1 className="heading mt-2 max-w-[12ch]">{hero.title}</h1>
          <p className="mt-3 max-w-[34ch] text-[15px] leading-7 text-[var(--text-secondary)]">{hero.description}</p>
        </div>
        <Link
          href={hero.primaryHref}
          className="inline-flex min-h-[56px] min-w-[44px] items-center justify-center rounded-[var(--radius-lg)] bg-[var(--bg-elevated-1)] px-5 text-[15px] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-elevated-2)] active:bg-[var(--bg-elevated-3)]"
        >
          {hero.primaryLabel}
        </Link>
      </header>

      {mode === "activation" ? (
        <>
          <HomeCard
            title="Setup checklist"
            description={activationBlockers.join(" ")}
            href="/carrier/activate"
            cta="Complete activation"
          />
          <HomeCard
            title="Why drivers use moverrr"
            description="Fixed price per job. Real jobs, not pings. Payout on delivery confirmation."
          />
        </>
      ) : null}

      {mode === "ready" ? (
        <>
          <HomeCard
            title="Quick post"
            description="Use templates and previous routes to get a live listing up in under 30 seconds."
            href="/carrier/trips/new"
            cta="Open trip posting"
          />
          <HomeCard
            title="Demand this week"
            description="Demand signals still need a live data feed here, but the slot is reserved so the shell matches the new product direction."
          />
        </>
      ) : null}

      {mode === "active" ? (
        <>
          {requests.slice(0, 2).map((request) => (
            <HomeCard
              key={request.id}
              title={`${request.itemDescription} · ${formatCurrency(request.carrierPayoutCents)}`}
              description={`${request.fitExplanation} ${request.accessSummary}`}
              href="/carrier/requests"
              cta="Review decision"
            />
          ))}

          {snapshot.todayActions
            .filter((action) => action.count > 0)
            .slice(0, 3)
            .map((action) => (
              <HomeCard
                key={action.key}
                title={`${action.title} · ${action.count}`}
                description={action.description}
                href={action.href}
                cta="Open queue"
              />
            ))}

          {liveTrips.slice(0, 2).map((trip) => (
            <HomeCard
              key={trip.id}
              title={trip.route.label}
              description={`${trip.tripDate} · ${trip.timeWindow} · Remaining ${trip.remainingCapacityPct}%`}
              href={`/carrier/trips/${trip.id}`}
              cta="Open trip"
            />
          ))}
        </>
      ) : null}
    </main>
  );
}
