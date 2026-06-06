#!/usr/bin/env node
/**
 * Create S15/S16 developer Jira UX GitHub issues (T151–T159).
 * Closes superseded open issues #183–#188 from the prior multi-tenant plan.
 *
 * Usage: node scripts/create-s15-jira-ux-issues.mjs [--dry-run]
 */

import { execSync } from 'node:child_process'
import { writeFileSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const REPO = 'Jordan1881/Questly'
const DRY_RUN = process.argv.includes('--dry-run')
const EPIC = 179

const SUPERSEDED = [
  { number: 183, reason: 'Multi-tenant regression suite deferred — fold into post-S15 hardening or reopen after T155 E2E lands.' },
  { number: 184, reason: 'Encrypt-at-rest moved to **T159**; per-workspace story points field deferred.' },
  { number: 185, reason: 'Admin multi-workspace switcher deferred past developer UX sprint.' },
  { number: 186, reason: 'Admin workspace OAuth moved to **T156** in replanned S16.' },
  { number: 187, reason: 'Workspace memberships spike remains optional — reopen after S16.' },
  { number: 188, reason: 'Deploy docs + UI guards split across **T153**, **T158**, and **T156**.' },
]

const TASKS = [
  {
    tid: 'T151',
    type: 'AFK',
    sprint: 'S15',
    milestone: 'M9',
    layer: 'Frontend',
    effort: 'M',
    assigned: 'Shared',
    planDependency: '—',
    title: 'Pre-workspace empty states + friendly Jira gating',
    labels: ['afk', 'frontend', 'backend', 'sprint-s15', 'milestone-m9'],
    blockedBy: null,
    what: `Developers without a workspace should see helpful empty states — not raw Jira 401/503 errors.

- Profile \`JiraIntegrationCard\`: three states — no workspace (info), workspace + not connected (connect), connected
- Dashboard / Task List when \`!workspace_id\`: empty state → link to \`/workspace/join\`
- \`POST /api/auth/me/jira/connect\` without workspace: return **400** with actionable copy (not 503/401)
- Copy: *"Join a team first, or connect Jira after your admin approves you."*`,
    featureAC: [
      'Developer with no workspace never sees raw `Jira request failed with HTTP 401` from missing site config',
      'Profile explains workspace invite is required before Jira link is needed for tasks',
      'Developer may open Profile before join (no crash / no misleading Connected state)',
      'API test: connect without workspace returns clear 400 message',
      'Existing workspace member connect flow unchanged',
    ],
    hints: [
      '`server/controllers/auth.js` — `connectJira` error messages',
      '`src/components/JiraIntegrationCard.jsx`',
      '`src/pages/Dashboard.jsx`, `src/pages/TaskList.jsx`',
    ],
    testPlan: [
      'Unit: `JiraIntegrationCard` states',
      '`cd server && npm test -- jiraConnect.test.js`',
      '`npm run test:coverage` for new component tests',
    ],
    api: {
      method: 'POST',
      path: '/api/auth/me/jira/connect',
      auth: 'Developer JWT',
      responses: '200 | 400 (no workspace / bad token) | 403',
    },
  },
  {
    tid: 'T152',
    type: 'AFK',
    sprint: 'S15',
    milestone: 'M9',
    layer: 'Backend',
    effort: 'M',
    assigned: 'Shared',
    planDependency: 'T151',
    title: 'Pass team jira_site_url to developer on join approval',
    labels: ['afk', 'backend', 'frontend', 'sprint-s15', 'milestone-m9'],
    blockedBy: null, // set after T151 created
    what: `When admin approves a join request, the developer should see the team Jira site hostname — no copy-paste from admin.

- Join approval response includes sanitized \`workspace.jira_site_url\`
- \`GET /api/auth/me\` returns \`expected_jira_site_url\` (or nested workspace host) for members
- Dashboard + Profile banner: *"Your team uses **yourteam.atlassian.net** — connect your Jira account."*
- \`WorkspaceJoin\` pending hint: *"After approval, connect Jira on Profile."*
- If admin has not connected team Jira: *"Admin hasn't connected team Jira yet"* (not 401)`,
    featureAC: [
      'Approved developer sees jira site hostname in UI within one page load',
      '`GET /api/auth/me` includes expected_jira_site_url for workspace members',
      'Join approval API response includes sanitized workspace with jira_site_url',
      'Missing admin Jira connect shows friendly message, not HTTP 401',
    ],
    hints: [
      '`server/controllers/joinRequest.js`, `server/controllers/auth.js`',
      '`src/stores/authStore.js`, `src/pages/Dashboard.jsx`',
      '`src/components/JiraIntegrationCard.jsx`',
    ],
    testPlan: [
      '`cd server && npm test -- joinRequests.test.js`',
      'Manual: approve developer → banner shows site host',
    ],
    api: {
      method: 'GET',
      path: '/api/auth/me',
      auth: 'JWT',
      responses: '200 includes expected_jira_site_url | 401',
    },
  },
  {
    tid: 'T153',
    type: 'AFK',
    sprint: 'S15',
    milestone: 'M9',
    layer: 'Frontend',
    effort: 'S',
    assigned: 'Shared',
    planDependency: 'T152',
    title: 'Developer UI copy — hide workspace Jira concept',
    labels: ['afk', 'frontend', 'sprint-s15', 'milestone-m9'],
    blockedBy: null,
    what: `Developer-facing UI should say "my Jira" + "team site" — never "workspace Jira".

- Replace strings: team Jira site / connect **your** Jira account
- \`JiraIntegrationCard\` helper: same email as Questly + team site host when known
- Soften sign-up \`JiraAuth\` overlay for developers without workspace
- Remove developer Profile line about Admin panel workspace Jira`,
    featureAC: [
      'Grep `src/` — no developer UI string says "workspace Jira"',
      'Admin `JiraSyncTab` unchanged (still says workspace for sync)',
      'Token connect placeholder references team site host when known',
    ],
    hints: [
      '`src/components/JiraIntegrationCard.jsx`',
      '`src/overlays/JiraAuth.jsx`',
      'Do not change `src/components/JiraSyncTab.jsx` admin copy',
    ],
    testPlan: ['`npx eslint src/components/JiraIntegrationCard.jsx`', 'Visual review on Profile + Dashboard'],
  },
  {
    tid: 'T154',
    type: 'AFK',
    sprint: 'S15',
    milestone: 'M9',
    layer: 'Backend',
    effort: 'M',
    assigned: 'Shared',
    planDependency: 'T152',
    title: 'Team site validation + readable Jira connect errors',
    labels: ['afk', 'backend', 'testing', 'sprint-s15', 'milestone-m9'],
    blockedBy: null,
    what: `Map Jira connect failures to actionable messages for developers.

- When developer has workspace_id, connect uses workspace jira_site_url
- Wrong site / no Jira invite → 400: *"Ask your Jira admin to invite you to {host}"*
- Jira 401 → mention email match + API token (not generic HTTP 401)
- Join approval still succeeds when assignee lookup fails`,
    featureAC: [
      'Valid token on wrong Atlassian site → 400 with site_not_accessible style message',
      'Jira 401 → user-friendly message (email + invite)',
      'Integration test: nock `/myself` 401 → readable error body',
      'Join approval succeeds when Jira lookup fails',
    ],
    hints: [
      '`server/controllers/auth.js`',
      '`server/services/jiraClient.js`',
      '`server/controllers/joinRequest.js`',
    ],
    testPlan: [
      '`cd server && npm test -- jiraConnect.test.js`',
      'Add case in `server/tests/jiraNock.test.js`',
    ],
    api: {
      method: 'POST',
      path: '/api/auth/me/jira/connect',
      auth: 'Developer JWT',
      responses: '200 | 400 (readable errors) | 502',
    },
  },
  {
    tid: 'T155',
    type: 'AFK',
    sprint: 'S15',
    milestone: 'M9',
    layer: 'Testing',
    effort: 'M',
    assigned: 'Shared',
    planDependency: 'T154',
    title: 'E2E developer onboarding with team site banner',
    labels: ['afk', 'testing', 'sprint-s15', 'milestone-m9'],
    blockedBy: null,
    what: `Update E2E to cover the simplified developer Jira onboarding path (Yarden flow).

1. Developer signup → no workspace → join empty state
2. Submit join code → pending
3. Admin approves (seed/API)
4. Developer refresh → team site banner visible
5. Connect Jira (test token / seed)
6. Tasks visible after admin sync`,
    featureAC: [
      'CI E2E passes with workspace Jira seeded via admin API (no platform JIRA_*)',
      'Assert banner text contains workspace site hostname',
      'No regression on existing journey specs',
    ],
    hints: [
      'Update `e2e/journey-1.spec.js` or add `e2e/journey-1b.spec.js`',
      'Reuse `POST /api/e2e/seed/*` patterns',
    ],
    testPlan: ['`npx playwright test e2e/journey-1.spec.js`', 'Full `npx playwright test` in CI'],
  },
  {
    tid: 'T156',
    type: 'HITL',
    sprint: 'S16',
    milestone: 'M9',
    layer: 'Backend',
    effort: 'L',
    assigned: 'Shared',
    planDependency: 'T155',
    title: 'Admin OAuth for workspace Jira sync',
    labels: ['hitl', 'backend', 'frontend', 'sprint-s16', 'milestone-m9'],
    blockedBy: null,
    what: `Admin workspace connect via Atlassian OAuth 3LO (parallel to API token in JiraSyncTab).

- OAuth start/callback for workspace (store refresh token if needed)
- Sync works with OAuth-derived access token
- **HITL:** register callback in Atlassian Developer Console`,
    featureAC: [
      'Admin can connect workspace via OAuth OR API token',
      'Sync works with OAuth-derived access token',
      'Callback URL documented in DEPLOY.md',
      'No plaintext refresh token in API responses',
    ],
    hints: [
      'Mirror `server/controllers/jiraOAuth.js` for workspace scope',
      'Callback: `https://questly-production-f5ba.up.railway.app/api/workspaces/jira/oauth/callback`',
      '`src/components/JiraSyncTab.jsx`',
    ],
    testPlan: [
      '`cd server && npm test -- jiraOAuth.test.js`',
      'Manual HITL: admin OAuth connect on Railway preview',
    ],
  },
  {
    tid: 'T157',
    type: 'AFK',
    sprint: 'S16',
    milestone: 'M9',
    layer: 'Frontend',
    effort: 'M',
    assigned: 'Shared',
    planDependency: 'T152',
    title: 'Join lookup shows team Jira site + access check',
    labels: ['afk', 'frontend', 'backend', 'sprint-s16', 'milestone-m9'],
    blockedBy: null,
    what: `Embed team Jira site earlier in the join flow and validate site access on connect.

- Workspace code lookup returns public-safe \`jira_site_url\` host
- Join UI shows workspace name + Jira host after code lookup
- Manual token connect verifies site access (reuse OAuth siteUrlInResources pattern)`,
    featureAC: [
      'Workspace code lookup returns jira_site_url host (no secrets)',
      'Developer connect rejects wrong-site tokens before save',
      'Join page shows team site before admin approval',
    ],
    hints: [
      '`src/pages/WorkspaceJoin.jsx`',
      '`server/controllers/workspace.js` lookup endpoint',
      '`server/controllers/jiraOAuth.js` — siteUrlInResources',
    ],
    testPlan: [
      '`cd server && npm test -- workspaces.test.js`',
      'E2E: join flow shows site host after code entry',
    ],
  },
  {
    tid: 'T158',
    type: 'HITL',
    sprint: 'S16',
    milestone: 'M9',
    layer: 'Documentation',
    effort: 'M',
    assigned: 'Shared',
    planDependency: 'T156',
    title: 'Single developer connect path + Atlassian distribution docs',
    labels: ['hitl', 'frontend', 'documentation', 'sprint-s16', 'milestone-m9'],
    blockedBy: null,
    what: `One developer connect UX: OAuth primary, API token under Advanced.

- Profile: OAuth button primary; token form collapsed
- **HITL:** Document Atlassian app Distribution / test users so non-owner developers can OAuth
- When oauthStatus.available === false, show token form only`,
    featureAC: [
      'DEPLOY.md section: Atlassian OAuth distribution + test users',
      'OAuth works for non-owner developer after distribution OR test-user add',
      'Token fallback always available',
    ],
    hints: [
      '`src/components/JiraIntegrationCard.jsx`',
      '`DEPLOY.md`',
      'Atlassian Developer Console → Distribution',
    ],
    testPlan: [
      'Manual: yardenbiton1881@gmail.com OAuth after test-user add',
      'Manual: token fallback when ATLASSIAN_* unset',
    ],
  },
  {
    tid: 'T159',
    type: 'AFK',
    sprint: 'S16',
    milestone: 'M9',
    layer: 'Backend',
    effort: 'M',
    assigned: 'Shared',
    planDependency: '—',
    title: 'Encrypt Jira tokens at rest',
    labels: ['afk', 'backend', 'sprint-s16', 'milestone-m9'],
    blockedBy: null,
    what: `Encrypt workspace and user Jira tokens in Postgres.

- \`JIRA_TOKEN_ENCRYPTION_KEY\` env var
- Encrypt workspaces.jira_access_token, users.jira_access_token, users.jira_refresh_token
- Plaintext read-through on first use; re-save encrypted on next connect`,
    featureAC: [
      'DB columns hold ciphertext after connect/sync',
      'API never returns tokens',
      'Sync + connect work after encrypt round-trip',
      '`.env.example` documents JIRA_TOKEN_ENCRYPTION_KEY',
    ],
    hints: [
      'New `server/lib/tokenEncryption.js`',
      'Migration optional — encrypt on write',
      'Railway: set JIRA_TOKEN_ENCRYPTION_KEY in production',
    ],
    testPlan: [
      'Unit tests for encrypt/decrypt round-trip',
      '`cd server && npm test`',
    ],
  },
]

function gh(cmd) {
  return execSync(`gh ${cmd}`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 })
}

