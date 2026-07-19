/**
 * Demo seed — a small, clean, presentation-ready dataset.
 *
 * Wipes every application table and inserts one workspace, an admin, two
 * developers, an active sprint, a handful of quests (some completed), and a
 * reward shop with coupons. Balances are written consistently to BOTH
 * `users` and `workspace_memberships` so the app shows correct XP/coins
 * regardless of the MULTI_WORKSPACE flag.
 *
 * Run:  cd server && npm run seed
 * Safe: refuses to run when NODE_ENV=production.
 */
const bcrypt = require('bcryptjs')

const DEMO_PASSWORD = 'Demo1234!'
const SALT_ROUNDS = 12

// difficulty → XP follows the project's Jira story-point mapping
const XP_BY_DIFFICULTY = { easy: 20, medium: 40, hard: 70 }
const xpToCoins = (xp) => Math.floor((xp * 10) / 100)

// Tables cleared before seeding, child-first to respect FKs.
const TABLES_IN_DELETE_ORDER = [
  'xp_approval_requests',
  'xp_transactions',
  'purchases',
  'reward_coupons',
  'rewards',
  'task_assignments',
  'tasks',
  'sprints',
  'join_requests',
  'workspace_memberships',
  'jira_oauth_pending',
  'user_jira_oauth_pending',
  'users',
  'workspaces',
]

