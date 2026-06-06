/**
 * Per-task enrichment for GitHub issues #71–#154 (T064–T147).
 * Preserves Sprint/Milestone/What to build/Blocked by; adds feature-specific AC.
 */

const XP_MAP = 'Easy→20, Medium→40, Hard→70 (matches `XP_BY_DIFFICULTY` in `server/services/jiraClient.js`)'

/** @type {Record<string, { featureAC: string[], hints: string[], testPlan: string[], api?: object }>} */
export const ENRICHMENTS = {
  T064: {
    featureAC: [
      'Export `calculateXP(difficulty)` from a shared service (e.g. `server/services/xp.js`)',
      `Returns 20 / 40 / 70 for easy / medium / hard (case-insensitive)`,
      'Throws `TypeError` for unknown difficulty strings',
      'Reused by Jira sync when setting `tasks.xp_reward` from difficulty',
    ],
    hints: [
      'Align with existing `XP_BY_DIFFICULTY` constant in `server/services/jiraClient.js`',
      'Difficulty values stored lowercase in DB (`tasks.difficulty`)',
    ],
    testPlan: [
      'Add `server/tests/xp.test.js` with matrix for easy/medium/hard + unknown',
      'Run: `cd server && npm test -- xp.test.js`',
    ],
  },
  T066: {
    featureAC: [
      'Admin-only: `POST /api/workspaces/:id/sprints` with `{ name, startDate?, endDate? }`',
      'Creates sprint with `status: active` when workspace has no active sprint',
      'Returns **409** when unique index `sprints_workspace_active_idx` would be violated',
      'Returns **403** for non-admin; **404** for unknown workspace',
    ],
    hints: [
      'DB enforces one active sprint per workspace (`server/migrations/20260314000004_create_sprints.js`)',
      'Follow route patterns in `server/routes/workspaces.js`',
      'Add `server/models/sprint.js` + `server/controllers/sprints.js`',
    ],
    testPlan: [
      'Integration tests in `server/tests/sprints.test.js`',
      'Cover happy path + duplicate active sprint → 409',
    ],
    api: { method: 'POST', path: '/api/workspaces/:id/sprints', auth: 'Admin JWT', responses: '201 | 403 | 404 | 409' },
  },
  T067: {
    featureAC: [
      'Workspace members (admin + developers) can list sprints',
      'Sorted by `start_date` descending (nulls last)',
      'Response includes id, name, dates, status, closedAt',
    ],
    hints: ['`GET` route under workspaces router', 'Use `SprintModel.listByWorkspace(workspaceId)`'],
    testPlan: ['`server/tests/sprints.test.js` — verify sort order with seeded data'],
    api: { method: 'GET', path: '/api/workspaces/:id/sprints', auth: 'Member JWT', responses: '200 | 403 | 404' },
  },
  T068: {
    featureAC: [
      'Returns the single active sprint for workspace or `null` when none',
      'Includes days remaining computed from `end_date`',
      '404 only when workspace missing; 200 with `{ sprint: null }` when no active sprint',
    ],
    hints: ['Query `status = active` for workspace', 'Reuse sprint formatter from list endpoint'],
    testPlan: ['`server/tests/sprints.test.js` — active sprint present vs absent'],
    api: { method: 'GET', path: '/api/workspaces/:id/sprints/active', auth: 'Member JWT', responses: '200 | 403 | 404' },
  },
  T069: {
    featureAC: [
      'Admin updates `name`, `start_date`, and/or `end_date` (partial PATCH)',
      'Cannot change `status` via this endpoint',
      'Returns updated sprint object; 403 non-admin; 404 unknown sprint',
    ],
    hints: ['Route: `PATCH /api/sprints/:id` in new `server/routes/sprints.js`', 'Validate dates: end ≥ start'],
    testPlan: ['`server/tests/sprints.test.js` — partial update + forbidden fields'],
    api: { method: 'PATCH', path: '/api/sprints/:id', auth: 'Admin JWT', responses: '200 | 403 | 404' },
  },
  T070: {
    featureAC: [
      'Single DB transaction: mark sprint `completed`, set `closed_at`',
      'Reset `current_sprint_xp` to 0 for all workspace members',
      'Insert `xp_transactions` with `reason: sprint_reset` and negative amounts per member',
      'Idempotent guard: closing already-completed sprint → 409',
    ],
    hints: [
      'Follow ACID pattern from `server/services/taskRewards.js` (`applyCompletionChange`)',
      'Members = users where `workspace_id` matches sprint workspace',
    ],
    testPlan: [
      'Integration test in `server/tests/sprints.test.js`',
      'Assert XP fields zeroed and transaction rows written',
    ],
    api: { method: 'POST', path: '/api/sprints/:id/close', auth: 'Admin JWT', responses: '200 | 403 | 404 | 409' },
  },
  T071: {
    featureAC: [
      'Dashboard at `/dashboard` shows XP progress section using live or store data',
      'Active sprint card with name, dates, days remaining',
      'High-priority tasks list (from task store / API)',
      'Streak counter visible in stats area',
      'Layout matches existing design tokens in `src/pages/Dashboard.jsx`',
    ],
    hints: [
      'Extend `src/pages/Dashboard.jsx` (partial UI already exists)',
      'Wire to `useXpStore`, `useTaskStore`, `useSprintStore` when API lands (T118)',
    ],
    testPlan: ['Manual: load `/dashboard` after login', 'Later: covered by T118 live API wiring'],
  },
  T072: {
    featureAC: [
      'Extract `XPProgressBar` component from Dashboard',
      'Fill width from `xpLevelInfo(xp).percent` (`src/lib/xpLevel.js`, level size 1000)',
      'Shows current level label and XP-to-next-level',
      'Handles 0 XP without division errors',
    ],
    hints: [
      'Place in `src/components/XPProgressBar.jsx`',
      'Reuse `xpLevelInfo` — same math as `src/tests/lib/xpLevel.test.js`',
    ],
    testPlan: [
      'Add `src/tests/components/XPProgressBar.test.jsx`',
      'Run: `npm run test:coverage -- XPProgressBar`',
    ],
  },
  T073: {
    featureAC: [
      'Hook `useXP()` reads `current_sprint_xp`, `lifetime_xp`, `coin_balance` from `useXpStore`',
      'Exposes `refresh()` to re-fetch from `GET /api/auth/me`',
      'After task completion, store updates without full page reload',
    ],
    hints: [
      'Add `src/hooks/useXP.js`',
      'Completion flow in `useTaskStore` should call `useXpStore.setBalances`',
    ],
    testPlan: ['`src/tests/hooks/useXP.test.js` or extend `src/tests/stores/xpStore.test.js`'],
  },
  T074: {
    featureAC: [
      'Widget shows sprint name, start/end dates, computed days remaining',
      'Badge: Active (green) vs Completed (gray)',
      'Empty state when no active sprint',
    ],
    hints: ['Component: `src/components/SprintStatusWidget.jsx`', 'Days remaining = `end_date - today`, floor at 0'],
    testPlan: ['Component test with mock sprint objects'],
  },
  T075: {
    featureAC: [
      'Developer-only `GET /api/users/me/xp-history`',
      'Returns transactions: `amount`, `reason`, `taskId`, `createdAt`',
      'Sorted newest first; paginate optional (limit 50 default)',
    ],
    hints: ['Query `xp_transactions` where `user_id = req.user.id`', 'Register route in `server/routes/auth.js` or new users router'],
    testPlan: ['`server/tests/xpHistory.test.js` — after task completion, history contains row'],
    api: { method: 'GET', path: '/api/users/me/xp-history', auth: 'Developer JWT', responses: '200 | 401' },
  },
  T076: {
    featureAC: [
      'Single endpoint aggregates: XP balances, level, streak, active sprint summary',
      'Includes up to 5 high-priority incomplete tasks for caller',
      'Reduces Dashboard round-trips to one request',
    ],
    hints: [
      'Compose from user row + sprint query + task query',
      'Level from `Math.floor(lifetime_xp / 1000) + 1`',
    ],
    testPlan: ['`server/tests/dashboard.test.js` — seeded user with sprint + tasks'],
    api: { method: 'GET', path: '/api/users/me/dashboard', auth: 'Developer JWT', responses: '200 | 401' },
  },
  T077: {
    featureAC: [
      '`updateStreak(user, activityDate)` in `server/services/streak.js`',
      'If last activity was yesterday → increment `streak_count`',
      'If gap > 1 day → reset streak to 1',
      'Same-day repeat activity does not double-increment',
      'Called on task completion and purchase',
    ],
    hints: ['Store `last_activity_date` on `users` table (migration if missing)', 'Use UTC date comparison'],
    testPlan: ['Unit tests: yesterday / same day / 2-day gap / first activity'],
  },
  T078: {
    featureAC: [
      'Task checkbox calls `PATCH /api/tasks/:id/completion` with `{ completed: true }`',
      'On success: toast shows `+{xp} XP` from response balances',
      'Optimistic UI optional; rollback on error',
      'XP bar and coin balance update via xpStore',
    ],
    hints: [
      'Wire in `src/pages/TaskList.jsx` or TaskCard component',
      'API already exists: `server/routes/tasks.js`',
    ],
    testPlan: ['Manual on Task List; integration covered by T083'],
  },
  T079: {
    featureAC: [
      'Modal triggers when `lifetime_xp` crosses level threshold (1000 XP per level)',
      'Shows new level number and celebration copy',
      'Continue button dismisses; does not show twice for same level',
    ],
    hints: ['Overlay: `src/overlays/LevelUp.jsx`', 'Detect crossing in `useXP` or xpStore after completion'],
    testPlan: ['Component test: renders at level boundary'],
  },
  T080: {
    featureAC: [
      'Admin screen: create sprint form (name, start/end dates)',
      'Close Sprint button with confirmation dialog',
      'Lists existing sprints with status badges',
      'Route: `/admin/sprints` or tab in Admin page',
    ],
    hints: ['Extend `src/pages/Admin.jsx` or new page', 'Use `useSprintStore` actions'],
    testPlan: ['Manual admin flow; E2E in T133'],
  },
  T081: {
    featureAC: [
      'View lists XP transactions with signed amount (+ green / − red)',
      'Shows reason label and formatted date',
      'Empty state when no history',
    ],
    hints: ['Section in Dashboard or Profile', 'Fetch from T075 endpoint when wired'],
    testPlan: ['Component test with mock transaction array'],
  },
  T082: {
    featureAC: [
      'Tests `calculateXP` for easy→20, medium→40, hard→70',
      'Case-insensitive input accepted',
      'Unknown value throws `TypeError`',
    ],
    hints: ['Depends on T064 implementation'],
    testPlan: ['`server/tests/xp.test.js` — pure unit, no DB'],
  },
  T083: {
    featureAC: [
      'Complete assigned task → `current_sprint_xp` and `lifetime_xp` increase by `xp_reward`',
      '`xp_transactions` row with `reason: task_completed`',
      '`task_assignments.completed_at` set',
      'Response includes updated balances (existing `PATCH /api/tasks/:id/completion`)',
    ],
    hints: ['Uses `server/services/taskRewards.js`', 'Seed via factories in `server/tests/tasks.test.js`'],
    testPlan: ['Extend `server/tests/tasks.test.js` completion block'],
  },
  T084: {
    featureAC: [
      'Second `PATCH` completion on same assignment → **409**',
      'No duplicate XP transaction rows',
      'Balances unchanged after rejected second call',
    ],
    hints: ['Check `completed_at` before applying rewards'],
    testPlan: ['`server/tests/tasks.test.js` — double completion scenario'],
  },
  T085: {
    featureAC: [
      'Developer with no `task_assignments` row for task → **403**',
      'Error message indicates not assigned',
    ],
    hints: ['Existing guard in `updateCompletion` controller'],
    testPlan: ['`server/tests/tasks.test.js` — unassigned developer'],
  },
  T086: {
    featureAC: [
      'After `POST /api/sprints/:id/close`, all members have `current_sprint_xp = 0`',
      'Each member has `xp_transactions` with negative amount and `reason: sprint_reset`',
      'Sprint `status` is `completed`',
    ],
    hints: ['Seed workspace with 2+ developers with XP'],
    testPlan: ['`server/tests/sprints.test.js` close integration'],
  },
  T087: {
    featureAC: [
      'Creating second active sprint while one exists → **409**',
      'First sprint remains active',
    ],
    hints: ['Relies on DB unique partial index'],
    testPlan: ['`server/tests/sprints.test.js` duplicate create'],
  },
  T088: {
    featureAC: [
      'Admin `POST /api/workspaces/:id/rewards` with title, description, xpCost, imageUrl',
      'Creates `rewards` row scoped to workspace',
      'Validates xpCost > 0',
    ],
    hints: ['Table: `server/migrations/20260314000007_create_rewards.js`', 'Add `server/models/reward.js`'],
    testPlan: ['`server/tests/rewards.test.js` create'],
    api: { method: 'POST', path: '/api/workspaces/:id/rewards', auth: 'Admin JWT', responses: '201 | 403 | 404' },
  },
  T089: {
    featureAC: [
      'Members browse rewards with unredeemed coupon count as stock',
      'Excludes rewards where `is_available = false`',
      'Includes xpCost, title, description, imageUrl',
    ],
    hints: ['Join/count on `reward_coupons` where `redeemed_at IS NULL` and not expired'],
    testPlan: ['`server/tests/rewards.test.js` list with stock counts'],
    api: { method: 'GET', path: '/api/workspaces/:id/rewards', auth: 'Member JWT', responses: '200 | 403' },
  },
  T090: {
    featureAC: [
      'Admin PATCH title, description, xpCost, imageUrl (partial)',
      'Cannot PATCH workspace_id',
      '404 unknown reward; 403 non-admin of owning workspace',
    ],
    hints: ['`PATCH /api/rewards/:id`'],
    testPlan: ['`server/tests/rewards.test.js` update'],
    api: { method: 'PATCH', path: '/api/rewards/:id', auth: 'Admin JWT', responses: '200 | 403 | 404' },
  },
  T091: {
    featureAC: [
      'Hard delete only when no unredeemed coupons remain',
      'Returns **400** if active coupons exist',
      'Cascades or blocks per schema design',
    ],
    hints: ['Check coupon count before DELETE'],
    testPlan: ['`server/tests/rewards.test.js` delete blocked vs allowed'],
    api: { method: 'DELETE', path: '/api/rewards/:id', auth: 'Admin JWT', responses: '204 | 400 | 403 | 404' },
  },
  T092: {
    featureAC: [
      'Admin bulk-add coupon codes with optional `expiresAt` per code',
      'Default expiry: 1 year from today if omitted',
      'Duplicate codes in same reward → skip or 409 (document choice)',
    ],
    hints: ['Table: `reward_coupons` migration', 'Accept array or newline-separated codes'],
    testPlan: ['`server/tests/rewards.test.js` coupon upload'],
    api: { method: 'POST', path: '/api/rewards/:id/coupons', auth: 'Admin JWT', responses: '201 | 403 | 404' },
  },
  T093: {
    featureAC: [
      '`isExpired(expiresAt)` returns true for past dates',
      'Returns false for future dates',
      'Returns false for `null` / undefined (never expires)',
    ],
    hints: ['Add `server/services/coupon.js`', 'Compare date-only in UTC'],
    testPlan: ['`server/tests/coupon.test.js` unit matrix'],
  },
  T094: {
    featureAC: [
      'Single transaction: verify `current_sprint_xp >= xpCost`',
      'Lock first valid unredeemed non-expired coupon (`FOR UPDATE`)',
      'Deduct XP, create `purchases` row, mark coupon redeemed',
      'Write `xp_transactions` with negative amount',
      'Set `is_available=false` when no valid coupons remain',
      'Insufficient XP → **400**; no coupons → **400**',
    ],
    hints: [
      'Follow `taskRewards.js` transaction pattern',
      'Use `isExpired` from T093',
    ],
    testPlan: ['`server/tests/rewards.test.js` full purchase chain'],
    api: { method: 'POST', path: '/api/rewards/:id/purchase', auth: 'Developer JWT', responses: '201 | 400 | 403 | 404' },
  },
  T095: {
    featureAC: [
      'Reward Shop at `/rewards` shows grid of RewardCards',
      'Header displays current sprint XP balance',
      'Empty state when no rewards available',
    ],
    hints: ['Extend `src/pages/RewardShop.jsx`', 'Use workspace rewards from store/API'],
    testPlan: ['Component/snapshot test with mock rewards'],
  },
  T096: {
    featureAC: [
      'RewardCard shows title, description, XP cost badge, stock/availability',
      'Expired badge when all coupons expired',
      'Buy button enabled only when XP sufficient and stock > 0',
    ],
    hints: ['`src/components/RewardCard.jsx`'],
    testPlan: ['Storybook-style unit test with prop variants'],
  },
  T097: {
    featureAC: [
      'Buy disabled when `current_sprint_xp < xpCost`',
      "Tooltip or helper text: 'Not enough XP'",
      'No API call when disabled',
    ],
    hints: ['Derive `canAfford` in RewardCard or parent'],
    testPlan: ['Frontend test T113 overlaps — keep DRY'],
  },
  T098: {
    featureAC: [
      'Modal shows reward name, XP cost, current balance, remaining XP after purchase',
      'Confirm triggers purchase API; Cancel closes',
      'Loading state on confirm button',
    ],
    hints: ['`src/overlays/PurchaseConfirm.jsx` or modal in RewardShop'],
    testPlan: ['Component test: displays computed remaining XP'],
  },
  T099: {
    featureAC: [
      'Admin form: title, description, xpCost, image URL',
      'Coupon upload textarea (one code per line)',
      'Success/error feedback after submit',
    ],
    hints: ['Tab in Admin page or `/admin/rewards`'],
    testPlan: ['Manual admin flow'],
  },
  T100: {
    featureAC: [
      'Lists purchases for caller excluding `deleted_at IS NOT NULL`',
      'Includes coupon code, reward title, `expiresAt`',
      'Sorted by purchase date desc',
    ],
    hints: ['Join purchases → coupons → rewards'],
    testPlan: ['`server/tests/purchases.test.js` list'],
    api: { method: 'GET', path: '/api/users/me/purchases', auth: 'Developer JWT', responses: '200 | 401' },
  },
  T101: {
    featureAC: [
      'Sets `deleted_at` timestamp; row remains in DB',
      'Only owner can delete own purchase → else 403',
      '404 unknown purchase id',
    ],
    hints: ['Soft delete pattern — no hard DELETE'],
    testPlan: ['`server/tests/purchases.test.js` soft delete'],
    api: { method: 'DELETE', path: '/api/users/me/purchases/:id', auth: 'Developer JWT', responses: '200 | 403 | 404' },
  },
  T102: {
    featureAC: [
      'Returns username, avatarUrl, XP stats, streak, level, embedded purchases list',
      'Level derived from `lifetime_xp`',
      'Excludes soft-deleted purchases',
    ],
    hints: ['May extend existing `GET /api/auth/me` or separate `/users/me`'],
    testPlan: ['`server/tests/users.test.js` profile shape'],
    api: { method: 'GET', path: '/api/users/me', auth: 'JWT', responses: '200 | 401' },
  },
  T103: {
    featureAC: [
      'PATCH username and/or avatarUrl',
      'Validates username length/uniqueness',
      'Returns updated profile',
    ],
    hints: ['Partial update on users table'],
    testPlan: ['`server/tests/users.test.js` patch profile'],
    api: { method: 'PATCH', path: '/api/users/me', auth: 'JWT', responses: '200 | 400 | 401' },
  },
  T104: {
    featureAC: [
      'Profile shows avatar, username, XP, streak, level',
      'Coupon list using CouponCard components',
      'Edit profile affordance for username/avatar',
    ],
    hints: ['Extend `src/pages/Profile.jsx`'],
    testPlan: ['Manual + T121 API wiring'],
  },
  T105: {
    featureAC: [
      'Shows reward name, masked code (`****-1234`), reveal on click',
      'Expiry date formatted; delete button',
      'Expiry warning badge when within 30 days (T106)',
    ],
    hints: ['`src/components/CouponCard.jsx`'],
    testPlan: ['T114 frontend test'],
  },
  T106: {
    featureAC: [
      'Warning badge when `expiresAt` is within 30 days of today',
      'No badge for expired or null expiry',
      'Accessible label (e.g. "Expiring soon")',
    ],
    hints: ['Shared helper `isExpiringSoon(date)` in `src/lib/coupon.js`'],
    testPlan: ['Unit test date boundaries: 29d, 31d, past'],
  },
  T107: {
    featureAC: [
      'Delete → confirmation dialog → `DELETE /api/users/me/purchases/:id`',
      'Optimistic removal from list; rollback on error',
      'Toast on success',
    ],
    hints: ['Wire CouponCard delete to API in Profile/My Rewards'],
    testPlan: ['T114 frontend test'],
  },
  T108: {
    featureAC: [
      'Unit tests for `isExpired`: past → true, future → false, null → false',
    ],
    hints: ['Depends on T093'],
    testPlan: ['`server/tests/coupon.test.js`'],
  },
  T109: {
    featureAC: [
      'Happy-path purchase: XP deducted, coupon redeemed, purchase visible in GET purchases',
      'Balances in response match DB',
    ],
    hints: ['End-to-end through rewards controller'],
    testPlan: ['`server/tests/rewards.test.js` integration purchase'],
  },
  T110: {
    featureAC: [
      'Purchase when `current_sprint_xp < xpCost` → **400**',
      'No coupon consumed; balances unchanged',
    ],
    hints: ['Seed user with low XP'],
    testPlan: ['`server/tests/rewards.test.js` insufficient XP'],
  },
  T111: {
    featureAC: [
      'Purchase when all coupons expired → **400**',
      'Reward `is_available` set to false',
    ],
    hints: ['Seed expired coupons only'],
    testPlan: ['`server/tests/rewards.test.js` expired stock'],
  },
  T112: {
    featureAC: [
      'After soft delete: `deleted_at` set, row exists in DB',
      'GET purchases excludes deleted purchase',
    ],
    hints: ['Verify audit trail preserved'],
    testPlan: ['`server/tests/purchases.test.js`'],
  },
  T113: {
    featureAC: [
      'RewardShop: Buy disabled + message when XP too low',
      'Expired badge shown when reward has only expired coupons',
    ],
    hints: ['`src/tests/pages/RewardShop.test.jsx`'],
    testPlan: ['`npm run test:coverage -- RewardShop`'],
  },
  T114: {
    featureAC: [
      'MyRewards renders coupon list from props/store',
      'Delete button calls handler',
      'Expiry warning visible for soon-to-expire coupons',
    ],
    hints: ['Test Profile or dedicated MyRewards component'],
    testPlan: ['`src/tests/components/MyRewards.test.jsx`'],
  },
  T118: {
    featureAC: [
      'Dashboard fetches `GET /api/users/me/dashboard` on mount',
      'XP bar, sprint card, streak, high-priority tasks populated from response',
      'Loading skeleton while fetching; error toast on failure',
      'Remove hardcoded/mock data',
    ],
    hints: [
      'Update `src/pages/Dashboard.jsx` + `src/lib/api.js`',
      'Refresh after task completion via store invalidation',
    ],
    testPlan: ['Manual smoke; E2E Journey 1 (T130)'],
  },
  T119: {
    featureAC: [
      'RewardShop loads `GET /api/workspaces/:id/rewards`',
      'Purchase calls `POST /api/rewards/:id/purchase` with loading state',
      'XP balance refreshes after purchase',
    ],
    hints: ['`src/pages/RewardShop.jsx` + reward store actions'],
    testPlan: ['E2E Journey 2 (T131)'],
  },
  T120: {
    featureAC: [
      'Central API client maps 400/403/404/500 to user-visible toasts',
      'Reusable loading skeleton components for list pages',
      'Network errors show retry-friendly message',
    ],
    hints: [
      'Extend `src/lib/api.js` error interceptor',
      'Toast lib or simple banner component',
    ],
    testPlan: ['Unit test api client error mapping'],
  },
  T121: {
    featureAC: [
      'Profile uses GET/PATCH `/api/users/me` and purchases endpoints',
      'Delete purchase wired with optimistic UI',
      'Avatar/username edit persists',
    ],
    hints: ['`src/pages/Profile.jsx` + authStore refresh'],
    testPlan: ['E2E Journey 3 (T132)'],
  },
  T122: {
    featureAC: [
      'Sprint screen uses create, list, active, close API endpoints',
      'Form validation for dates',
      'Confirmation before close sprint',
    ],
    hints: ['`useSprintStore` actions calling new sprint routes'],
    testPlan: ['E2E Journey 4 (T133)'],
  },
  T123: {
    featureAC: [
      'Admin Jira connect uses `POST /api/workspaces/:id/jira/connect` (already implemented S04)',
      'Developer connect uses `POST /api/auth/me/jira/connect`',
      'Disconnect flows call DELETE endpoints',
      'UI reflects `jira_connected` from `GET /api/auth/me`',
    ],
    hints: [
      'Components exist: `JiraSyncTab.jsx`, `JiraIntegrationCard.jsx`',
      'Verify stores: `workspaceStore`, `authStore`',
    ],
    testPlan: ['Manual with `node scripts/test-jira-connection.cjs`'],
  },
  T124: {
    featureAC: [
      'Live member list from workspace API',
      'Join request approve/reject wired to existing join-request routes',
      'Real-time refresh after approval (refetch)',
    ],
    hints: ['`JoinRequestsTab.jsx` + workspace member endpoint'],
    testPlan: ['Manual admin workflow'],
  },
  T125: {
    featureAC: [
      'On 401 with expired JWT message, clear auth store and redirect to `/login`',
      'Optional modal: "Session expired" before redirect',
      'Prevent infinite retry loops on API client',
    ],
    hints: [
      'Check JWT exp in `src/lib/api.js` or parse 401 body',
      '`authStore.logout()` clears localStorage',
    ],
    testPlan: ['Unit test: expired token triggers logout'],
  },
  T126: {
    featureAC: [
      'XPProgressBar at 0, 500, 1000 XP shows correct percent and level',
      'Level label updates at boundaries',
    ],
    hints: ['Use `xpLevelInfo` expected values'],
    testPlan: ['`src/tests/components/XPProgressBar.test.jsx`'],
  },
  T127: {
    featureAC: [
      'TaskCard shows Easy/Medium/Hard badge via DifficultyBadge',
      'Checkbox calls `onComplete` callback with task id',
    ],
    hints: ['Extract TaskCard from TaskList if inline'],
    testPlan: ['`src/tests/components/TaskCard.test.jsx`'],
  },
  T128: {
    featureAC: [
      'useXP returns balances matching store seed',
      'After simulated completion, values increment correctly',
    ],
    hints: ['Mock API + store'],
    testPlan: ['`src/tests/hooks/useXP.test.js`'],
  },
  T129: {
    featureAC: [
      'FilterBar: All shows every task',
      'Completed shows only done tasks',
      'High Priority filters `highPriority === true`',
      'Difficulty filter combines with other filters (AND logic)',
    ],
    hints: ['Filter state in TaskList or taskStore'],
    testPlan: ['`src/tests/components/FilterBar.test.jsx`'],
  },
  T130: {
    featureAC: [
      'Playwright spec: developer signup → join workspace → connect Jira → sync → complete task',
      'Assert XP visible on Dashboard',
      'Use test Jira fixtures or nock-backed API',
    ],
    hints: [
      'Add `e2e/journey-1.spec.js`',
      'Follow patterns in `e2e/auth.spec.js`',
      'Requires Postgres + API + frontend per AGENTS.md',
    ],
    testPlan: ['`npx playwright test e2e/journey-1.spec.js`'],
  },
  T131: {
    featureAC: [
      'E2E: complete task for XP → browse shop → purchase → coupon in My Rewards',
      'Expiry date on coupon matches seeded coupon',
    ],
    hints: ['`e2e/journey-2.spec.js`', 'Seed reward + coupons via API'],
    testPlan: ['`npx playwright test e2e/journey-2.spec.js`'],
  },
  T132: {
    featureAC: [
      'E2E: purchase reward → expiry warning visible → delete coupon → absent from My Rewards',
    ],
    hints: ['`e2e/journey-3.spec.js`', 'Seed coupon expiring within 30 days'],
    testPlan: ['`npx playwright test e2e/journey-3.spec.js`'],
  },
  T133: {
    featureAC: [
      'E2E: admin creates sprint → developers earn XP → admin closes sprint',
      'All developer XP bars show 0 after close',
    ],
    hints: ['`e2e/journey-4.spec.js`'],
    testPlan: ['`npx playwright test e2e/journey-4.spec.js`'],
  },
  T134: {
    featureAC: [
      'E2E: add Jira assignee on issue → admin sync → TaskAssignment row exists',
      'Remove assignee → sync → uncompleted assignment removed; completed preserved',
    ],
    hints: [
      '`e2e/journey-5.spec.js`',
      'Requires Jira Cloud Agent secrets or nock mocks',
    ],
    testPlan: ['`npx playwright test e2e/journey-5.spec.js`'],
  },
  T135: {
    featureAC: [
      'Cross-workspace task access → 403',
      'Developer hitting admin-only sprint close → 403',
      'Task completion in wrong workspace → 403',
    ],
    hints: ['Extend `server/tests/security.test.js`'],
    testPlan: ['`cd server && npm test -- security.test.js`'],
  },
  T136: {
    featureAC: [
      'No JWT → 401 on protected routes',
      'Developer closes sprint → 403',
      'Tampered JWT signature → 401',
      'SQL injection in query params safely parameterized (no error leak)',
    ],
    hints: ['Use `verifyToken` middleware tests'],
    testPlan: ['`server/tests/security.test.js` + auth middleware tests'],
  },
  T137: {
    featureAC: [
      'Cover all 7 edge cases listed in task title',
      'Each scenario has isolated test with clear assertion',
      'Document expected status codes in test names',
    ],
    hints: [
      'Split across `server/tests/edgeCases.test.js`',
      'Cases: insufficient XP, expired coupons, double completion, no assignment, duplicate sprint, expired coupon purchase, completed assignment preservation on sync',
    ],
    testPlan: ['`cd server && npm test -- edgeCases.test.js`'],
  },
  T138: {
    featureAC: [
      'Seed 100+ Jira issues with 10+ assignees each (nock)',
      'Sync endpoint completes in < 3s (wall clock in test)',
      'No timeout or partial sync',
    ],
    hints: ['`server/tests/jiraSync.performance.test.js`', 'Use `server/tests/helpers/jiraNock.js`'],
    testPlan: ['Run with `npm test -- performance` (may tag `@performance`)'],
  },
  T139: {
    featureAC: [
      '10 parallel `PATCH /api/tasks/:id/completion` on different tasks',
      'All succeed; sum of XP matches expected; no negative balances',
      'All transactions committed (no partial state)',
    ],
    hints: ['Use `Promise.all` in integration test'],
    testPlan: ['`server/tests/concurrency.test.js`'],
  },
  T140: {
    featureAC: [
      '5 parallel purchases for last coupon: exactly 1 returns 201',
      'Other 4 return 400 (sold out or insufficient)',
      'Only one coupon marked redeemed',
    ],
    hints: ['Row-level lock on coupon (`FOR UPDATE`) from T094'],
    testPlan: ['`server/tests/concurrency.test.js` purchase race'],
  },
  T141: {
    featureAC: [
      'Overall coverage ≥ 80% (frontend + backend)',
      '100% branch coverage on critical modules: auth, task completion, purchase',
      'CI workflow fails if below threshold',
    ],
    hints: [
      'Tune `jest.config` coverage thresholds',
      'Upload artifact in `.github/workflows/ci.yml`',
    ],
    testPlan: ['`npm run test:coverage` + `cd server && npm test -- --coverage`'],
  },
  T142: {
    featureAC: [
      'ER diagram includes `task_assignments`, `xp_transactions`, `purchases`, `reward_coupons`',
      'Relationships match live migrations',
      'Checked into repo (e.g. `docs/questly-schema.mermaid`)',
    ],
    hints: ['Cross-check all files in `server/migrations/`'],
    testPlan: ['Peer review against `\d server/migrations`'],
  },
  T143: {
    featureAC: [
      'Every API route documented: method, path, role, request/response JSON',
      'Error codes listed per endpoint',
      'Includes Jira connect + sync endpoints from S04/S05',
    ],
    hints: ['`docs/API.md` or OpenAPI YAML'],
    testPlan: ['Manual review against `server/routes/`'],
  },
  T144: {
    featureAC: [
      'Write-up covers architecture (React + Express + Postgres)',
      'Documents Jira integration, XP economy, testing strategy',
      'Lessons learned section included',
    ],
    hints: ['`docs/WRITEUP.md` or submission PDF'],
    testPlan: ['Review checklist against rubric'],
  },
  T145: {
    featureAC: [
      'Script covers all 5 E2E journeys with step-by-step talking points',
      'Includes expected screenshots/UI states',
      'Timing estimate per journey',
    ],
    hints: ['`docs/DEMO.md`'],
    testPlan: ['Dry-run recording'],
  },
  T146: {
    featureAC: [
      'All GitHub Actions jobs green on `main`',
      'Coverage report uploaded as workflow artifact',
      'No flaky E2E failures',
    ],
    hints: ['`.github/workflows/ci.yml`', 'Pin Playwright browser versions'],
    testPlan: ['Trigger workflow_dispatch and verify artifacts'],
  },
  T147: {
    featureAC: [
      'Package: repo link, write-up, ER diagram, API docs, demo video',
      'All deliverables linked from README or `docs/SUBMISSION.md`',
      'Production URLs documented (Vercel + Railway)',
    ],
    hints: [
      'Frontend: https://questly-gilt.vercel.app',
      'API: https://questly-production-f5ba.up.railway.app',
    ],
    testPlan: ['Submission checklist review'],
  },
}

