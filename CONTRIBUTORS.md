# Contributors

Questly is a two-person final-year Information Systems capstone. We worked as a
pair: most features were designed together, and we split primary ownership by
area to move in parallel. Commit authorship reflects where work landed; many
commits are co-authored via `Co-authored-by:` trailers to reflect pairing.

## Team

| Contributor | GitHub | Primary area |
|-------------|--------|--------------|
| Yarden (Jordan) Biton | [@Jordan1881](https://github.com/Jordan1881) | Backend, database, security, Jira integration, testing & CI/CD |
| Or Moskowitz | [@ormosko28](https://github.com/ormosko28) | Frontend, UI/UX, design system, client state & animation |

## Ownership by module (primary owner)

### Or Moskowitz — Frontend lead
- `src/pages/` — route-level screens (Dashboard, Task List, Reward Shop, Profile, Workspace, Auth, legal pages)
- `src/components/` and `src/components/layout/` — shared UI (TaskCard, Sidebar, FilterBar, badges, tabs)
- `src/design-system/` — Button/FormButton/JiraButton, tokens, motion config
- `src/components/motion/` + GSAP setup (`useQuestlyMotion`, animated hero/modal/reveal)
- `src/overlays/` — app-level modals (SessionExpired, LevelUp, PurchaseConfirm, JiraAuth)
- UI-facing state in `src/stores/` and view helpers in `src/lib/` (xpLevel, coupon, displayUser)

### Yarden (Jordan) Biton — Backend lead
- `server/controllers/`, `server/routes/`, `server/services/` — API + business logic
- `server/models/`, `server/migrations/` — data-access layer and PostgreSQL schema
- `server/middleware/`, `server/lib/` — auth, validation, logging, pagination, token encryption
- Jira sync + Atlassian OAuth (`server/services/jira*`, `server/controllers/jiraOAuth.js`)
- Test suites (`server/tests/`, `src/tests/`, `e2e/`) and GitHub Actions CI/CD

## Shared / paired work
Architecture decisions, the XP/rewards economy model, the data model, API contract,
end-to-end user journeys, and code review were done together. Where one of us
implemented on the other's area (e.g. wiring a page to a new endpoint), the change
was reviewed by the area owner before merge.
