const requiredProductionEnv = require("./config/required-production-env.json");

function assertRequiredEnvForBuild() {
  const isLintCommand = process.argv.some((arg) => arg.includes("lint"));

  if (process.env.NODE_ENV !== "production" || isLintCommand) {
    return;
  }

  const missing = requiredProductionEnv.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables before build: ${missing.join(", ")}`,
    );
  }

  process.env.MOVERRR_REQUIRED_ENV_VALIDATED = "true";
}

assertRequiredEnvForBuild();

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "form-action 'self'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.stripe.com https://maps.googleapis.com https://maps.gstatic.com",
      "connect-src 'self' https://*.supabase.co https://*.stripe.com https://maps.googleapis.com https://maps.gstatic.com https://vitals.vercel-insights.com",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      "worker-src 'self' blob:",
    ].join("; "),
  },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    if (process.env.NODE_ENV !== "production") {
      return [];
    }

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  env: {
    SENTRY_RELEASE:
      process.env.SENTRY_RELEASE ||
      process.env.VERCEL_GIT_COMMIT_SHA ||
      "local",
  },
};

module.exports = nextConfig;
