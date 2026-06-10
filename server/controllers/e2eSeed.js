const db = require('../config/db')
const { reconcileTaskAssignments } = require('../services/taskAssignmentReconcile')

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

    if (req.body.assign !== false) {
      await db('task_assignments').insert({ task_id: task.id, user_id: developerId })
    }

    res.status(201).json({ task })
  } catch (err) {
    next(err)
  }
}

async function seedReward(req, res, next) {
  try {
    const { workspaceId, title, coinCost, xpCost, couponCode, expiresAt, createdBy } = req.body

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
        coin_cost: coinCost ?? (xpCost != null ? Math.max(1, Math.floor(Number(xpCost) / 10)) : 4),
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

async function seedWorkspaceJira(req, res, next) {
  try {
    const { workspaceId, jira_site_url, jira_project_key } = req.body

    if (!workspaceId || !jira_site_url || !jira_project_key) {
      return res.status(400).json({
        error: 'workspaceId, jira_site_url, and jira_project_key are required',
      })
    }

    const [workspace] = await db('workspaces')
      .where({ id: workspaceId })
      .update({
        jira_site_url: jira_site_url.replace(/\/$/, ''),
        jira_project_key,
        jira_access_token: 'e2e-workspace-jira-token',
      })
      .returning('*')

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    res.json({
      workspace: {
        id: workspace.id,
        jira_site_url: workspace.jira_site_url,
        jira_project_key: workspace.jira_project_key,
        jira_connected: true,
      },
    })
  } catch (err) {
    next(err)
  }
}

async function reconcileAssignments(req, res, next) {
  try {
    const { taskId, developerIds } = req.body

    if (!taskId || !Array.isArray(developerIds)) {
      return res.status(400).json({ error: 'taskId and developerIds array are required' })
    }

    const result = await reconcileTaskAssignments(taskId, developerIds)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

module.exports = {
  assertE2eEnabled,
  seedTask,
  seedReward,
  seedWorkspaceJira,
  reconcileAssignments,
}
