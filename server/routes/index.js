const { Router } = require('express')
const authRouter = require('./auth')
const workspacesRouter = require('./workspaces')
const joinRequestsRouter = require('./joinRequests')

const router = Router()

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

router.use('/auth', authRouter)
router.use('/workspaces', workspacesRouter)
router.use('/join-requests', joinRequestsRouter)

module.exports = router
