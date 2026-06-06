const db = require('../config/db')
const { isExpired } = require('../services/coupon')

const TABLE = 'reward_coupons'

function isValidCoupon(row) {
  return row && !row.is_redeemed && !isExpired(row.expires_at)
}

async function insertMany(rewardId, codes, expiresAt) {
  if (!codes.length) return { added: 0, skipped: 0 }

  const uniqueCodes = [...new Set(codes)]
  const duplicateInBatch = codes.length - uniqueCodes.length

  const existing = await db(TABLE)
    .where({ reward_id: rewardId })
    .whereIn('coupon_code', uniqueCodes)
    .select('coupon_code')

  const existingSet = new Set(existing.map((row) => row.coupon_code))
  const toInsert = uniqueCodes.filter((code) => !existingSet.has(code))

  if (toInsert.length) {
    await db(TABLE).insert(
      toInsert.map((coupon_code) => ({
        reward_id: rewardId,
        coupon_code,
        expires_at: expiresAt,
      })),
    )
  }

  const skippedInDb = uniqueCodes.length - toInsert.length
  return { added: toInsert.length, skipped: duplicateInBatch + skippedInDb }
}

async function countValidByReward(rewardId, trx = db) {
  const rows = await trx(TABLE).where({ reward_id: rewardId, is_redeemed: false })
  return rows.filter(isValidCoupon).length
}

async function countUnredeemed(rewardId, trx = db) {
  const result = await trx(TABLE)
    .where({ reward_id: rewardId, is_redeemed: false })
    .count('* as count')
    .first()
  return Number(result?.count || 0)
}

async function lockNextValid(rewardId, trx) {
  const rows = await trx(TABLE)
    .where({ reward_id: rewardId, is_redeemed: false })
    .forUpdate()
    .skipLocked()

  return rows.find(isValidCoupon) || null
}

async function markRedeemed(couponId, trx) {
  const [row] = await trx(TABLE).where({ id: couponId }).update({ is_redeemed: true }).returning('*')
  return row
}

module.exports = {
  insertMany,
  countValidByReward,
  countUnredeemed,
  lockNextValid,
  markRedeemed,
  isValidCoupon,
}
