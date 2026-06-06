const db = require('../config/db')

function assertE2eEnabled(_req, res, next) {
  if (process.env.E2E_SEED_ENABLED !== 'true') {
    return res.status(404).json({ error: 'Not found' })
  }
  next()
}

async function seedTask(req, res, next) {
  try {
    const { workspaceId, developerId, title, difficulty, xpReward, highPriority } = req.body

    if (!workspaceId || !developerId || !title) {
      return res.status(400).json({ error: 'workspaceId, developerId, and title are required' })
    }

    const suffix = Date.now()
    const [task] = await db('tasks')
      .insert({
        workspace_id: workspaceId,
        jira_issue_id: `e2e-${suffix}`,
        jira_issue_key: `E2E-${suffix}`,
        title,
        description: 'E2E seeded task',
        difficulty: difficulty || 'medium',
        xp_reward: xpReward ?? 40,
        high_priority: Boolean(highPriority),
        status: 'to_do',
      })
      .returning('*')

    await db('task_assignments').insert({ task_id: task.id, user_id: developerId })

    res.status(201).json({ task })
  } catch (err) {
    next(err)
  }
}

async function seedReward(req, res, next) {
  try {
    const { workspaceId, title, xpCost, couponCode, expiresAt, createdBy } = req.body

    if (!workspaceId || !title || !couponCode) {
      return res.status(400).json({ error: 'workspaceId, title, and couponCode are required' })
    }

    const workspace = await db('workspaces').where({ id: workspaceId }).first()
    const createdById = createdBy || workspace?.admin_id
    if (!createdById) {
      return res.status(400).json({ error: 'createdBy is required' })
    }

    const [reward] = await db('rewards')
      .insert({
        workspace_id: workspaceId,
        title,
        description: 'E2E seeded reward',
        xp_cost: xpCost ?? 40,
        is_available: true,
        created_by: createdById,
      })
      .returning('*')

    const [coupon] = await db('reward_coupons')
      .insert({
        reward_id: reward.id,
        coupon_code: couponCode,
        expires_at: expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        is_redeemed: false,
      })
      .returning('*')

    res.status(201).json({ reward, coupon })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  assertE2eEnabled,
  seedTask,
  seedReward,
}
