# Performance, Scalability & Reliability

This document records how Questly performs, where the bottlenecks are, and how we
would scale it. It is intentionally honest about current limits and planned work.

## How we measure

Every request is logged by `pino-http` with a `responseTime` (ms) and an
`X-Request-Id` (see [`server/app.js`](../server/app.js)). This is our built-in,
always-on latency measurement — no extra tooling required. In development the
logs read like:

```
GET /api/users/me/dashboard 200 7.3 ms
POST /api/auth/login 200 233 ms
POST /api/workspaces 201 13.7 ms
```

Representative timings against local PostgreSQL 15 (single node, warm pool):

| Endpoint | Typical latency | Notes |
|----------|-----------------|-------|
| `GET /api/health` | < 1 ms | no I/O |
| `GET /api/health/ready` | 1–3 ms | one `SELECT 1` |
| `GET /api/users/me/dashboard` | 5–10 ms | few indexed reads |
| `GET /api/tasks` | 5–15 ms | single indexed join |
| `POST /api/auth/login` | ~230 ms | dominated by bcrypt (12 rounds) — intentional |
| `POST /api/tasks/sync/:id` | 100 ms–seconds | bounded by Jira's API, not us |

`bcrypt` cost is deliberate: login latency is a security feature, not a bug.

## Bottlenecks (ranked)

1. **Jira sync** — the slowest path. It is network-bound on Atlassian and does
   per-issue upserts. Hardened with a hard request timeout + retry/backoff and
   full pagination ([`server/services/jiraClient.js`](../server/services/jiraClient.js)),
   and story-points field discovery is cached
   ([`server/lib/cache.js`](../server/lib/cache.js)). It is admin-triggered and
   infrequent, so it does not affect the developer hot path.
2. **`bcrypt` on auth** — CPU-bound and intentional; only on login/register.
3. **Unbounded list endpoints** — mitigated: list endpoints now accept
   `limit`/`offset` with `X-Total-Count` ([`server/lib/pagination.js`](../server/lib/pagination.js)),
   and the hottest filter columns are indexed
   ([`server/migrations/20260719000001_add_secondary_indexes.js`](../server/migrations/20260719000001_add_secondary_indexes.js)).

## What happens at 10x users

- **Reads** scale well: queries are indexed, workspace-scoped, and paginated.
  Postgres on a modest instance handles this comfortably; the connection pool is
  `{ min: 2, max: 10 }` ([`server/knexfile.js`](../server/knexfile.js)).
- **Writes** (task completion, purchases) are already transactional and use row
  locks (`FOR UPDATE`, `SKIP LOCKED`) and atomic conditional updates, so they stay
  correct under concurrency ([`server/services/rewardPurchase.js`](../server/services/rewardPurchase.js),
  [`server/models/taskAssignment.js`](../server/models/taskAssignment.js)).
- **Jira sync** at 10x workspaces would need a queue (below).

## What scales vs. what needs redesign

| Component | Scales as-is | Needs work at scale |
|-----------|--------------|---------------------|
| Stateless Express API | Yes — horizontally (no in-process session state; JWT auth) | — |
| PostgreSQL reads | Yes — indexed + paginated | Read replicas for very high read volume |
| PostgreSQL writes | Yes — transactional | Partitioning `xp_transactions` if it grows huge |
| Jira sync | Fine for one workspace | Move to a background job queue (BullMQ/Redis) |
| In-memory cache | Fine on one node | Replace with Redis when running multiple nodes |

## Caching

- **What we cache:**
  - Jira story-points field discovery per site (rarely changes, costs an extra
    round-trip) — short TTL, in [`server/services/jiraClient.js`](../server/services/jiraClient.js).
  - Team leaderboard/standings per workspace — a few seconds of staleness on
    *other* members' standings is acceptable, so the dashboard doesn't recompute
    the team query on every load ([`server/controllers/users.js`](../server/controllers/users.js),
    `loadTeamStandings`). The caller's OWN balances are always read fresh, so a
    user never sees their own XP lag.
  - Both are disabled under test for deterministic assertions.
- **What we do NOT cache:** anything authoritative for the acting user (their own
  balances, XP, task state). Postgres remains the single source of truth; we cache
  only derived or expensive-to-fetch data where brief staleness is harmless.
- The cache is a small in-process TTL map with single-flight loading (no stampede).
  On multiple nodes we would swap it for Redis.

## Reliability & recovery

- **Transactions** wrap every multi-write operation, so a mid-operation failure
  rolls back cleanly with no partial XP/coin state (task completion, purchase,
  sprint close).
- **External failure isolation:** Jira calls have a timeout + bounded retries and
  map failures to `503`/`502` instead of hanging or 500-ing the whole request.
- **Readiness probe** (`GET /api/health/ready`) lets the platform avoid routing to
  an instance that cannot reach Postgres.
- **Structured logs** with request ids make production incidents traceable; secrets
  are redacted at the logger boundary.

## High availability — current state and plan

Current deployment is single-instance API (Railway) + managed PostgreSQL and a CDN
frontend (Vercel). To run at high availability we would:

1. Run 2+ stateless API replicas behind the load balancer (already stateless).
2. Use managed Postgres with a standby replica + automated failover.
3. Move Jira sync to a background worker + queue so a slow external API never
   consumes web dynos.
4. Replace the in-process cache and rate-limiter store with Redis so they are shared.
5. Add uptime/latency alerting on the `/api/health/ready` probe.

These are deliberate future-work items, not implemented in the capstone scope.
