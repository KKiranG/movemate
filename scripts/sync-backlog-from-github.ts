#!/usr/bin/env bun

import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

type GitHubUser = {
  login: string;
};

type GitHubComment = {
  author: GitHubUser | null;
  body: string;
  createdAt: string;
  url: string;
};

type GitHubLabel = {
  name: string;
};

type GitHubIssueNode = {
  number: number;
  title: string;
  body: string;
  state: 'OPEN' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  url: string;
  author: GitHubUser | null;
  labels: { nodes: GitHubLabel[] };
  assignees: { nodes: GitHubUser[] };
  comments: { nodes: GitHubComment[] };
};

type GitHubPullRequestNode = {
  number: number;
  title: string;
  body: string;
  state: 'OPEN' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  mergedAt: string | null;
  url: string;
  isDraft: boolean;
  headRefName: string;
  baseRefName: string;
  author: GitHubUser | null;
  labels: { nodes: GitHubLabel[] };
  assignees: { nodes: GitHubUser[] };
  comments: { nodes: GitHubComment[] };
  closingIssuesReferences: { nodes: Array<{ number: number }> };
};

type ParsedIssue = {
  issue: GitHubIssueNode;
  fields: Map<string, string>;
  labels: string[];
  typeLabel: string;
  lane: string;
  workflowState: string;
  priority: string;
  size: string;
  risk: string;
  surfaces: string[];
  lockGroup: string;
  blockedBy: string;
  safeParallelism: string;
  touchesSharedLogic: string;
  parallelismNotes: string;
  founderDecision: string;
  founderDecisionDetail: string;
  decisionMemory: string;
  doneWhen: string;
  verificationPlan: string;
  rollbackRisk: string;
  narrative: string;
};

type ParsedPullRequest = {
  pr: GitHubPullRequestNode;
  labels: string[];
  linkedIssueNumbers: number[];
};

type Args = {
  repo: string;
  dryRun: boolean;
  activePath: string;
  completedPath: string;
};

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_ACTIVE_PATH = path.join(ROOT, 'docs', 'operations', 'todolist.md');
const DEFAULT_COMPLETED_PATH = path.join(ROOT, 'docs', 'operations', 'completed.md');

const LANE_ORDER = [
  'lane:ux-builder',
  'lane:ui-builder',
  'lane:backend-builder',
  'lane:trust-safety',
  'lane:performance-reliability',
  'lane:scout',
  'lane:docs-sync',
  'lane:review',
  'lane:deploy',
  'lane:testing',
];
const STATE_ORDER = [
  'state:in-progress',
  'state:claimed',
  'state:ready',
  'state:needs-review',
  'state:pr-open',
  'state:blocked',
  'state:needs-founder-decision',
  'state:shaping',
  'state:deferred',
  'state:duplicate',
  'state:inbox',
];
const PRIORITY_ORDER = ['priority:p0', 'priority:p1', 'priority:p2', 'priority:p3', 'priority:p4'];
const SIZE_ORDER = ['size:xs', 'size:s', 'size:m', 'size:l', 'size:xl'];
const RISK_ORDER = ['risk:low', 'risk:medium', 'risk:high', 'risk:critical'];

const ISSUE_QUERY = `
query($owner: String!, $name: String!, $after: String) {
  repository(owner: $owner, name: $name) {
    issues(first: 100, after: $after, orderBy: { field: UPDATED_AT, direction: DESC }, states: [OPEN, CLOSED]) {
      nodes {
        number
        title
        body
        state
        createdAt
        updatedAt
        closedAt
        url
        author {
          login
        }
        labels(first: 50) {
          nodes {
            name
          }
        }
        assignees(first: 20) {
          nodes {
            login
          }
        }
        comments(last: 10) {
          nodes {
            body
            createdAt
            url
            author {
              login
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}
`;

