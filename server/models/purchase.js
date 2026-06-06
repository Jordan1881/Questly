const db = require('../config/db')

const TABLE = 'purchases'

function formatPurchase(row) {
  if (!row) return null

  return {
    id: row.id,
    rewardId: row.reward_id,
    rewardTitle: row.reward_title,
    rewardImageUrl: row.reward_image_url || null,
    couponCode: row.coupon_code || null,
    expiresAt: row.expires_at || null,
    xpSpent: row.xp_spent,
    purchasedAt: row.purchased_at,
  }
}

async function listForUser(userId) {
  const rows = await db(`${TABLE} as p`)
    .join('rewards as r', 'r.id', 'p.reward_id')
    .leftJoin('reward_coupons as c', 'c.id', 'p.coupon_id')
    .where('p.user_id', userId)
    .whereNull('p.deleted_at')
    .orderBy('p.purchased_at', 'desc')
    .select(
      'p.id',
      'p.reward_id',
      'p.xp_spent',
      'p.purchased_at',
      'r.title as reward_title',
      'r.image_url as reward_image_url',
      'c.coupon_code',
      'c.expires_at',
    )

  return rows.map(formatPurchase)
}

async function findOwnedById(id, userId) {
  return db(TABLE).where({ id, user_id: userId }).whereNull('deleted_at').first()
}

async function softDelete(id, userId) {
  const existing = await findOwnedById(id, userId)
  if (!existing) return null

  const [row] = await db(TABLE)
    .where({ id })
    .update({ deleted_at: db.fn.now() })
    .returning('*')

  return row
}

module.exports = {
  TABLE,
  formatPurchase,
  listForUser,
  findOwnedById,
  softDelete,
}
