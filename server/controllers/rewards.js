const WorkspaceModel = require('../models/workspace')
const RewardModel = require('../models/reward')
const RewardCouponModel = require('../models/rewardCoupon')
const rewardPurchase = require('../services/rewardPurchase')
const { defaultExpiresAt } = require('../services/coupon')
const { canAccessWorkspace, isWorkspaceAdmin } = require('../lib/workspaceAuth')

function parseCouponCodes(body) {
  const raw = body.couponCodes ?? body.codes ?? body.coupon_codes
  if (!raw) return []

  if (Array.isArray(raw)) {
    return raw.map((code) => String(code).trim()).filter(Boolean)
  }

  return String(raw)
    .split(/\r?\n/)
    .map((code) => code.trim())
    .filter(Boolean)
}

async function createForWorkspace(req, res, next) {
  try {
    const workspace = await WorkspaceModel.findById(req.params.id)
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' })
    if (!isWorkspaceAdmin(req.user, workspace)) return res.status(403).json({ error: 'Forbidden' })

    const { title, description, coinCost, imageUrl } = req.body
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'title is required' })
    }

    const coin_cost = Number(coinCost ?? req.body.coin_cost)
    if (!Number.isInteger(coin_cost) || coin_cost <= 0) {
      return res.status(400).json({ error: 'coinCost must be a positive integer' })
    }

    const reward = await RewardModel.create({
      workspace_id: workspace.id,
      title: String(title).trim(),
      description: description ?? null,
      coin_cost,
      image_url: imageUrl ?? req.body.image_url ?? null,
      created_by: req.user.id,
    })

    return res.status(201).json({ reward: RewardModel.formatReward(reward, { stockCount: 0 }) })
  } catch (err) {
    next(err)
  }
}

async function listForWorkspace(req, res, next) {
  try {
    const workspace = await WorkspaceModel.findById(req.params.id)
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' })
    if (!canAccessWorkspace(req.user, workspace)) return res.status(403).json({ error: 'Forbidden' })

    const includeUnavailable = isWorkspaceAdmin(req.user, workspace)
    const rewards = await RewardModel.listByWorkspace(workspace.id, { includeUnavailable })
    res.json({ rewards })
  } catch (err) {
    next(err)
  }
}

async function updateReward(req, res, next) {
  try {
    const reward = await RewardModel.findById(req.params.id)
    if (!reward) return res.status(404).json({ error: 'Reward not found' })

    const workspace = await WorkspaceModel.findById(reward.workspace_id)
    if (!workspace || !isWorkspaceAdmin(req.user, workspace)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    if (req.body.coinCost !== undefined || req.body.coin_cost !== undefined) {
      const coin_cost = Number(req.body.coinCost ?? req.body.coin_cost)
      if (!Number.isInteger(coin_cost) || coin_cost <= 0) {
        return res.status(400).json({ error: 'coinCost must be a positive integer' })
      }
    }

    const updated = await RewardModel.update(reward.id, req.body)
    const stockCount = await RewardCouponModel.countValidByReward(updated.id)
    res.json({ reward: RewardModel.formatReward(updated, { stockCount }) })
  } catch (err) {
    next(err)
  }
}

async function deleteReward(req, res, next) {
  try {
    const reward = await RewardModel.findById(req.params.id)
    if (!reward) return res.status(404).json({ error: 'Reward not found' })

    const workspace = await WorkspaceModel.findById(reward.workspace_id)
    if (!workspace || !isWorkspaceAdmin(req.user, workspace)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const unredeemed = await RewardCouponModel.countUnredeemed(reward.id)
    if (unredeemed > 0) {
      return res.status(400).json({ error: 'Cannot delete reward with unredeemed coupons' })
    }

    await RewardModel.remove(reward.id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

async function addCoupons(req, res, next) {
  try {
    const reward = await RewardModel.findById(req.params.id)
    if (!reward) return res.status(404).json({ error: 'Reward not found' })

    const workspace = await WorkspaceModel.findById(reward.workspace_id)
    if (!workspace || !isWorkspaceAdmin(req.user, workspace)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const codes = parseCouponCodes(req.body)
    if (!codes.length) {
      return res.status(400).json({ error: 'At least one coupon code is required' })
    }

    const expiresAt = req.body.expiresAt ?? req.body.expires_at ?? defaultExpiresAt()
    const result = await RewardCouponModel.insertMany(reward.id, codes, expiresAt)

    if (result.added > 0) {
      await RewardModel.setAvailability(reward.id, true)
    }

    const stockCount = await RewardCouponModel.countValidByReward(reward.id)
    const updated = await RewardModel.findById(reward.id)

    res.status(201).json({
      reward: RewardModel.formatReward(updated, { stockCount }),
      coupons: result,
    })
  } catch (err) {
    next(err)
  }
}

async function purchase(req, res, next) {
  try {
    const reward = await RewardModel.findById(req.params.id)
    if (!reward) return res.status(404).json({ error: 'Reward not found' })

    const workspaceId = req.workspaceId ?? req.user.workspace_id
    const workspace = await WorkspaceModel.findById(reward.workspace_id)
    if (!workspace || workspaceId !== workspace.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const membershipRole = req.membership?.role
    const canPurchase =
      membershipRole === 'developer' || (!req.membership && req.user.role === 'developer')
    if (!canPurchase) {
      return res.status(403).json({ error: 'Only developers can purchase rewards' })
    }

    const result = await rewardPurchase.purchaseReward({
      userId: req.user.id,
      rewardId: reward.id,
      workspaceId,
    })

    res.status(201).json(result)
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message })
    next(err)
  }
}

module.exports = {
  createForWorkspace,
  listForWorkspace,
  updateReward,
  deleteReward,
  addCoupons,
  purchase,
}