const PULL_REQUEST_QUERY = `
query($owner: String!, $name: String!, $after: String) {
  repository(owner: $owner, name: $name) {
    pullRequests(first: 100, after: $after, orderBy: { field: UPDATED_AT, direction: DESC }, states: [OPEN, CLOSED, MERGED]) {
      nodes {
        number
        title
        body
        state
        createdAt
        updatedAt
        closedAt
        mergedAt
        url
        isDraft
        headRefName
        baseRefName
        author {
          login
        }
        labels(first: 50) {
          nodes {
            name
          }
        }
        assignees(first: 20) {
          nodes {
            login
          }
        }
        comments(last: 10) {
          nodes {
            body
            createdAt
            url
            author {
              login
            }
          }
        }
        closingIssuesReferences(first: 20) {
          nodes {
            number
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}
`;

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

function runGraphQL<T>(query: string, variables: Record<string, string>): T {
  const args = ['api', 'graphql', '-f', `query=${query}`];

  for (const [key, value] of Object.entries(variables)) {
    args.push('-F', `${key}=${value}`);
  }

  return runGhJson<T>(args);
}

function parseArgs(argv: string[]): Args {
  let repo = '';
  let dryRun = false;
  let activePath = DEFAULT_ACTIVE_PATH;
  let completedPath = DEFAULT_COMPLETED_PATH;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }

    if (arg === '--repo' && argv[index + 1]) {
      repo = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === '--active-path' && argv[index + 1]) {
      activePath = path.resolve(argv[index + 1]);
      index += 1;
      continue;
    }

    if (arg === '--completed-path' && argv[index + 1]) {
      completedPath = path.resolve(argv[index + 1]);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!repo) {
    repo = resolveRepo();
  }

  return { repo, dryRun, activePath, completedPath };
}

function resolveRepo(): string {
  const result = runGhJson<{ nameWithOwner: string }>(['repo', 'view', '--json', 'nameWithOwner']);
  return result.nameWithOwner;
}

function splitRepo(fullRepo: string) {
  const [owner, name] = fullRepo.split('/');
  if (!owner || !name) {
    throw new Error(`Invalid repo slug: ${fullRepo}`);
  }

  return { owner, name };
}

function fetchAllIssues(owner: string, name: string): GitHubIssueNode[] {
  const issues: GitHubIssueNode[] = [];
  let after: string | undefined;

  while (true) {
    const data = runGraphQL<{
      errors?: Array<{ message: string }>;
      data: {
        repository: {
          issues: {
            nodes: GitHubIssueNode[];
            pageInfo: { hasNextPage: boolean; endCursor: string | null };
          };
        };
      };
    }>(ISSUE_QUERY, after ? { owner, name, after } : { owner, name });

    if (data.errors && data.errors.length > 0) {
      throw new Error(`GitHub issue query failed: ${data.errors.map(error => error.message).join('; ')}`);
    }

    issues.push(...data.data.repository.issues.nodes);

    if (!data.data.repository.issues.pageInfo.hasNextPage || !data.data.repository.issues.pageInfo.endCursor) {
      break;
    }

    after = data.data.repository.issues.pageInfo.endCursor;
  }

  return issues;
}

function fetchAllPullRequests(owner: string, name: string): GitHubPullRequestNode[] {
  const pullRequests: GitHubPullRequestNode[] = [];
  let after: string | undefined;

  while (true) {
    const data = runGraphQL<{
      errors?: Array<{ message: string }>;
      data: {
        repository: {
          pullRequests: {
            nodes: GitHubPullRequestNode[];
            pageInfo: { hasNextPage: boolean; endCursor: string | null };
          };
        };
      };
    }>(PULL_REQUEST_QUERY, after ? { owner, name, after } : { owner, name });

    if (data.errors && data.errors.length > 0) {
      throw new Error(`GitHub pull request query failed: ${data.errors.map(error => error.message).join('; ')}`);
    }

    pullRequests.push(...data.data.repository.pullRequests.nodes);

    if (!data.data.repository.pullRequests.pageInfo.hasNextPage || !data.data.repository.pullRequests.pageInfo.endCursor) {
      break;
    }

    after = data.data.repository.pullRequests.pageInfo.endCursor;
  }

  return pullRequests;
}

