const { Router } = require('express')
const {
  updateReward,
  deleteReward,
  addCoupons,
  purchase,
} = require('../controllers/rewards')
const verifyToken = require('../middleware/verifyToken')

const router = Router()

router.patch('/:id', verifyToken, updateReward)
router.delete('/:id', verifyToken, deleteReward)
router.post('/:id/coupons', verifyToken, addCoupons)
router.post('/:id/purchase', verifyToken, purchase)

module.exports = router