exports.seed = async function seed(knex) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run demo seed with NODE_ENV=production')
  }

  // Wipe everything in one shot; CASCADE covers any table we did not list.
  await knex.raw(
    `TRUNCATE TABLE ${TABLES_IN_DELETE_ORDER.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`
  )

  const password_hash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS)

  // ── Workspace ──────────────────────────────────────────────────────────────
  const [workspace] = await knex('workspaces')
    .insert({
      name: 'Questly Demo',
      code: 'DEMO01',
      jira_auth_type: 'api_token',
      require_xp_approval: false,
    })
    .returning('*')

  // ── Users ──────────────────────────────────────────────────────────────────
  const [admin] = await knex('users')
    .insert({
      email: 'admin@questly.demo',
      username: 'Demo Admin',
      password_hash,
      role: 'admin',
      workspace_id: workspace.id,
    })
    .returning('*')

  const [alice] = await knex('users')
    .insert({
      email: 'alice@questly.demo',
      username: 'Alice Dev',
      password_hash,
      role: 'developer',
      workspace_id: workspace.id,
    })
    .returning('*')

  const [bob] = await knex('users')
    .insert({
      email: 'bob@questly.demo',
      username: 'Bob Dev',
      password_hash,
      role: 'developer',
      workspace_id: workspace.id,
    })
    .returning('*')

  await knex('workspaces').where({ id: workspace.id }).update({ admin_id: admin.id })

  // ── Sprint ───────────────────────────────────────────────────────────────
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - 3)
  const endDate = new Date(today)
  endDate.setDate(today.getDate() + 11)

  const [sprint] = await knex('sprints')
    .insert({
      workspace_id: workspace.id,
      name: 'Sprint 1',
      start_date: startDate.toISOString().slice(0, 10),
      end_date: endDate.toISOString().slice(0, 10),
      status: 'active',
      created_by: admin.id,
    })
    .returning('*')

  // ── Quests (tasks + assignments) ─────────────────────────────────────────────
  const questPlan = [
    { key: 'DEMO-1', title: 'Design the database schema', difficulty: 'hard', assignee: alice, completed: true, highPriority: true },
    { key: 'DEMO-2', title: 'Set up the CI pipeline', difficulty: 'medium', assignee: alice, completed: true },
    { key: 'DEMO-3', title: 'Write the project README', difficulty: 'easy', assignee: bob, completed: true },
    { key: 'DEMO-4', title: 'Build the login page', difficulty: 'medium', assignee: alice, completed: false },
    { key: 'DEMO-5', title: 'Add the reward shop UI', difficulty: 'hard', assignee: bob, completed: false, highPriority: true },
    { key: 'DEMO-6', title: 'Fix the sign-in redirect bug', difficulty: 'easy', assignee: bob, completed: false },
  ]

  // per-user rolling XP/coin totals from completed quests
  const totals = new Map()
  const bump = (userId, xp) => {
    const cur = totals.get(userId) ?? { xp: 0, coins: 0 }
    cur.xp += xp
    cur.coins += xpToCoins(xp)
    totals.set(userId, cur)
  }

  for (const quest of questPlan) {
    const xp = XP_BY_DIFFICULTY[quest.difficulty]
    const [task] = await knex('tasks')
      .insert({
        workspace_id: workspace.id,
        sprint_id: sprint.id,
        jira_issue_id: quest.key.toLowerCase(),
        jira_issue_key: quest.key,
        title: quest.title,
        description: `${quest.title} for the Questly demo workspace.`,
        difficulty: quest.difficulty,
        xp_reward: xp,
        high_priority: Boolean(quest.highPriority),
        status: quest.completed ? 'done' : 'to_do',
      })
      .returning('*')

    await knex('task_assignments').insert({
      task_id: task.id,
      user_id: quest.assignee.id,
      completed_at: quest.completed ? knex.fn.now() : null,
    })

    if (quest.completed) {
      await knex('xp_transactions').insert({
        user_id: quest.assignee.id,
        task_id: task.id,
        sprint_id: sprint.id,
        amount: xp,
        reason: 'task_completed',
      })
      bump(quest.assignee.id, xp)
    }
  }

  // ── Memberships (balances mirrored to users to avoid dual-write drift) ────────
  const members = [
    { user: admin, role: 'admin' },
    { user: alice, role: 'developer' },
    { user: bob, role: 'developer' },
  ]

  for (const { user, role } of members) {
    const t = totals.get(user.id) ?? { xp: 0, coins: 0 }
    await knex('workspace_memberships').insert({
      user_id: user.id,
      workspace_id: workspace.id,
      role,
      status: 'active',
      current_sprint_xp: t.xp,
      lifetime_xp: t.xp,
      coin_balance: t.coins,
      last_used_at: knex.fn.now(),
    })
    await knex('users').where({ id: user.id }).update({
      current_sprint_xp: t.xp,
      lifetime_xp: t.xp,
      coin_balance: t.coins,
    })
  }

  // ── Reward shop ──────────────────────────────────────────────────────────────
  const oneYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  const rewardPlan = [
    { title: 'Coffee Voucher', description: 'A free coffee on the house.', coinCost: 5, coupons: 3 },
    { title: 'Company Swag Pack', description: 'Stickers, socks, and a mug.', coinCost: 10, coupons: 2 },
    { title: 'Extra Day Off', description: 'One paid day off.', coinCost: 30, coupons: 1 },
  ]

  const createdRewards = []
  for (const r of rewardPlan) {
    const [reward] = await knex('rewards')
      .insert({
        workspace_id: workspace.id,
        title: r.title,
        description: r.description,
        coin_cost: r.coinCost,
        is_available: true,
        created_by: admin.id,
      })
      .returning('*')

    const coupons = []
    for (let i = 1; i <= r.coupons; i += 1) {
      coupons.push({
        reward_id: reward.id,
        coupon_code: `${r.title.replace(/\s+/g, '-').toUpperCase()}-${i}`,
        is_redeemed: false,
        expires_at: oneYear,
      })
    }
    const insertedCoupons = await knex('reward_coupons').insert(coupons).returning('*')
    createdRewards.push({ reward, coupons: insertedCoupons })
  }

  // ── One example purchase (Alice buys a Coffee Voucher) ───────────────────────
  const coffee = createdRewards.find((r) => r.reward.title === 'Coffee Voucher')
  if (coffee) {
    const coupon = coffee.coupons[0]
    await knex('purchases').insert({
      user_id: alice.id,
      reward_id: coffee.reward.id,
      coupon_id: coupon.id,
      coins_spent: coffee.reward.coin_cost,
    })
    await knex('reward_coupons').where({ id: coupon.id }).update({ is_redeemed: true })

    const spend = coffee.reward.coin_cost
    await knex('workspace_memberships')
      .where({ user_id: alice.id, workspace_id: workspace.id })
      .update({ coin_balance: knex.raw('GREATEST(coin_balance - ?, 0)', [spend]) })
    await knex('users')
      .where({ id: alice.id })
      .update({ coin_balance: knex.raw('GREATEST(coin_balance - ?, 0)', [spend]) })
  }

  console.log(
    `Demo seed complete → workspace "Questly Demo" (code DEMO01)\n` +
      `  admin@questly.demo / alice@questly.demo / bob@questly.demo\n` +
      `  password for all: ${DEMO_PASSWORD}`
  )
}
