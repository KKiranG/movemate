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
}

assertRequiredEnvForBuild();

/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = nextConfig;
