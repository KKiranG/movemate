import { Resend } from "resend";

import { hasResendEnv } from "@/lib/env";
import { captureAppError } from "@/lib/sentry";

function getResendClient() {
  if (!hasResendEnv()) {
    return null;
  }

  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  const resend = getResendClient();

  if (!resend) {
    return { skipped: true };
  }

  const result = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL as string,
    to: [params.to],
    subject: params.subject,
    html: params.html,
  });

  if (result.error) {
    captureAppError(result.error, {
      feature: "notifications",
      action: "sendTransactionalEmail",
      tags: { subject: params.subject },
    });
  }

  return result;
}
