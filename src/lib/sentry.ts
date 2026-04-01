import * as Sentry from "@sentry/nextjs";

function getCommonTags() {
  return {
    environment: process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV ?? "development",
    release: process.env.SENTRY_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
  };
}

export function captureAppError(
  error: unknown,
  context: { feature: string; action: string; tags?: Record<string, string> },
) {
  if (!(error instanceof Error)) {
    return;
  }

  Sentry.captureException(error, {
    tags: {
      ...getCommonTags(),
      feature: context.feature,
      action: context.action,
      ...context.tags,
    },
  });
}

export function captureAppMessage(
  message: string,
  context: { feature: string; action: string; tags?: Record<string, string> },
) {
  Sentry.captureMessage(message, {
    tags: {
      ...getCommonTags(),
      feature: context.feature,
      action: context.action,
      ...context.tags,
    },
  });
}
