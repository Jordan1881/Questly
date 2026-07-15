const { Router } = require('express')
const verifyToken = require('../middleware/verifyToken')
const requireRole = require('../middleware/requireRole')
const requireRoleUnlessMultiWorkspace = require('../middleware/requireRoleUnlessMultiWorkspace')
const requireWorkspaceContext = require('../middleware/requireWorkspaceContext')
const {
  xpHistory,
  dashboard,
  getMe,
  patchMe,
  uploadAvatar,
  listPurchases,
  deletePurchase,
} = require('../controllers/users')
const { uploadAvatarMiddleware } = require('../middleware/uploadAvatar')

const router = Router()

router.get('/me', verifyToken, getMe)
router.patch('/me', verifyToken, patchMe)
router.post('/me/avatar', verifyToken, uploadAvatarMiddleware, uploadAvatar)
router.get('/me/purchases', verifyToken, listPurchases)
router.delete('/me/purchases/:id', verifyToken, deletePurchase)
router.get('/me/xp-history', verifyToken, requireRole('developer'), xpHistory)
router.get(
  '/me/dashboard',
  verifyToken,
  requireRoleUnlessMultiWorkspace('developer'),
  requireWorkspaceContext,
  dashboard
)

module.exports = router
