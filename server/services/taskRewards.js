const db = require('../config/db')
const { isMultiWorkspaceEnabled } = require('../lib/featureFlags')

const XP_PER_COIN_UNIT = 100
const COINS_PER_XP_UNIT = 10

function xpToCoins(xp) {
  if (!xp || xp <= 0) return 0
  return Math.floor((xp * COINS_PER_XP_UNIT) / XP_PER_COIN_UNIT)
}

function useMembershipProgress(workspaceId) {
  return isMultiWorkspaceEnabled() && Boolean(workspaceId)
}

async function applyMembershipDelta(trx, { userId, workspaceId, xpAmount, coinsAmount, sign }) {
  const deltaXp = sign * xpAmount
  const deltaCoins = sign * coinsAmount

  if (sign > 0) {
    await trx('workspace_memberships')
      .where({ user_id: userId, workspace_id: workspaceId, status: 'active' })
      .update({
        current_sprint_xp: trx.raw('current_sprint_xp + ?', [xpAmount]),
        lifetime_xp: trx.raw('lifetime_xp + ?', [xpAmount]),
        coin_balance: trx.raw('coin_balance + ?', [coinsAmount]),
        updated_at: trx.fn.now(),
      })
  } else {
    await trx('workspace_memberships')
      .where({ user_id: userId, workspace_id: workspaceId, status: 'active' })
      .update({
        current_sprint_xp: trx.raw('GREATEST(current_sprint_xp - ?, 0)', [xpAmount]),
        lifetime_xp: trx.raw('GREATEST(lifetime_xp - ?, 0)', [xpAmount]),
        coin_balance: trx.raw('GREATEST(coin_balance - ?, 0)', [coinsAmount]),
        updated_at: trx.fn.now(),
      })
  }

  return { deltaXp, deltaCoins }
}

async function applyCompletionChange(trx, { userId, task, wasCompleted, willComplete, workspaceId }) {
  if (wasCompleted === willComplete) {
    return { xpDelta: 0, coinsDelta: 0 }
  }

  const progressWorkspaceId = workspaceId || task.workspace_id
  const membershipMode = useMembershipProgress(progressWorkspaceId)

  if (willComplete) {
    const xpAmount = task.xp_reward ?? 0
    const coinsAmount = xpToCoins(xpAmount)

    if (membershipMode) {
      await applyMembershipDelta(trx, {
        userId,
        workspaceId: progressWorkspaceId,
        xpAmount,
        coinsAmount,
        sign: 1,
      })
    } else {
      await trx('users')
        .where({ id: userId })
        .update({
          current_sprint_xp: trx.raw('current_sprint_xp + ?', [xpAmount]),
          lifetime_xp: trx.raw('lifetime_xp + ?', [xpAmount]),
          coin_balance: trx.raw('coin_balance + ?', [coinsAmount]),
        })
    }

    if (xpAmount !== 0) {
      await trx('xp_transactions').insert({
        user_id: userId,
        task_id: task.id,
        amount: xpAmount,
        reason: 'task_completed',
      })
    }

    return { xpDelta: xpAmount, coinsDelta: coinsAmount }
  }

  const existing = await trx('xp_transactions')
    .where({ user_id: userId, task_id: task.id, reason: 'task_completed' })
    .where('amount', '>', 0)
    .orderBy('created_at', 'desc')
    .first()

  if (!existing) {
    return { xpDelta: 0, coinsDelta: 0 }
  }

  const xpAmount = existing.amount
  const coinsAmount = xpToCoins(xpAmount)

  if (membershipMode) {
    await applyMembershipDelta(trx, {
      userId,
      workspaceId: progressWorkspaceId,
      xpAmount,
      coinsAmount,
      sign: -1,
    })
  } else {
    await trx('users')
      .where({ id: userId })
      .update({
        current_sprint_xp: trx.raw('GREATEST(current_sprint_xp - ?, 0)', [xpAmount]),
        lifetime_xp: trx.raw('GREATEST(lifetime_xp - ?, 0)', [xpAmount]),
        coin_balance: trx.raw('GREATEST(coin_balance - ?, 0)', [coinsAmount]),
      })
  }

  await trx('xp_transactions').insert({
    user_id: userId,
    task_id: task.id,
    amount: -xpAmount,
    reason: 'task_completed',
  })

  return { xpDelta: -xpAmount, coinsDelta: -coinsAmount }
}

async function getUserBalances(userId, trx = db, workspaceId = null) {
  if (useMembershipProgress(workspaceId)) {
    const membership = await trx('workspace_memberships')
      .where({ user_id: userId, workspace_id: workspaceId, status: 'active' })
      .select('current_sprint_xp', 'lifetime_xp', 'coin_balance')
      .first()

    return {
      current_sprint_xp: membership?.current_sprint_xp ?? 0,
      lifetime_xp: membership?.lifetime_xp ?? 0,
      coin_balance: membership?.coin_balance ?? 0,
    }
  }

  const user = await trx('users')
    .where({ id: userId })
    .select('current_sprint_xp', 'lifetime_xp', 'coin_balance')
    .first()

  return {
    current_sprint_xp: user?.current_sprint_xp ?? 0,
    lifetime_xp: user?.lifetime_xp ?? 0,
    coin_balance: user?.coin_balance ?? 0,
  }
}

module.exports = {
  XP_PER_COIN_UNIT,
  COINS_PER_XP_UNIT,
  xpToCoins,
  applyCompletionChange,
  getUserBalances,
}
