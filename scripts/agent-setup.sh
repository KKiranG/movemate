#!/usr/bin/env bash
# Agent and developer onboarding bootstrap for MoveMate.
# Run once after clone: bash scripts/agent-setup.sh
set -euo pipefail

REQUIRED_NODE_MAJOR=20

echo "==> MoveMate repo setup"

# Node version check
node_major=$(node -e "process.stdout.write(String(process.version.split('.')[0].slice(1)))")
if (( node_major < REQUIRED_NODE_MAJOR )); then
  echo "ERROR: Node $REQUIRED_NODE_MAJOR+ required (found $node_major). Use nvm or fnm to switch." >&2
  exit 1
fi
echo "    Node $node_major OK"

# Install dependencies
echo "==> Installing dependencies"
npm ci

# Validate .env
if [ ! -f .env.local ] && [ ! -f .env ]; then
  echo ""
  echo "WARNING: No .env.local or .env found."
  echo "  Copy .env.example and fill in real values:"
  echo "  cp .env.example .env.local"
  echo ""
  echo "Required secrets for local dev:"
  echo "  NEXT_PUBLIC_SUPABASE_URL"
  echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY"
  echo "  SUPABASE_SERVICE_ROLE_KEY"
  echo "  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
  echo "  STRIPE_SECRET_KEY"
  echo "  STRIPE_WEBHOOK_SECRET"
  echo ""
  echo "Skipping typecheck — env is not set."
  exit 0
fi

# Static checks
echo "==> Running lint + typecheck"
npm run check

echo ""
echo "Setup complete. Start the dev server with: npm run dev"
echo "Run tests with: npm run test"
echo "Sync backlog from GitHub with: npm run ops:sync-backlog"