function buildBody(task, blockedByLine) {
  const lines = [
    `**Type:** ${task.type}`,
    '',
    '## Sprint / Milestone',
    '',
    '| Field | Value |',
    '|-------|-------|',
    `| Task ID | ${task.tid} |`,
    `| Sprint | ${task.sprint} |`,
    `| Milestone | ${task.milestone} |`,
    `| Layer | ${task.layer} |`,
    `| Effort | ${task.effort} |`,
    `| Assigned | ${task.assigned} |`,
    `| Plan dependency | ${task.planDependency} |`,
    '',
    '## What to build',
    '',
    task.what,
    '',
    '## Feature-specific acceptance criteria',
    '',
    ...task.featureAC.map((l) => `- [ ] ${l}`),
  ]

  if (task.api) {
    lines.push(
      '',
      '## API contract',
      '',
      '| Field | Value |',
      '|-------|-------|',
      `| Method | \`${task.api.method}\` |`,
      `| Path | \`${task.api.path}\` |`,
      `| Auth | ${task.api.auth} |`,
      `| Responses | ${task.api.responses} |`,
    )
  }

  lines.push(
    '',
    '## Implementation hints',
    '',
    ...task.hints.map((l) => `- ${l}`),
    '',
    '## Test plan',
    '',
    ...task.testPlan.map((l) => `- ${l}`),
    '',
    '## Acceptance criteria',
    '',
    '- [ ] Implementation matches the task description end-to-end',
    `- [ ] Relevant tests pass for layer **${task.layer}** (unit / integration / E2E as applicable)`,
    '- [ ] CI checks remain green',
  )

  if (blockedByLine) {
    lines.push('', '## Blocked by', '', blockedByLine)
  }

  lines.push('', '---', '', `Parent epic: #${EPIC} · See \`docs/S15-JIRA-DEVELOPER-UX.md\``)

  return lines.join('\n')
}

