const { Router } = require('express')
const authRouter = require('./auth')
const workspacesRouter = require('./workspaces')

const router = Router()

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

router.use('/auth', authRouter)
router.use('/workspaces', workspacesRouter)

module.exports = router
