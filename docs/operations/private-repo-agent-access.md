# Private Repo And Agent Access Packet

This packet prepares MoveMate for a future private GitHub repo. It does not change repo visibility.

## Recommendation

Make the repo private before real production credentials, customer data, carrier documents, or proprietary operating logic become routine in the repository history.

## Why it matters

MoveMate contains marketplace state logic, trust and safety policy, payment and payout flows, schema design, and agent operating-system instructions. Even without committed secrets, a public repo exposes enough implementation and operations detail to make abuse, copying, or accidental credential leakage more likely.

## Agent access model

- Codex, Claude, Jules, Gemini/Antigravity, Hermes, and any future orchestrator should authenticate through GitHub accounts or apps with least-privilege repo access.
- Builder agents need branch, issue, and PR access; they do not need org-wide admin access.
- Review and ship agents need PR review, Actions log, and merge visibility; only trusted release lanes should get write/merge permissions.
- Project automation needs GitHub Project v2 scopes. If unavailable, run:

```bash
gh auth refresh -s project
npm run ops:project
npm run ops:sync-fields
```

## Secrets posture

Never commit:

- `.env`, `.env.local`, or hosted environment dumps
- Supabase service role keys
- Stripe secret or webhook keys
- Resend API keys
- Google Maps keys beyond explicitly public browser keys
- Vercel, Sentry, VAPID, smoke bootstrap, cron, or admin secrets
- carrier identity documents, proof photos, customer addresses, or production exports

Use `.env.example` for key names only. Use Vercel/Supabase/Stripe dashboards or GitHub encrypted secrets for real values.

## Public exposure risks while repo remains public

- Competitors can read pricing, matching, and ops assumptions.
- Attackers can inspect trust/payout edge cases before launch.
- Agent scratch material can accidentally become public if committed.
- Generated snapshots can reveal local structure or stale workflow assumptions.

## Private migration checklist

1. Confirm all active agents and integrations have GitHub access before flipping visibility.
2. Confirm CI, Vercel, Supabase, Stripe webhook, and project automation still authenticate.
3. Re-run `npm run ops:labels` and `npm run ops:sync-backlog` after the access change.
4. Audit recent commits for accidental secrets or customer data before production credentials are introduced.
5. Keep founder-decision issues visible inside GitHub rather than in chat-only history.

## Validation

After the repo becomes private:

- `gh repo view --json visibility` reports `PRIVATE`
- `npm run check`
- `npm run test`
- `npm run build`
- CI and Operations Docs Check are green on the next PR
