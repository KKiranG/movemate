#!/usr/bin/env bun

import { execFileSync } from 'node:child_process';

type LabelDefinition = {
  name: string;
  color: string;
  description: string;
};

const LABELS: LabelDefinition[] = [
  { name: 'type:builder-task', color: '1D76DB', description: 'Planned implementation work tracked through GitHub issues.' },
  { name: 'type:bug', color: 'D73A4A', description: 'Broken behavior, regression, or trust-damaging defect.' },
  { name: 'type:audit', color: '5319E7', description: 'Review, audit, or investigation work that produces findings.' },
  { name: 'type:founder-decision', color: 'B60205', description: 'Founder-level tradeoff or decision request.' },
  { name: 'type:deploy-fix', color: 'FBCA04', description: 'Release blocker, deploy incident, or urgent production fix.' },

  { name: 'lane:ux-builder', color: '0E8A16', description: 'Customer or carrier UX implementation work.' },
  { name: 'lane:ui-builder', color: '1D76DB', description: 'Design-system, styling, and component implementation work.' },
  { name: 'lane:backend-builder', color: '5319E7', description: 'Backend flow, API, state, or data-model implementation work.' },
  { name: 'lane:trust-safety', color: 'B60205', description: 'Trust, safety, dispute, proof, and high-sensitivity product logic.' },
  { name: 'lane:performance-reliability', color: '0052CC', description: 'Performance, reliability, and operational stability work.' },
  { name: 'lane:scout', color: '6F42C1', description: 'Discovery, investigation, shaping, or audit-prep work.' },
  { name: 'lane:docs-sync', color: '0075CA', description: 'Documentation, digests, and repo-operating-system synchronization.' },
  { name: 'lane:review', color: '8B5CF6', description: 'Review, adjudication, or QA-specific execution work.' },
  { name: 'lane:deploy', color: 'FBCA04', description: 'Deployment, release, infra, or preview/staging work.' },
  { name: 'lane:testing', color: 'A2EEEF', description: 'Automated tests, smoke coverage, and verification infrastructure.' },

  { name: 'state:inbox', color: 'C5DEF5', description: 'Captured but not yet triaged.' },
  { name: 'state:shaping', color: 'BFDADC', description: 'Being shaped into a build-ready issue.' },
  { name: 'state:ready', color: '0E8A16', description: 'Ready for one builder to claim.' },
  { name: 'state:claimed', color: 'FBCA04', description: 'Claimed by one builder but not yet in active implementation.' },
  { name: 'state:in-progress', color: 'D93F0B', description: 'Implementation is actively underway.' },
  { name: 'state:pr-open', color: '5319E7', description: 'A pull request exists for this issue.' },
  { name: 'state:needs-review', color: '6F42C1', description: 'Waiting on review or adjudication.' },
  { name: 'state:needs-founder-decision', color: 'B60205', description: 'Blocked on a founder decision.' },
  { name: 'state:blocked', color: 'A64D79', description: 'Blocked on a dependency, credential, or external constraint.' },
  { name: 'state:duplicate', color: 'D4C5F9', description: 'Duplicate of another tracked issue.' },
  { name: 'state:rejected', color: '7A7A7A', description: 'Closed without implementation.' },
  { name: 'state:deferred', color: 'C2E0C6', description: 'Valid work, intentionally deferred.' },
  { name: 'state:done', color: '0B7A75', description: 'Shipped and closed.' },

  { name: 'priority:p0', color: 'B60205', description: 'Production blocking or must-fix now.' },
  { name: 'priority:p1', color: 'D93F0B', description: 'High priority work that should land soon.' },
  { name: 'priority:p2', color: 'FBCA04', description: 'Important but not urgent.' },
  { name: 'priority:p3', color: '0E8A16', description: 'Useful follow-up work.' },
  { name: 'priority:p4', color: 'C2E0C6', description: 'Deferred or low urgency work.' },

  { name: 'size:xs', color: 'EDEDED', description: 'Tiny change, usually under one focused hour.' },
  { name: 'size:s', color: 'D4C5F9', description: 'Small task with a tight blast radius.' },
  { name: 'size:m', color: 'BFDADC', description: 'Medium task spanning a few files or checks.' },
  { name: 'size:l', color: 'F9D0C4', description: 'Large task with multiple moving parts.' },
  { name: 'size:xl', color: 'D4A017', description: 'Very large or multi-step task that may need splitting.' },

  { name: 'risk:low', color: 'C2E0C6', description: 'Low blast radius and easy rollback.' },
  { name: 'risk:medium', color: 'FBCA04', description: 'Moderate blast radius or coordination needs.' },
  { name: 'risk:high', color: 'D93F0B', description: 'High blast radius, risky migration, or user-facing downside.' },
  { name: 'risk:critical', color: 'B60205', description: 'Critical safety, payments, auth, or production risk.' },

  { name: 'surface:customer-web', color: '006B75', description: 'Customer-facing web UI or flows.' },
  { name: 'surface:carrier-web', color: '0B7A75', description: 'Carrier-facing web UI or workflows.' },
  { name: 'surface:admin-web', color: '1B4F72', description: 'Admin or operator web surfaces.' },
  { name: 'surface:mobile-web', color: '2E8B57', description: 'Mobile browser behavior, layout, or touch interactions.' },
  { name: 'surface:api', color: '0052CC', description: 'HTTP API routes, handlers, or contract changes.' },
  { name: 'surface:data', color: '5319E7', description: 'Database, schema, persistence, or state models.' },
  { name: 'surface:payments', color: 'C2185B', description: 'Payments, billing, or money movement flows.' },
  { name: 'surface:ops', color: '6F42C1', description: 'Operational tooling, release work, or support systems.' },
  { name: 'surface:github', color: '24292F', description: 'GitHub issues, labels, pull requests, or repo automation.' },
  { name: 'surface:docs', color: '0075CA', description: 'Documentation or derived markdown digests.' },
  { name: 'surface:design-system', color: 'A2EEEF', description: 'Shared UI components, tokens, or design system work.' },

  { name: 'platform:mobile-ios-first', color: 'E99695', description: 'Touches the iPhone-first mobile experience or ergonomics.' },
  { name: 'platform:android-compat', color: '2E8B57', description: 'Touches Android-compatibility constraints or regressions.' },
  { name: 'platform:prod-readiness', color: '1B4F72', description: 'Production-readiness, env, deploy, or release-hardening work.' },
];