function parseIssueFormFields(body: string): Map<string, string> {
  const fields = new Map<string, string>();
  const normalizedBody = body.replace(/\r\n/g, '\n');
  const pattern = /^###\s+(.+?)\n([\s\S]*?)(?=^###\s+|\Z)/gm;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(normalizedBody)) !== null) {
    const label = normalizeFieldKey(match[1]);
    const rawValue = match[2].trim();

    if (!rawValue || rawValue === '_No response_') {
      continue;
    }

    const selectedCheckboxes = rawValue
      .split('\n')
      .map(line => line.trim())
      .filter(line => /^- \[[xX]\]\s+/.test(line))
      .map(line => line.replace(/^- \[[xX]\]\s+/, '').trim());

    if (selectedCheckboxes.length > 0) {
      fields.set(label, selectedCheckboxes.join('\n'));
      continue;
    }

    fields.set(label, rawValue);
  }

  return fields;
}

function normalizeFieldKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function findField(fields: Map<string, string>, ...candidates: string[]): string {
  for (const candidate of candidates) {
    const value = fields.get(normalizeFieldKey(candidate));
    if (value) {
      return value.trim();
    }
  }

  return '';
}

function labelsFromNode(node: { labels: { nodes: GitHubLabel[] } }): string[] {
  return node.labels.nodes.map(label => label.name);
}

function pickLabel(labels: string[], prefix: string): string {
  return labels.find(label => label.startsWith(prefix)) ?? '';
}

function listField(value: string): string[] {
  if (!value) {
    return [];
  }

  return value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => line.replace(/^[-*]\s+/, '').trim())
    .map(line => line.replace(/^\d+\.\s+/, '').trim())
    .filter(Boolean);
}

function extractNarrative(fields: Map<string, string>): string {
  const narrative = findField(
    fields,
    'context',
    'actual behavior',
    'audit scope',
    'decision to make',
    'impact',
    'current behavior',
    'target behavior',
    'recommended path',
  );

  return compactInlineText(narrative);
}

function compactInlineText(value: string, maxLength = 220): string {
  const singleLine = value.replace(/\s+/g, ' ').trim();
  if (singleLine.length <= maxLength) {
    return singleLine;
  }

  return `${singleLine.slice(0, maxLength - 1).trimEnd()}...`;
}

function parseIssues(issues: GitHubIssueNode[]): ParsedIssue[] {
  return issues.map(issue => {
    const fields = parseIssueFormFields(issue.body);
    const labels = labelsFromNode(issue);
    const surfacesFromLabels = labels.filter(label => label.startsWith('surface:'));
    const surfacesFromFields = listField(findField(fields, 'affected surfaces'));

    return {
      issue,
      fields,
      labels,
      typeLabel: pickLabel(labels, 'type:') || inferTypeFromFields(fields),
      lane: pickLabel(labels, 'lane:') || findField(fields, 'lane') || 'lane:scout',
      workflowState: pickLabel(labels, 'state:') || findField(fields, 'state') || 'state:inbox',
      priority: pickLabel(labels, 'priority:') || findField(fields, 'priority') || 'priority:p2',
      size: pickLabel(labels, 'size:') || findField(fields, 'size') || 'size:m',
      risk: pickLabel(labels, 'risk:') || findField(fields, 'risk') || 'risk:medium',
      surfaces: surfacesFromLabels.length > 0 ? surfacesFromLabels : surfacesFromFields,
      lockGroup: findField(fields, 'lock group'),
      blockedBy: findField(fields, 'blocked by'),
      safeParallelism: findField(fields, 'safe parallelism'),
      touchesSharedLogic: findField(fields, 'touches shared logic'),
      parallelismNotes: findField(fields, 'parallelism notes'),
      founderDecision: findField(fields, 'founder decision'),
      founderDecisionDetail: findField(fields, 'founder decision detail'),
      decisionMemory: findField(fields, 'decision memory links'),
      doneWhen: findField(fields, 'done when'),
      verificationPlan: findField(fields, 'verification plan'),
      rollbackRisk: findField(fields, 'rollback risk', 'rollback or guardrail'),
      narrative: extractNarrative(fields),
    };
  });
}

