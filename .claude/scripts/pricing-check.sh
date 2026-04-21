#!/bin/bash
# Stop hook: run the pricing breakdown tests when pricing files were touched this session.
# Guards commission identity: 15% of basePriceCents only, zero booking fee.

cd "${CLAUDE_PROJECT_DIR}"

changed="$(
  git diff --name-only HEAD 2>/dev/null
  git diff --name-only --cached 2>/dev/null
)"

pricing_changed=false
while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  case "$file" in
    src/lib/pricing/*|src/lib/__tests__/breakdown*)
      pricing_changed=true; break ;;
  esac
done <<< "$changed"

if [[ "$pricing_changed" != "true" ]]; then
  exit 0
fi

echo "Pricing files changed — running commission identity check..."

output="$(npm run test -- --testPathPattern=breakdown --passWithNoTests 2>&1)"
if echo "$output" | grep -qE "^(FAIL|Tests:|●).*fail"; then
  echo ""
  echo "PRICING REGRESSION DETECTED — breakdown tests failed:"
  echo "$output"
  echo ""
  echo "Do not ship until commission identity is confirmed."
fi

exit 0
