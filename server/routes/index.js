const { Router } = require('express')
const db = require('../config/db')
const authRouter = require('./auth')
const workspacesRouter = require('./workspaces')
const joinRequestsRouter = require('./joinRequests')
const tasksRouter = require('./tasks')
const sprintsRouter = require('./sprints')
const usersRouter = require('./users')
const rewardsRouter = require('./rewards')
const e2eSeedRouter = require('./e2eSeed')

const router = Router()

// Liveness: is the process up? Cheap, dependency-free.
router.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Readiness: can we actually serve traffic? Verifies the DB is reachable so
// orchestrators/monitors don't route to an instance that can't reach Postgres.
router.get('/health/ready', async (_req, res) => {
  try {
    await db.raw('select 1')
    res.json({ status: 'ready', db: 'up' })
  } catch {
    res.status(503).json({ status: 'unavailable', db: 'down' })
  }
})

router.use('/auth', authRouter)
router.use('/workspaces', workspacesRouter)
router.use('/join-requests', joinRequestsRouter)
router.use('/tasks', tasksRouter)
router.use('/sprints', sprintsRouter)
router.use('/users', usersRouter)
router.use('/rewards', rewardsRouter)
router.use('/e2e/seed', e2eSeedRouter)

module.exports = router
