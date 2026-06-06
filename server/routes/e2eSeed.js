const { Router } = require('express')
const {
  assertE2eEnabled,
  seedTask,
  seedReward,
  seedWorkspaceJira,
  reconcileAssignments,
} = require('../controllers/e2eSeed')

const router = Router()

router.use(assertE2eEnabled)
router.post('/task', seedTask)
router.post('/reward', seedReward)
router.post('/workspace-jira', seedWorkspaceJira)
router.post('/reconcile-assignments', reconcileAssignments)

module.exports = router
