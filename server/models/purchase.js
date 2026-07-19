const db = require('../config/db')
const RewardCouponModel = require('./rewardCoupon')
const RewardModel = require('./reward')

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
    coinsSpent: row.coins_spent,
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
      'p.coins_spent',
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
  return db.transaction(async (trx) => {
    const existing = await trx(TABLE)
      .where({ id, user_id: userId })
      .whereNull('deleted_at')
      .forUpdate()
      .first()
    if (!existing) return null

    const [row] = await trx(TABLE)
      .where({ id })
      .update({ deleted_at: trx.fn.now() })
      .returning('*')

    // Undoing a purchase must return its coupon to stock; re-open the reward
    // when the freed inventory makes it purchasable again (it may have been
    // auto-disabled at zero stock on the original purchase).
    if (existing.coupon_id) {
      await RewardCouponModel.markUnredeemed(existing.coupon_id, trx)
      if (existing.reward_id) {
        const validStock = await RewardCouponModel.countValidByReward(existing.reward_id, trx)
        if (validStock > 0) {
          await RewardModel.setAvailability(existing.reward_id, true, trx)
        }
      }
    }

    return row
  })
}

module.exports = {
  TABLE,
  formatPurchase,
  listForUser,
  findOwnedById,
  softDelete,
}
