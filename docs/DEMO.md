# Questly Demo Walkthrough

Estimated total: **~17 minutes** for the introduction and five E2E journeys.

## Introduction — Problem, architecture, Jira connection (~2 min)

1. Show the [presentation overview](./PROJECT-OVERVIEW.md) and state the ownership rule: Jira owns issues; Questly owns completion and rewards.
2. Sign in as an admin and open **Admin → Jira**.
3. Start OAuth, select an auto-discovered Jira site and project, then confirm the connection.
4. Run one sync and open the resulting quests.

**Talking points:** Questly is a motivation layer rather than a Jira replacement; credentials are workspace-scoped and encrypted; story points determine quest difficulty and XP.

**Expected UI:** Connected Jira site/project, successful sync summary, and imported quests.

## Journey 1 — Join, complete task, XP (~3 min)

**Talking points:** Developer onboarding, workspace join flow, quest completion, dashboard stats.

1. Developer signs up → skip Jira connect modal.
2. Join workspace via code (or pre-seeded in E2E).
3. Open **Task List** → complete a quest → **Mark complete**.
4. **Dashboard** shows completed count and XP progress.

**Expected UI:** Task card with difficulty badge; dashboard stat bar updates.

## Journey 2 — Earn XP, purchase reward (~3 min)

1. Complete a quest to earn XP, season score, and coins.
2. Open **Reward Shop** → **Buy** (spend coins) → confirm purchase.
3. **Profile → My Rewards** shows coupon with expiry date.

**Expected UI:** Purchase confirmation; masked coupon code with reveal.

## Journey 3 — Expiry warning, delete coupon (~2 min)

1. Purchase reward with coupon expiring within 30 days.
2. **My Rewards** shows **Expiring soon** badge.
3. **Remove from My Rewards** → **Confirm remove** → coupon gone.

**Expected UI:** Amber “Expiring soon” pill; empty state after delete.

## Journey 4 — Sprint lifecycle (~4 min)

1. **Admin → Sprints** → create sprint (name + dates).
2. Developer completes task (sprint XP increases on Profile).
3. Admin **Close Sprint** → confirm.
4. Developer Profile **Sprint XP** shows **0 XP** (lifetime XP unchanged).

**Expected UI:** Active sprint widget; red close confirmation.

## Journey 5 — Assignee sync (~3 min)

1. Task exists without assignment (developer task list empty).
2. Simulated sync assigns developer (E2E seed / Jira sync).
3. Task appears; developer completes it.
4. Assignee removed on sync — completed task still visible.

**Expected UI:** Task list before/after assignment; completion badge persists.

## Recording tips

- Use 1280×720 viewport; hide OS notifications.
- Pre-create admin workspace or use fresh E2E seed emails.
- For live Jira demo, connect workspace in Admin → Jira first.
- Keep the production URLs and backup screenshots ready in case Jira or hosting is temporarily unavailable.
- End with the repository metrics from `PROJECT-OVERVIEW.md`; describe test-file counts as evidence, not as test-case counts.