function inferTypeFromFields(fields: Map<string, string>): string {
  if (fields.has('actual behavior') || fields.has('reproduction steps')) {
    return 'type:bug';
  }
  if (fields.has('audit scope')) {
    return 'type:audit';
  }
  if (fields.has('decision to make')) {
    return 'type:founder-decision';
  }
  if (fields.has('environment') && fields.has('impact') && fields.has('rollback or guardrail')) {
    return 'type:deploy-fix';
  }
  return 'type:builder-task';
}

function referencedIssueNumbers(text: string): number[] {
  const matches = new Set<number>();
  const referencePattern = /\B#(\d+)\b/g;

  let match: RegExpExecArray | null;
  while ((match = referencePattern.exec(text)) !== null) {
    matches.add(Number(match[1]));
  }

  return [...matches];
}

function parsePullRequests(pullRequests: GitHubPullRequestNode[], knownIssueNumbers: Set<number>): ParsedPullRequest[] {
  return pullRequests.map(pr => {
    const labels = labelsFromNode(pr);
    const linkedIssueNumbers = new Set<number>(pr.closingIssuesReferences.nodes.map(node => node.number));

    for (const issueNumber of referencedIssueNumbers(pr.body)) {
      if (knownIssueNumbers.has(issueNumber)) {
        linkedIssueNumbers.add(issueNumber);
      }
    }

    for (const comment of pr.comments.nodes) {
      for (const issueNumber of referencedIssueNumbers(comment.body)) {
        if (knownIssueNumbers.has(issueNumber)) {
          linkedIssueNumbers.add(issueNumber);
        }
      }
    }

    return {
      pr,
      labels,
      linkedIssueNumbers: [...linkedIssueNumbers],
    };
  });
}

function orderIndex(order: string[], value: string): number {
  const index = order.indexOf(value);
  return index === -1 ? order.length : index;
}

function sortParsedIssues(issues: ParsedIssue[]): ParsedIssue[] {
  return [...issues].sort((left, right) => {
    const priorityDelta = orderIndex(PRIORITY_ORDER, left.priority) - orderIndex(PRIORITY_ORDER, right.priority);
    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    const stateDelta = orderIndex(STATE_ORDER, left.workflowState) - orderIndex(STATE_ORDER, right.workflowState);
    if (stateDelta !== 0) {
      return stateDelta;
    }

    const laneDelta = orderIndex(LANE_ORDER, left.lane) - orderIndex(LANE_ORDER, right.lane);
    if (laneDelta !== 0) {
      return laneDelta;
    }

    return right.issue.updatedAt.localeCompare(left.issue.updatedAt);
  });
}