const MANAGED_PREFIXES = ['type:', 'lane:', 'state:', 'priority:', 'size:', 'risk:', 'surface:', 'platform:'];

function runGh(args: string[]): string {
  return execFileSync('gh', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function runGhJson<T>(args: string[]): T {
  const output = runGh(args);
  return JSON.parse(output) as T;
}

function parseArgs(argv: string[]) {
  let dryRun = false;
  let pruneManaged = false;
  let repo = '';

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (arg === '--prune-managed') {
      pruneManaged = true;
      continue;
    }
    if (arg === '--repo' && argv[index + 1]) {
      repo = argv[index + 1];
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return { dryRun, pruneManaged, repo };
}

function resolveRepo(explicitRepo: string): string {
  if (explicitRepo) {
    return explicitRepo;
  }

  const result = runGhJson<{ nameWithOwner: string }>(['repo', 'view', '--json', 'nameWithOwner']);
  return result.nameWithOwner;
}

function syncLabels(repo: string, dryRun: boolean) {
  for (const label of LABELS) {
    const args = [
      'label',
      'create',
      label.name,
      '--color',
      label.color,
      '--description',
      label.description,
      '--force',
      '--repo',
      repo,
    ];

    if (dryRun) {
      console.log(`[dry-run] gh ${args.join(' ')}`);
      continue;
    }

    runGh(args);
    console.log(`synced ${label.name}`);
  }
}

function pruneExtraManagedLabels(repo: string, dryRun: boolean) {
  const existing = runGhJson<Array<{ name: string }>>([
    'label',
    'list',
    '--limit',
    '500',
    '--json',
    'name',
    '--repo',
    repo,
  ]);

  const desired = new Set(LABELS.map(label => label.name));
  const extraManaged = existing
    .map(label => label.name)
    .filter(name => MANAGED_PREFIXES.some(prefix => name.startsWith(prefix)))
    .filter(name => !desired.has(name));

  if (extraManaged.length === 0) {
    console.log('no extra managed labels to prune');
    return;
  }

  for (const labelName of extraManaged) {
    const args = ['label', 'delete', labelName, '--yes', '--repo', repo];
    if (dryRun) {
      console.log(`[dry-run] gh ${args.join(' ')}`);
      continue;
    }

    runGh(args);
    console.log(`deleted ${labelName}`);
  }
}

function main() {
  const { dryRun, pruneManaged, repo: repoArg } = parseArgs(process.argv.slice(2));
  const repo = resolveRepo(repoArg);

  console.log(`syncing ${LABELS.length} managed labels in ${repo}`);
  syncLabels(repo, dryRun);

  if (pruneManaged) {
    pruneExtraManagedLabels(repo, dryRun);
  }

  console.log('');
  console.log('managed prefixes:', MANAGED_PREFIXES.join(', '));
  console.log('lock groups stay in issue-form fields and derived digests to avoid label explosion.');
}

main();
