const { Router } = require('express')
const {
  create,
  getById,
  update,
  getByCode,
  getMine,
  listMembers,
  listMemberships,
  connectJira,
  disconnectJira,
} = require('../controllers/workspace')
const workspaceJiraOAuth = require('../controllers/workspaceJiraOAuth')
const {
  submit,
  listPending,
  review,
} = require('../controllers/joinRequest')
const { listPending: listPendingXpApprovals, review: reviewXpApproval } = require('../controllers/xpApproval')
const { listByWorkspace } = require('../controllers/tasks')
const {
  createForWorkspace,
  listForWorkspace,
  getActiveForWorkspace,
} = require('../controllers/sprints')
const { createForWorkspace: createReward, listForWorkspace: listRewards } = require('../controllers/rewards')
const {
  updateMemberRole,
  transferOwnership,
  leaveWorkspace,
} = require('../controllers/membershipLifecycle')
const verifyToken = require('../middleware/verifyToken')
const requireRoleUnlessMultiWorkspace = require('../middleware/requireRoleUnlessMultiWorkspace')

const router = Router()

router.post('/', verifyToken, requireRoleUnlessMultiWorkspace('admin'), create)
router.get('/mine', verifyToken, requireRoleUnlessMultiWorkspace('admin'), getMine)
router.get('/memberships', verifyToken, listMemberships)
router.get('/jira/oauth/status', verifyToken, requireRoleUnlessMultiWorkspace('admin'), workspaceJiraOAuth.oauthStatus)
router.get('/jira/oauth/callback', workspaceJiraOAuth.oauthCallback)
router.get('/by-code/:code', verifyToken, getByCode)
router.get('/:id/members', verifyToken, requireRoleUnlessMultiWorkspace('admin'), listMembers)
router.get('/:id/tasks', verifyToken, requireRoleUnlessMultiWorkspace('admin'), listByWorkspace)
router.post('/:id/sprints', verifyToken, requireRoleUnlessMultiWorkspace('admin'), createForWorkspace)
router.get('/:id/sprints/active', verifyToken, getActiveForWorkspace)
router.get('/:id/sprints', verifyToken, listForWorkspace)
router.post('/:id/rewards', verifyToken, requireRoleUnlessMultiWorkspace('admin'), createReward)
router.get('/:id/rewards', verifyToken, listRewards)
router.get('/:id/join-requests', verifyToken, requireRoleUnlessMultiWorkspace('admin'), listPending)
router.post('/:id/join-requests', verifyToken, requireRoleUnlessMultiWorkspace('developer'), submit)
router.patch('/:id/join-requests/:requestId', verifyToken, requireRoleUnlessMultiWorkspace('admin'), review)
router.get('/:id/xp-approvals', verifyToken, requireRoleUnlessMultiWorkspace('admin'), listPendingXpApprovals)
router.patch('/:id/xp-approvals/:requestId', verifyToken, requireRoleUnlessMultiWorkspace('admin'), reviewXpApproval)
router.patch('/:id/members/:userId/role', verifyToken, updateMemberRole)
router.post('/:id/transfer-ownership', verifyToken, transferOwnership)
router.post('/:id/leave', verifyToken, leaveWorkspace)
router.get('/:id/jira/oauth/start', verifyToken, requireRoleUnlessMultiWorkspace('admin'), workspaceJiraOAuth.oauthStart)
router.post('/:id/jira/connect', verifyToken, requireRoleUnlessMultiWorkspace('admin'), connectJira)
router.delete('/:id/jira/disconnect', verifyToken, requireRoleUnlessMultiWorkspace('admin'), disconnectJira)
router.get('/:id', verifyToken, getById)
router.patch('/:id', verifyToken, requireRoleUnlessMultiWorkspace('admin'), update)

module.exports = router
