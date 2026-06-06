const { Router } = require('express')
const authRouter = require('./auth')
const workspacesRouter = require('./workspaces')
const joinRequestsRouter = require('./joinRequests')
const tasksRouter = require('./tasks')
const sprintsRouter = require('./sprints')

const router = Router()

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

router.use('/auth', authRouter)
router.use('/workspaces', workspacesRouter)
router.use('/join-requests', joinRequestsRouter)
router.use('/tasks', tasksRouter)
router.use('/sprints', sprintsRouter)

module.exports = router
