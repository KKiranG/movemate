import fs from "node:fs";
import path from "node:path";

export interface WebhookReplayStep {
  name: string;
  expectedPaymentStatus?: string;
  event: Record<string, unknown>;
}

export interface WebhookReplayFixture {
  bookingId: string;
  initialPaymentStatus?: string;
  steps: WebhookReplayStep[];
}

const FIXTURES_DIR = path.join(
  process.cwd(),
  "src/app/api/payments/webhook/__tests__/fixtures",
);

export function getWebhookReplayFixturePath(name: string) {
  return path.join(FIXTURES_DIR, name);
}

export function loadWebhookReplayFixture(name: string): WebhookReplayFixture {
  return JSON.parse(
    fs.readFileSync(getWebhookReplayFixturePath(name), "utf8"),
  ) as WebhookReplayFixture;
}