/** Fallback generator when no explicit entry exists */
export function fallbackEnrichment(meta) {
  const { layer, what } = meta
  const featureAC = []
  const hints = []
  const testPlan = []

  if (layer === 'Backend' && /\b(GET|POST|PATCH|DELETE)\s+\//.test(what)) {
    const m = what.match(/(GET|POST|PATCH|DELETE)\s+(\S+)/)
    featureAC.push(
      `Implement route per existing Express patterns in \`server/routes/\``,
      'Use `verifyToken` + `requireRole` middleware as appropriate',
      'Return consistent JSON error shape `{ error: string }`',
      'Add controller tests with supertest',
    )
    hints.push('Register route in appropriate router file', 'Add model methods in `server/models/`')
    testPlan.push('`cd server && npm test` — new tests in `server/tests/`')
    if (m) {
      return {
        featureAC,
        hints,
        testPlan,
        api: { method: m[1], path: `/api${m[2].replace(/\/$/, '')}`, auth: 'JWT (role per endpoint)', responses: 'See task description' },
      }
    }
  }

  if (layer === 'Frontend') {
    featureAC.push(
      'Follow Tailwind tokens and patterns from existing pages in `src/pages/`',
      'Use Zustand stores in `src/stores/` for shared state',
      'Accessible labels on interactive elements',
    )
    hints.push('Colocate component tests under `src/tests/`')
    testPlan.push('`npm run test:coverage` for new component tests')
  }

  if (layer === 'Testing') {
    featureAC.push('Tests are deterministic — no reliance on wall-clock or external Jira without nock')
    hints.push('Use test DB via `server/tests/setup.js`')
    testPlan.push('`cd server && npm run migrate:test && npm test`')
  }

  if (layer === 'Documentation') {
    featureAC.push('Add docs under `docs/` and link from README if user-facing')
    testPlan.push('Peer review for completeness')
  }

  if (layer === 'DevOps') {
    featureAC.push('Changes align with `.github/workflows/ci.yml`')
    testPlan.push('Verify workflow run on PR')
  }

  return { featureAC, hints, testPlan }
}

export function getEnrichment(meta) {
  const explicit = ENRICHMENTS[meta.tid]
  if (explicit) return explicit
  return fallbackEnrichment(meta)
}

export const MILESTONE_DESCRIPTIONS = {
  M5: 'XP economy, Dashboard UI, and Sprint lifecycle (S06–S07)',
  M6: 'Reward Shop, coupons, and Profile / My Rewards (S08–S09)',
  M7: 'Live API wiring and component tests (S10–S11)',
  M8: 'E2E journeys, security, performance, and submission (S12–S13)',
}
