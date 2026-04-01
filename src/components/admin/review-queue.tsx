import Link from "next/link";

import { Card } from "@/components/ui/card";

const tasks = [
  {
    href: "/admin/verification",
    title: "Verify new carriers manually before they appear in search.",
  },
  {
    href: "/admin/bookings",
    title: "Review bookings stuck in pending longer than 2 hours.",
  },
  {
    href: "/admin/payments",
    title:
      "Clear payout blockers, capture failures, and stale delivery confirmations.",
  },
  {
    href: "/admin/disputes",
    title: "Resolve disputes with proof photos and timeline notes.",
  },
];

export function ReviewQueue() {
  return (
    <Card className="p-4">
      <div className="space-y-3">
        <p className="section-label">Manual-first ops</p>
        <h2 className="text-lg text-text">Admin queue</h2>
        <ul className="space-y-2 text-sm leading-6 text-text-secondary">
          {tasks.map((task) => (
            <li key={task.href}>
              <Link
                href={task.href}
                className="inline-flex min-h-[44px] items-center text-accent transition hover:text-accent/80 active:text-accent/70"
              >
                {task.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