function closeSuperseded() {
  for (const { number, reason } of SUPERSEDED) {
    const comment = `Closing as **superseded** by developer Jira UX sprint replan (docs/S15-JIRA-DEVELOPER-UX.md).\n\n${reason}\n\nTrack work under new **T151–T159** issues and epic #${EPIC}.`
    if (DRY_RUN) {
      console.log(`[dry-run] Would close #${number}: ${reason}`)
      continue
    }
    try {
      gh(`issue close ${number} --repo ${REPO} --comment "${comment.replace(/"/g, '\\"')}"`)
      console.log(`Closed #${number}`)
    } catch (e) {
      console.warn(`Could not close #${number}: ${e.message}`)
    }
  }
}

function createIssues() {
  const created = {}

  for (const task of TASKS) {
    const depTid = task.planDependency !== '—' ? task.planDependency : null
    let blockedByLine = null
    if (depTid && created[depTid]) {
      blockedByLine = `- #${created[depTid]} (${depTid})`
    } else if (task.blockedBy) {
      blockedByLine = task.blockedBy
    }

    const body = buildBody(task, blockedByLine)
    const labelArgs = task.labels.map((l) => `--label "${l}"`).join(' ')

    if (DRY_RUN) {
      console.log(`\n[dry-run] ${task.tid}: ${task.title}`)
      console.log(body.slice(0, 400) + '...')
      created[task.tid] = 999
      continue
    }

    const tmp = join(tmpdir(), `issue-${task.tid}.md`)
    writeFileSync(tmp, body)
    try {
      const out = gh(
        `issue create --repo ${REPO} --title "${task.tid} — ${task.title}" --body-file "${tmp}" ${labelArgs}`,
      )
      const match = out.match(/issues\/(\d+)/)
      const num = match ? Number(match[1]) : null
      if (num) {
        created[task.tid] = num
        console.log(`Created #${num} ${task.tid}`)
      } else {
        console.log(out)
      }
    } finally {
      unlinkSync(tmp)
    }
  }

  return created
}