function sortComments(comments: GitHubComment[]): GitHubComment[] {
  return [...comments].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function isAutomationComment(comment: GitHubComment): boolean {
  const author = (comment.author?.login ?? '').toLowerCase();
  const body = comment.body.trim();

  if (!author) {
    return false;
  }

  return (
    author.includes('[bot]') ||
    author === 'vercel' ||
    author === 'google-labs-jules' ||
    body.startsWith('[vc]:') ||
    body.startsWith('Deployment failed with the following error:')
  );
}

function formatDate(value: string | null): string {
  if (!value) {
    return 'n/a';
  }

  return value.slice(0, 10);
}

function markdownLink(label: string, url: string): string {
  return `[${label}](${url})`;
}

function latestActivity(issue: ParsedIssue, linkedPrs: ParsedPullRequest[]): GitHubComment | null {
  const comments: GitHubComment[] = [...issue.issue.comments.nodes];
  for (const linkedPr of linkedPrs) {
    comments.push(...linkedPr.pr.comments.nodes);
  }

  const sorted = sortComments(comments.filter(comment => !isAutomationComment(comment)));
  return sorted[0] ?? null;
}

function formatLatestActivity(comment: GitHubComment | null): string {
  if (!comment) {
    return 'No comments yet.';
  }

  const author = comment.author?.login ?? 'unknown';
  return `${formatDate(comment.createdAt)} by ${author} - ${compactInlineText(comment.body, 180)}`;
}

function formatInlineList(values: string[]): string {
  if (values.length === 0) {
    return 'none';
  }

  return values.map(value => `\`${value}\``).join(', ');
}

function appendChecklistSection(lines: string[], heading: string, value: string) {
  const items = listField(value);
  if (items.length === 0) {
    return;
  }

  lines.push(`- ${heading}:`);
  for (const item of items) {
    lines.push(`  - ${item}`);
  }
}

function appendMetadata(lines: string[], issue: ParsedIssue, linkedPrs: ParsedPullRequest[]) {
  lines.push(`- URL: ${markdownLink(`#${issue.issue.number}`, issue.issue.url)}`);
  lines.push(`- Type: \`${issue.typeLabel}\``);
  lines.push(`- Lane: \`${issue.lane}\``);
  lines.push(`- State: \`${issue.workflowState}\``);
  lines.push(`- Priority: \`${issue.priority}\``);
  lines.push(`- Size: \`${issue.size}\``);
  lines.push(`- Risk: \`${issue.risk}\``);
  lines.push(`- Updated: ${formatDate(issue.issue.updatedAt)}`);

  if (issue.lockGroup && issue.lockGroup.toLowerCase() !== 'none') {
    lines.push(`- Lock group: \`${compactInlineText(issue.lockGroup, 120)}\``);
  }

  if (issue.surfaces.length > 0) {
    lines.push(`- Affected surfaces: ${formatInlineList(issue.surfaces)}`);
  }

  if (issue.blockedBy) {
    lines.push(`- Blocked by: ${compactInlineText(issue.blockedBy, 180)}`);
  }

  if (issue.founderDecision) {
    lines.push(`- Founder decision: ${compactInlineText(issue.founderDecision, 180)}`);
  }

  if (issue.founderDecisionDetail && issue.founderDecisionDetail.toLowerCase() !== 'none') {
    lines.push(`- Founder decision detail: ${compactInlineText(issue.founderDecisionDetail, 180)}`);
  }

  if (issue.decisionMemory && issue.decisionMemory.toLowerCase() !== 'none') {
    lines.push(`- Decision memory: ${compactInlineText(issue.decisionMemory, 220)}`);
  }

  if (linkedPrs.length > 0) {
    const linked = linkedPrs
      .map(pr => {
        const status = pr.pr.mergedAt ? `merged ${formatDate(pr.pr.mergedAt)}` : pr.pr.state.toLowerCase();
        return `${markdownLink(`#${pr.pr.number}`, pr.pr.url)} (${status})`;
      })
      .join(', ');
    lines.push(`- Linked PRs: ${linked}`);
  } else {
    lines.push('- Linked PRs: none found');
  }

  if (issue.narrative) {
    lines.push(`- Context: ${issue.narrative}`);
  }

  appendChecklistSection(lines, 'Done when', issue.doneWhen);

  if (issue.safeParallelism) {
    lines.push(`- Safe parallelism: ${compactInlineText(issue.safeParallelism, 220)}`);
  }

  if (issue.touchesSharedLogic) {
    lines.push(`- Touches shared logic: ${compactInlineText(issue.touchesSharedLogic, 80)}`);
  }

  if (issue.parallelismNotes) {
    lines.push(`- Parallelism notes: ${compactInlineText(issue.parallelismNotes, 220)}`);
  }

  appendChecklistSection(lines, 'Verification plan', issue.verificationPlan);

  if (issue.rollbackRisk) {
    lines.push(`- Rollback risk: ${compactInlineText(issue.rollbackRisk, 220)}`);
  }

  lines.push(`- Latest activity: ${formatLatestActivity(latestActivity(issue, linkedPrs))}`);
}

function buildIssueToPrMap(pullRequests: ParsedPullRequest[]): Map<number, ParsedPullRequest[]> {
  const map = new Map<number, ParsedPullRequest[]>();

  for (const pr of pullRequests) {
    for (const issueNumber of pr.linkedIssueNumbers) {
      const current = map.get(issueNumber) ?? [];
      current.push(pr);
      map.set(issueNumber, current);
    }
  }

  return map;
}

function formatSummaryCounts(items: ParsedIssue[]): string[] {
  const stateCounts = new Map<string, number>();
  for (const item of items) {
    stateCounts.set(item.workflowState, (stateCounts.get(item.workflowState) ?? 0) + 1);
  }

  return STATE_ORDER
    .filter(state => stateCounts.has(state))
    .map(state => `- \`${state}\`: ${stateCounts.get(state)}`);
}

function generateActiveDigest(repo: string, issues: ParsedIssue[], issueToPrMap: Map<number, ParsedPullRequest[]>): string {
  const generatedOn = new Date().toISOString();
  const lines: string[] = [];

  lines.push('# MoveMate Strategic Backlog Snapshot');
  lines.push('');
  lines.push(`> Generated from GitHub on \`${generatedOn}\` for \`${repo}\`.`);
  lines.push('>');
  lines.push('> Derived artifact only. Update issues, labels, fields, and linked pull requests in GitHub instead of editing this file by hand.');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(`Open issues: **${issues.length}**`);

  const summaryCounts = formatSummaryCounts(issues);
  if (summaryCounts.length > 0) {
    lines.push('');
    lines.push('## State summary');
    lines.push('');
    lines.push(...summaryCounts);
  }

  lines.push('');
  lines.push('## Open issues by state');
  lines.push('');

  if (issues.length === 0) {
    lines.push('No open GitHub issues were found. Create new work from the issue forms under `.github/ISSUE_TEMPLATE/`.');
    lines.push('');
    return lines.join('\n');
  }

  const grouped = new Map<string, ParsedIssue[]>();
  for (const issue of issues) {
    const current = grouped.get(issue.workflowState) ?? [];
    current.push(issue);
    grouped.set(issue.workflowState, current);
  }

  for (const state of STATE_ORDER) {
    const stateIssues = grouped.get(state);
    if (!stateIssues || stateIssues.length === 0) {
      continue;
    }

    lines.push(`## ${state}`);
    lines.push('');

    for (const issue of stateIssues) {
      lines.push(`### \`#${issue.issue.number}\` ${issue.issue.title}`);
      appendMetadata(lines, issue, issueToPrMap.get(issue.issue.number) ?? []);
      lines.push('');
    }
  }

  return lines.join('\n');
}

function generateCompletedDigest(repo: string, closedIssues: ParsedIssue[], mergedPrs: ParsedPullRequest[], issueToPrMap: Map<number, ParsedPullRequest[]>): string {
  const generatedOn = new Date().toISOString();
  const lines: string[] = [];
  const closedWithLinkedPrs = closedIssues.filter(issue => (issueToPrMap.get(issue.issue.number) ?? []).length > 0);
  const unlinkedMergedPrs = mergedPrs.filter(pr => pr.linkedIssueNumbers.length === 0);

  lines.push('# MoveMate Shipping Digest');
  lines.push('');
  lines.push(`> Generated from GitHub on \`${generatedOn}\` for \`${repo}\`.`);
  lines.push('>');
  lines.push('> Derived artifact only. The durable source of truth is closed GitHub issues, merged pull requests, and their comments.');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(`Closed issues: **${closedIssues.length}**`);
  lines.push(`Merged pull requests: **${mergedPrs.length}**`);
  lines.push('');
  lines.push('## Closed issues');
  lines.push('');

  if (closedIssues.length === 0) {
    lines.push('No closed GitHub issues were found.');
    lines.push('');
  } else {
    for (const issue of closedIssues) {
      const linkedPrs = issueToPrMap.get(issue.issue.number) ?? [];
      lines.push(`### \`#${issue.issue.number}\` ${issue.issue.title}`);
      lines.push(`- Closed: ${formatDate(issue.issue.closedAt)}`);
      lines.push(`- URL: ${markdownLink(`#${issue.issue.number}`, issue.issue.url)}`);
      lines.push(`- Type: \`${issue.typeLabel}\``);
      lines.push(`- Lane: \`${issue.lane}\``);
      lines.push(`- Closed state: \`${issue.workflowState}\``);
      lines.push(`- Priority: \`${issue.priority}\``);
      lines.push(`- Risk: \`${issue.risk}\``);
      if (issue.surfaces.length > 0) {
        lines.push(`- Affected surfaces: ${formatInlineList(issue.surfaces)}`);
      }
      if (issue.narrative) {
        lines.push(`- Context: ${issue.narrative}`);
      }
      appendChecklistSection(lines, 'Done when', issue.doneWhen);
      appendChecklistSection(lines, 'Verification plan', issue.verificationPlan);
      if (linkedPrs.length > 0) {
        const linked = linkedPrs
          .map(pr => {
            const status = pr.pr.mergedAt ? `merged ${formatDate(pr.pr.mergedAt)}` : pr.pr.state.toLowerCase();
            return `${markdownLink(`#${pr.pr.number}`, pr.pr.url)} (${status})`;
          })
          .join(', ');
        lines.push(`- Linked PRs: ${linked}`);
      } else {
        lines.push('- Linked PRs: none found');
      }
      lines.push(`- Latest activity: ${formatLatestActivity(latestActivity(issue, linkedPrs))}`);
      lines.push('');
    }
  }

  lines.push('## Merged PRs without linked issues');
  lines.push('');
  if (unlinkedMergedPrs.length === 0) {
    lines.push('Every merged pull request had at least one linked issue.');
    lines.push('');
  } else {
    for (const pr of unlinkedMergedPrs) {
      const latestComment = sortComments(pr.pr.comments.nodes.filter(comment => !isAutomationComment(comment)))[0] ?? null;
      lines.push(`### \`#${pr.pr.number}\` ${pr.pr.title}`);
      lines.push(`- Merged: ${formatDate(pr.pr.mergedAt)}`);
      lines.push(`- URL: ${markdownLink(`#${pr.pr.number}`, pr.pr.url)}`);
      lines.push(`- Branch: \`${pr.pr.headRefName}\` -> \`${pr.pr.baseRefName}\``);
      lines.push(`- Author: ${pr.pr.author?.login ?? 'unknown'}`);
      lines.push(`- Labels: ${formatInlineList(pr.labels)}`);
      lines.push(`- Latest activity: ${formatLatestActivity(latestComment)}`);
      lines.push('');
    }
  }

  if (closedWithLinkedPrs.length === 0 && unlinkedMergedPrs.length === 0) {
    lines.push('No completion evidence was found yet.');
    lines.push('');
  }

  return lines.join('\n');
}

function writeOutput(filePath: string, content: string, dryRun: boolean) {
  if (dryRun) {
    return;
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${content.trimEnd()}\n`, 'utf8');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const { owner, name } = splitRepo(args.repo);
  const issues = parseIssues(fetchAllIssues(owner, name));
  const knownIssueNumbers = new Set(issues.map(issue => issue.issue.number));
  const pullRequests = parsePullRequests(fetchAllPullRequests(owner, name), knownIssueNumbers);
  const issueToPrMap = buildIssueToPrMap(pullRequests);

  const openIssues = sortParsedIssues(issues.filter(issue => issue.issue.state === 'OPEN'));
  const closedIssues = sortParsedIssues(issues.filter(issue => issue.issue.state === 'CLOSED')).sort((left, right) => {
    return (right.issue.closedAt ?? '').localeCompare(left.issue.closedAt ?? '');
  });
  const mergedPrs = [...pullRequests]
    .filter(pr => Boolean(pr.pr.mergedAt))
    .sort((left, right) => (right.pr.mergedAt ?? '').localeCompare(left.pr.mergedAt ?? ''));

  const activeDigest = generateActiveDigest(args.repo, openIssues, issueToPrMap);
  const completedDigest = generateCompletedDigest(args.repo, closedIssues, mergedPrs, issueToPrMap);

  if (args.dryRun) {
    console.log(`=== ${args.activePath} ===`);
    console.log(activeDigest);
    console.log('');
    console.log(`=== ${args.completedPath} ===`);
    console.log(completedDigest);
    return;
  }

  writeOutput(args.activePath, activeDigest, false);
  writeOutput(args.completedPath, completedDigest, false);

  console.log(`wrote ${args.activePath}`);
  console.log(`wrote ${args.completedPath}`);
}

main();
