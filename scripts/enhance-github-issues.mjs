#!/usr/bin/env node
/**
 * Enhance open Questly GitHub issues with feature-specific acceptance criteria.
 * Preserves: Type, Sprint/Milestone table, What to build, Blocked by.
 *
 * Usage:
 *   node scripts/enhance-github-issues.mjs --dry-run
 *   node scripts/enhance-github-issues.mjs --apply
 *   node scripts/enhance-github-issues.mjs --apply --setup-labels-milestones
 */

import { execSync } from 'node:child_process'
import { writeFileSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { getEnrichment, MILESTONE_DESCRIPTIONS } from './issue-enrichments.mjs'

const REPO = 'Jordan1881/Questly'
const DRY_RUN = process.argv.includes('--dry-run')
const APPLY = process.argv.includes('--apply')
const SETUP = process.argv.includes('--setup-labels-milestones')

if (!DRY_RUN && !APPLY) {
  console.error('Pass --dry-run or --apply')
  process.exit(1)
}

function gh(cmd) {
  return execSync(`gh ${cmd}`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 })
}

function parseIssueBody(body) {
  const typeMatch = body.match(/^\*\*Type:\*\*\s*(\S+)/m)
  const sprintSection = body.match(/## Sprint \/ Milestone\n\n([\s\S]*?)\n\n## What to build/)?.[1]
  const what = body.match(/## What to build\n\n([\s\S]*?)\n\n##/)?.[1]?.trim()
  const blockedBy = body.match(/## Blocked by\n\n([\s\S]*)$/)?.[1]?.trim()

  const tid = sprintSection?.match(/\| Task ID \| (T\d+) \|/)?.[1]
  const layer = sprintSection?.match(/\| Layer \| ([^|]+) \|/)?.[1]?.trim()
  const sprint = sprintSection?.match(/\| Sprint \| (S\d+) \|/)?.[1]
  const milestone = sprintSection?.match(/\| Milestone \| (M\d+) \|/)?.[1]

  return { typeMatch, sprintSection, what, blockedBy, tid, layer, sprint, milestone }
}

function buildEnhancedBody(original, meta) {
  const { typeMatch, sprintSection, what, blockedBy } = parseIssueBody(original)
  const type = typeMatch?.[1] ?? 'AFK'
  const enrichment = getEnrichment(meta)

  const sections = [
    `**Type:** ${type}`,
    '',
    '## Sprint / Milestone',
    '',
    sprintSection,
    '',
    '## What to build',
    '',
    what,
    '',
    '## Feature-specific acceptance criteria',
    '',
    ...enrichment.featureAC.map((line) => `- [ ] ${line}`),
  ]

  if (enrichment.api) {
    sections.push(
      '',
      '## API contract',
      '',
      `| Field | Value |`,
      `|-------|-------|`,
      `| Method | \`${enrichment.api.method}\` |`,
      `| Path | \`${enrichment.api.path}\` |`,
      `| Auth | ${enrichment.api.auth} |`,
      `| Responses | ${enrichment.api.responses} |`,
    )
  }

  sections.push(
    '',
    '## Implementation hints',
    '',
    ...enrichment.hints.map((line) => `- ${line}`),
    '',
    '## Test plan',
    '',
    ...enrichment.testPlan.map((line) => `- ${line}`),
    '',
    '## Acceptance criteria',
    '',
    '- [ ] Implementation matches the task description end-to-end',
    `- [ ] Relevant tests pass for layer **${meta.layer}** (unit / integration / E2E as applicable)`,
    '- [ ] CI checks remain green',
  )

  if (blockedBy) {
    sections.push('', '## Blocked by', '', blockedBy)
  }

  return sections.join('\n')
}

function alreadyEnhanced(body) {
  return body.includes('## Feature-specific acceptance criteria')
}

function setupLabels() {
  const labels = [
    ['backend', '1d76db', 'Server routes, models, services'],
    ['frontend', '0e8a16', 'React pages, components, stores'],
    ['testing', 'fbca04', 'Unit, integration, E2E tests'],
    ['documentation', '0075ca', 'Docs, diagrams, write-ups'],
    ['devops', '5319e7', 'CI/CD and deployment'],
    ['hitl', 'd4c5f9', 'Human-in-the-loop task'],
    ['afk', 'c5def5', 'Agent-friendly implementation task'],
    ['sprint-s06', 'ededed', 'Sprint S06'],
    ['sprint-s07', 'ededed', 'Sprint S07'],
    ['sprint-s08', 'ededed', 'Sprint S08'],
    ['sprint-s09', 'ededed', 'Sprint S09'],
    ['sprint-s10', 'ededed', 'Sprint S10'],
    ['sprint-s11', 'ededed', 'Sprint S11'],
    ['sprint-s12', 'ededed', 'Sprint S12'],
    ['sprint-s13', 'ededed', 'Sprint S13'],
    ['milestone-m5', '1d76db', 'M5 — XP & Sprints'],
    ['milestone-m6', '0e8a16', 'M6 — Rewards'],
    ['milestone-m7', '5319e7', 'M7 — Live API'],
    ['milestone-m8', 'b60205', 'M8 — E2E & Submission'],
  ]

  for (const [name, color, desc] of labels) {
    try {
      gh(`label create "${name}" --color "${color}" --description "${desc}" --repo ${REPO}`)
      console.log(`Created label: ${name}`)
    } catch {
      console.log(`Label exists: ${name}`)
    }
  }
}

function setupMilestones() {
  const existing = JSON.parse(gh(`api repos/${REPO}/milestones --paginate`))
  const byTitle = Object.fromEntries(existing.map((m) => [m.title, m]))

  for (const [key, desc] of Object.entries(MILESTONE_DESCRIPTIONS)) {
    const title = key
    if (byTitle[title]) {
      console.log(`Milestone exists: ${title}`)
      continue
    }
    gh(
      `api repos/${REPO}/milestones -f title="${title}" -f description="${desc}" -f state=open`,
    )
    console.log(`Created milestone: ${title}`)
  }
}

function labelsForMeta(meta) {
  const layerMap = {
    Backend: 'backend',
    Frontend: 'frontend',
    Testing: 'testing',
    Documentation: 'documentation',
    DevOps: 'devops',
  }
  const labels = []
  if (layerMap[meta.layer]) labels.push(layerMap[meta.layer])
  if (meta.sprint) labels.push(`sprint-${meta.sprint.toLowerCase()}`)
  if (meta.milestone) labels.push(`milestone-${meta.milestone.toLowerCase()}`)
  return labels
}

function main() {
  if (SETUP && APPLY) {
    setupLabels()
    setupMilestones()
  }

  const issues = JSON.parse(
    gh(`issue list --repo ${REPO} --state open --limit 200 --json number,title,body`),
  )

  issues.sort((a, b) => a.number - b.number)
  let updated = 0
  let skipped = 0

  for (const issue of issues) {
    const meta = parseIssueBody(issue.body)
    if (!meta.tid || !meta.what) {
      console.warn(`Skip #${issue.number}: could not parse metadata`)
      skipped++
      continue
    }

    if (alreadyEnhanced(issue.body)) {
      console.log(`Skip #${issue.number} (${meta.tid}): already enhanced`)
      skipped++
      continue
    }

    const newBody = buildEnhancedBody(issue.body, meta)

    if (DRY_RUN) {
      console.log(`\n--- #${issue.number} ${meta.tid} (${meta.sprint}/${meta.milestone}) ---`)
      console.log(newBody.slice(0, 600) + '...\n')
      updated++
      continue
    }

    const tmp = join(tmpdir(), `issue-${issue.number}.md`)
    writeFileSync(tmp, newBody)

    try {
      gh(`issue edit ${issue.number} --repo ${REPO} --body-file "${tmp}"`)
      const labelArgs = labelsForMeta(meta)
        .map((l) => `--add-label "${l}"`)
        .join(' ')
      if (labelArgs) {
        try {
          gh(`issue edit ${issue.number} --repo ${REPO} ${labelArgs}`)
        } catch (e) {
          console.warn(`Labels partial for #${issue.number}: ${e.message}`)
        }
      }
      if (meta.milestone) {
        try {
          gh(`issue edit ${issue.number} --repo ${REPO} --milestone "${meta.milestone}"`)
        } catch (e) {
          console.warn(`Milestone for #${issue.number}: ${e.message}`)
        }
      }
      console.log(`Updated #${issue.number} (${meta.tid})`)
      updated++
    } finally {
      unlinkSync(tmp)
    }
  }

  console.log(`\nDone: ${updated} ${DRY_RUN ? 'previewed' : 'updated'}, ${skipped} skipped`)
}

main()
