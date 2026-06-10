const db = require('../config/db')
const RewardCouponModel = require('./rewardCoupon')

const TABLE = 'rewards'
const PATCHABLE_FIELDS = ['title', 'description', 'coin_cost', 'image_url']

function formatReward(row, extras = {}) {
  if (!row) return null

  return {
    id: row.id,
    workspaceId: row.workspace_id,
    title: row.title,
    description: row.description,
    coinCost: row.coin_cost,
    imageUrl: row.image_url,
    isAvailable: row.is_available,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...extras,
  }
}

async function create({ workspace_id, title, description = null, coin_cost, image_url = null, created_by }) {
  const [reward] = await db(TABLE)
    .insert({
      workspace_id,
      title,
      description,
      coin_cost,
      image_url,
      created_by,
      is_available: true,
    })
    .returning('*')
  return reward
}

async function findById(id) {
  return db(TABLE).where({ id }).first()
}

async function update(id, patch) {
  const updatePatch = {}
  PATCHABLE_FIELDS.forEach((field) => {
    const camel = field === 'coin_cost' ? 'coinCost' : field === 'image_url' ? 'imageUrl' : field
    if (patch[camel] !== undefined) updatePatch[field] = patch[camel]
    if (patch[field] !== undefined) updatePatch[field] = patch[field]
  })

  if (!Object.keys(updatePatch).length) {
    return findById(id)
  }

  const [reward] = await db(TABLE).where({ id }).update(updatePatch).returning('*')
  return reward
}

async function remove(id) {
  await db(TABLE).where({ id }).del()
}

async function setAvailability(id, is_available, trx = db) {
  const [reward] = await trx(TABLE).where({ id }).update({ is_available }).returning('*')
  return reward
}

async function listByWorkspace(workspaceId, { includeUnavailable = false } = {}) {
  let query = db(TABLE).where({ workspace_id: workspaceId })
  if (!includeUnavailable) {
    query = query.where({ is_available: true })
  }

  const rows = await query.orderBy('created_at', 'desc')

  const rewards = []
  for (const row of rows) {
    const stockCount = await RewardCouponModel.countValidByReward(row.id)
    const allExpired = stockCount === 0 && (await RewardCouponModel.countUnredeemed(row.id)) > 0
    rewards.push(formatReward(row, { stockCount, allExpired }))
  }

  return rewards
}

module.exports = {
  TABLE,
  PATCHABLE_FIELDS,
  formatReward,
  create,
  findById,
  update,
  remove,
  setAvailability,
  listByWorkspace,
  listAvailableByWorkspace: (workspaceId) => listByWorkspace(workspaceId, { includeUnavailable: false }),
}
