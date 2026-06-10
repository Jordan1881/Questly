const db = require('../config/db')
const RewardModel = require('../models/reward')
const RewardCouponModel = require('../models/rewardCoupon')
const taskRewards = require('./taskRewards')

async function purchaseReward({ userId, rewardId }) {
  try {
    return await db.transaction(async (trx) => {
      const reward = await trx(RewardModel.TABLE).where({ id: rewardId }).first()
      if (!reward) {
        const err = new Error('Reward not found')
        err.status = 404
        throw err
      }

      if (!reward.is_available) {
        const err = new Error('Reward is not available')
        err.status = 400
        throw err
      }

      const user = await trx('users').where({ id: userId }).forUpdate().first()
      if (!user) {
        const err = new Error('User not found')
        err.status = 404
        throw err
      }

      if ((user.coin_balance ?? 0) < reward.coin_cost) {
        const err = new Error('Insufficient coins')
        err.status = 400
        throw err
      }

      const coupon = await RewardCouponModel.lockNextValid(rewardId, trx)
      if (!coupon) {
        const err = new Error('No valid coupons available for this reward')
        err.status = 400
        err.noValidCoupons = true
        throw err
      }

      await trx('users')
        .where({ id: userId })
        .update({
          coin_balance: trx.raw('coin_balance - ?', [reward.coin_cost]),
        })

      const [purchase] = await trx('purchases')
        .insert({
          user_id: userId,
          reward_id: rewardId,
          coupon_id: coupon.id,
          coins_spent: reward.coin_cost,
        })
        .returning('*')

      await RewardCouponModel.markRedeemed(coupon.id, trx)

      const remainingStock = await RewardCouponModel.countValidByReward(rewardId, trx)
      if (remainingStock === 0) {
        await RewardModel.setAvailability(rewardId, false, trx)
      }

      const balances = await taskRewards.getUserBalances(userId, trx)

      return {
        purchase: {
          id: purchase.id,
          rewardId: purchase.reward_id,
          couponId: purchase.coupon_id,
          coinsSpent: purchase.coins_spent,
          purchasedAt: purchase.purchased_at,
          couponCode: coupon.coupon_code,
        },
        balances,
      }
    })
  } catch (err) {
    if (err.noValidCoupons) {
      await RewardModel.setAvailability(rewardId, false)
    }
    throw err
  }
}

module.exports = {
  purchaseReward,
}