function updateEpic(created) {
  const s15Rows = [
    ['T151', 'Pre-workspace empty states + friendly Jira gating'],
    ['T152', 'Pass team jira_site_url on join approval'],
    ['T153', 'Developer UI copy — hide workspace Jira'],
    ['T154', 'Team site validation + readable connect errors'],
    ['T155', 'E2E developer onboarding with team site banner'],
  ]
    .map(([t, focus]) => `| ${t} | #${created[t]} | ${focus} |`)
    .join('\n')

  const body = `## Problem

Questly is multi-tenant on one Railway deploy. **S14 (done)** fixed data isolation and workspace-scoped sync. Developers still face a confusing two-Jira onboarding (workspace vs personal) and 401 errors before joining a team.

## Goal

**One mental model for developers:** connect *my* Jira → join a team → get work. Admin workspace sync stays admin-only.

---

## Sprint breakdown (child issues)

### Sprint S14 — P0 Data integrity ✅ *merged*

| Task | Issue | Focus |
|------|-------|-------|
| T148 | #182 | Scoped task upsert |
| T149 | #180 | Require workspace Jira for sync |
| T150 | #181 | Workspace-scoped assignee on join |

### Sprint S15 — P1 Developer Jira UX *(next)*

| Task | Issue | Focus |
|------|-------|-------|
${s15Rows}

See \`docs/S15-JIRA-DEVELOPER-UX.md\` for full AC.

**S15 exit criteria:** Yarden flow works — approve → see team site → token connect → tasks.

### Sprint S16 — P2 OAuth polish + security

| Task | Issue | Focus |
|------|-------|-------|
| T156 | #${created.T156} | Admin workspace OAuth sync |
| T157 | #${created.T157} | Join flow embeds Jira site |
| T158 | #${created.T158} | Developer OAuth distribution docs |
| T159 | #${created.T159} | Encrypt tokens at rest |

**Deferred (closed #183–#188):** multi-workspace switcher, memberships spike, standalone regression epic — revisit after S15.

---

## Credential model

| Scope | Stored where | Used for |
|-------|--------------|----------|
| Workspace admin Jira | \`workspaces.jira_*\` | Task sync, assignee lookup |
| Developer identity | \`users.jira_account_id\` + tokens | Assignee mapping |
| Platform | \`ATLASSIAN_CLIENT_ID/SECRET\` only | OAuth 3LO |

## Production URLs

- Frontend: https://questly-gilt.vercel.app
- API: https://questly-production-f5ba.up.railway.app
`

  if (DRY_RUN) {
    console.log('\n[dry-run] Epic #179 update preview:\n', body.slice(0, 500))
    return
  }

  const tmp = join(tmpdir(), 'epic-179.md')
  writeFileSync(tmp, body)
  try {
    gh(`issue edit ${EPIC} --repo ${REPO} --body-file "${tmp}"`)
    console.log(`Updated epic #${EPIC}`)
  } finally {
    unlinkSync(tmp)
  }
}

closeSuperseded()
const created = createIssues()
updateEpic(created)

if (!DRY_RUN) {
  console.log('\nCreated issues:', created)
}
