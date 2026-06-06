require('dotenv').config()
const request = require('supertest')
const createApp = require('../app')
const db = require('../config/db')
const jiraClient = require('../services/jiraClient')

jest.mock('../services/jiraClient', () => ({
  ...jest.requireActual('../services/jiraClient'),
  fetchProjectIssues: jest.fn(),
}))

const app = createApp()

const MOCK_ISSUES = [
  {
    jiraIssueId: '10001',
    jiraIssueKey: 'SCRUM-1',
    title: 'Task 1',
    description: 'First task',
    difficulty: 'easy',
    xpReward: 20,
    dueDate: '2026-03-10',
    highPriority: false,
    status: 'to_do',
    assigneeAccountId: null,
  },
  {
    jiraIssueId: '10002',
    jiraIssueKey: 'SCRUM-2',
    title: 'Task 2',
    description: 'Second task',
    difficulty: 'hard',
    xpReward: 70,
    dueDate: '2026-03-12',
    highPriority: true,
    status: 'in_progress',
    assigneeAccountId: 'dev-jira-id',
  },
]

beforeAll(async () => {
  await db.migrate.latest()
})

beforeEach(async () => {
  jest.clearAllMocks()
  jiraClient.fetchProjectIssues.mockResolvedValue(MOCK_ISSUES)
  await db('xp_transactions').del()
  await db('task_assignments').del()
  await db('tasks').del()
  await db('sprints').del()
  await db('join_requests').del()
  await db('users').del()
  await db('workspaces').del()
})

afterAll(async () => {
  await db.destroy()
})

async function registerAndLogin(role = 'admin', suffix = '') {
  const email = role === 'admin' ? `admin${suffix}@test.com` : `dev${suffix}@test.com`
  const username = role === 'admin' ? `admin${suffix}` : `dev${suffix}`
  await request(app)
    .post('/api/auth/register')
    .send({ email, username, password: 'password123', role })
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'password123' })
  return { token: res.body.token, user: res.body.user }
}

async function createWorkspaceWithDeveloper(suffix = '') {
  const { token: adminToken, user: adminUser } = await registerAndLogin('admin', suffix)
  const workspaceRes = await request(app)
    .post('/api/workspaces')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: `Workspace ${suffix}` })

  const { token: devToken, user: devUser } = await registerAndLogin('developer', `${suffix}dev`)
  await db('users')
    .where({ id: devUser.id })
    .update({ workspace_id: workspaceRes.body.workspace.id, jira_account_id: 'dev-jira-id' })

  return {
    adminToken,
    devToken,
    workspace: workspaceRes.body.workspace,
    devUserId: devUser.id,
    adminUserId: adminUser.id,
  }
}

describe('POST /api/tasks/sync/:workspaceId', () => {
  test('admin syncs Jira issues into workspace tasks and assignments', async () => {
    const { adminToken, workspace, devUserId } = await createWorkspaceWithDeveloper('sync')

    const res = await request(app)
      .post(`/api/tasks/sync/${workspace.id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ synced: 2, created: 2, updated: 0 })
    expect(jiraClient.fetchProjectIssues).toHaveBeenCalledTimes(1)

    const tasks = await db('tasks').where({ workspace_id: workspace.id })
    expect(tasks).toHaveLength(2)
    expect(tasks.map((task) => task.jira_issue_key).sort()).toEqual(['SCRUM-1', 'SCRUM-2'])

    const assignments = await db('task_assignments').where({ user_id: devUserId })
    expect(assignments).toHaveLength(2)
  })

  test('developer cannot sync tasks', async () => {
    const { adminToken, devToken, workspace } = await createWorkspaceWithDeveloper('forbidden')

    const res = await request(app)
      .post(`/api/tasks/sync/${workspace.id}`)
      .set('Authorization', `Bearer ${devToken}`)

    expect(res.status).toBe(403)
    expect(jiraClient.fetchProjectIssues).not.toHaveBeenCalled()
  })

  test('re-sync removes uncompleted assignments when Jira assignee changes', async () => {
    const { adminToken, workspace, devUserId } = await createWorkspaceWithDeveloper('reassign')

    await request(app)
      .post(`/api/tasks/sync/${workspace.id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    const { token: dev2Token, user: dev2User } = await registerAndLogin('developer', 'reassign2')
    await db('users')
      .where({ id: dev2User.id })
      .update({ workspace_id: workspace.id, jira_account_id: 'dev2-jira-id' })

    jiraClient.fetchProjectIssues.mockResolvedValue([
      MOCK_ISSUES[0],
      { ...MOCK_ISSUES[1], assigneeAccountId: 'dev2-jira-id' },
    ])

    const res = await request(app)
      .post(`/api/tasks/sync/${workspace.id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body.assignmentsRemoved).toBeGreaterThanOrEqual(1)

    const dev1Assignment = await db('task_assignments')
      .join('tasks', 'tasks.id', 'task_assignments.task_id')
      .where({ user_id: devUserId, jira_issue_key: 'SCRUM-2' })
      .first()
    expect(dev1Assignment).toBeUndefined()

    const dev2Assignment = await db('task_assignments')
      .join('tasks', 'tasks.id', 'task_assignments.task_id')
      .where({ user_id: dev2User.id, jira_issue_key: 'SCRUM-2' })
      .first()
    expect(dev2Assignment).toBeDefined()
    expect(dev2Token).toBeDefined()
  })

  test('re-sync keeps completed assignments when Jira assignee changes', async () => {
    const { adminToken, devToken, workspace, devUserId } =
      await createWorkspaceWithDeveloper('keepdone')

    await request(app)
      .post(`/api/tasks/sync/${workspace.id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    const listRes = await request(app).get('/api/tasks').set('Authorization', `Bearer ${devToken}`)
    const scrum2 = listRes.body.tasks.find((task) => task.jiraId === 'SCRUM-2')

    await request(app)
      .patch(`/api/tasks/${scrum2.id}/completion`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ completed: true })

    const { user: dev2User } = await registerAndLogin('developer', 'keepdone2')
    await db('users')
      .where({ id: dev2User.id })
      .update({ workspace_id: workspace.id, jira_account_id: 'dev2-jira-id' })

    jiraClient.fetchProjectIssues.mockResolvedValue([
      MOCK_ISSUES[0],
      { ...MOCK_ISSUES[1], assigneeAccountId: 'dev2-jira-id' },
    ])

    await request(app)
      .post(`/api/tasks/sync/${workspace.id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    const dev1Assignment = await db('task_assignments')
      .join('tasks', 'tasks.id', 'task_assignments.task_id')
      .where({ user_id: devUserId, jira_issue_key: 'SCRUM-2' })
      .first()
    expect(dev1Assignment.completed_at).not.toBeNull()

    const dev2Assignment = await db('task_assignments')
      .join('tasks', 'tasks.id', 'task_assignments.task_id')
      .where({ user_id: dev2User.id, jira_issue_key: 'SCRUM-2' })
      .first()
    expect(dev2Assignment).toBeDefined()
  })

  test('re-sync updates existing tasks instead of duplicating them', async () => {
    const { adminToken, workspace } = await createWorkspaceWithDeveloper('upsert')

    await request(app)
      .post(`/api/tasks/sync/${workspace.id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    jiraClient.fetchProjectIssues.mockResolvedValue([
      { ...MOCK_ISSUES[0], title: 'Updated Task 1' },
      MOCK_ISSUES[1],
    ])

    const res = await request(app)
      .post(`/api/tasks/sync/${workspace.id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ synced: 2, created: 0, updated: 2 })

    const tasks = await db('tasks').where({ workspace_id: workspace.id })
    expect(tasks).toHaveLength(2)
    expect(tasks.find((task) => task.jira_issue_key === 'SCRUM-1').title).toBe('Updated Task 1')
  })
})

describe('GET /api/workspaces/:id/tasks', () => {
  test('admin lists workspace tasks with filters', async () => {
    const { adminToken, devToken, workspace, devUserId } =
      await createWorkspaceWithDeveloper('wstasks')

    await request(app)
      .post(`/api/tasks/sync/${workspace.id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    const allRes = await request(app)
      .get(`/api/workspaces/${workspace.id}/tasks`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(allRes.status).toBe(200)
    expect(allRes.body.tasks).toHaveLength(2)

    const filteredRes = await request(app)
      .get(`/api/workspaces/${workspace.id}/tasks?difficulty=hard&assignee=${devUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(filteredRes.status).toBe(200)
    expect(filteredRes.body.tasks).toHaveLength(1)
    expect(filteredRes.body.tasks[0].jiraId).toBe('SCRUM-2')

    const devRes = await request(app)
      .get(`/api/workspaces/${workspace.id}/tasks`)
      .set('Authorization', `Bearer ${devToken}`)

    expect(devRes.status).toBe(403)
  })
})

describe('GET /api/tasks/:id', () => {
  test('developer gets task with assignment completion status', async () => {
    const { adminToken, devToken, workspace } = await createWorkspaceWithDeveloper('taskid')

    await request(app)
      .post(`/api/tasks/sync/${workspace.id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    const listRes = await request(app).get('/api/tasks').set('Authorization', `Bearer ${devToken}`)
    const taskId = listRes.body.tasks[0].id

    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${devToken}`)

    expect(res.status).toBe(200)
    expect(res.body.task.id).toBe(taskId)
    expect(res.body.task.completedAt).toBeNull()
    expect(res.body.task.done).toBe(false)
  })
})

describe('GET /api/tasks', () => {
  test('developer lists assigned workspace tasks', async () => {
    const { adminToken, devToken, workspace } = await createWorkspaceWithDeveloper('list')

    await request(app)
      .post(`/api/tasks/sync/${workspace.id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    const res = await request(app).get('/api/tasks').set('Authorization', `Bearer ${devToken}`)

    expect(res.status).toBe(200)
    expect(res.body.tasks).toHaveLength(2)
    expect(res.body.tasks[0]).toMatchObject({
      jiraId: expect.stringMatching(/^SCRUM-/),
      difficulty: expect.stringMatching(/EASY|MEDIUM|HARD/),
      xp: expect.any(Number),
      done: expect.any(Boolean),
    })
  })

  test('admin cannot list developer tasks endpoint', async () => {
    const { token: adminToken } = await registerAndLogin('admin', 'list-admin')

    const res = await request(app).get('/api/tasks').set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(403)
  })
})

describe('PATCH /api/tasks/:id/completion', () => {
  test('developer marks an assigned task complete', async () => {
    const { adminToken, devToken, workspace } = await createWorkspaceWithDeveloper('complete')

    await request(app)
      .post(`/api/tasks/sync/${workspace.id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    const listRes = await request(app).get('/api/tasks').set('Authorization', `Bearer ${devToken}`)
    const taskId = listRes.body.tasks[0].id

    const res = await request(app)
      .patch(`/api/tasks/${taskId}/completion`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ completed: true })

    expect(res.status).toBe(200)
    expect(res.body.task.done).toBe(true)

    const assignment = await db('task_assignments')
      .where({ task_id: taskId })
      .first()
    expect(assignment.completed_at).not.toBeNull()
  })

  test('completing a task awards XP and coins', async () => {
    const { adminToken, devToken, workspace, devUserId } =
      await createWorkspaceWithDeveloper('reward')

    await request(app)
      .post(`/api/tasks/sync/${workspace.id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    const listRes = await request(app).get('/api/tasks').set('Authorization', `Bearer ${devToken}`)
    const task = listRes.body.tasks.find((item) => item.xp === 20) || listRes.body.tasks[0]

    const res = await request(app)
      .patch(`/api/tasks/${task.id}/completion`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ completed: true })

    expect(res.status).toBe(200)
    expect(res.body.reward).toMatchObject({ xpDelta: 20, coinsDelta: 2 })
    expect(res.body.user).toMatchObject({
      current_sprint_xp: 20,
      lifetime_xp: 20,
      coin_balance: 2,
    })

    const devUser = await db('users').where({ id: devUserId }).first()
    expect(devUser.current_sprint_xp).toBe(20)
    expect(devUser.lifetime_xp).toBe(20)
    expect(devUser.coin_balance).toBe(2)

    const tx = await db('xp_transactions')
      .where({ user_id: devUserId, task_id: task.id, reason: 'task_completed' })
      .where('amount', '>', 0)
      .first()
    expect(tx.amount).toBe(20)
  })

  test('uncompleting a task revokes XP and coins', async () => {
    const { adminToken, devToken, workspace, devUserId } =
      await createWorkspaceWithDeveloper('revoke')

    await request(app)
      .post(`/api/tasks/sync/${workspace.id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    const listRes = await request(app).get('/api/tasks').set('Authorization', `Bearer ${devToken}`)
    const taskId = listRes.body.tasks[0].id

    await request(app)
      .patch(`/api/tasks/${taskId}/completion`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ completed: true })

    const res = await request(app)
      .patch(`/api/tasks/${taskId}/completion`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ completed: false })

    expect(res.status).toBe(200)
    expect(res.body.reward.xpDelta).toBeLessThan(0)
    expect(res.body.user.current_sprint_xp).toBe(0)
    expect(res.body.user.coin_balance).toBe(0)

    const devUser = await db('users').where({ id: devUserId }).first()
    expect(devUser.current_sprint_xp).toBe(0)
    expect(devUser.coin_balance).toBe(0)
  })

  test('second completion on same assignment returns 409 without duplicate XP', async () => {
    const { adminToken, devToken, workspace, devUserId } =
      await createWorkspaceWithDeveloper('double')

    await request(app)
      .post(`/api/tasks/sync/${workspace.id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    const listRes = await request(app).get('/api/tasks').set('Authorization', `Bearer ${devToken}`)
    const taskId = listRes.body.tasks[0].id

    await request(app)
      .patch(`/api/tasks/${taskId}/completion`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ completed: true })

    const res = await request(app)
      .patch(`/api/tasks/${taskId}/completion`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ completed: true })

    expect(res.status).toBe(409)

    const txCount = await db('xp_transactions')
      .where({ user_id: devUserId, task_id: taskId, reason: 'task_completed' })
      .where('amount', '>', 0)
    expect(txCount).toHaveLength(1)

    const devUser = await db('users').where({ id: devUserId }).first()
    expect(devUser.current_sprint_xp).toBe(listRes.body.tasks[0].xp)
  })

  test('completing task without assignment returns 403', async () => {
    const { adminToken, workspace } = await createWorkspaceWithDeveloper('unassigned')

    await request(app)
      .post(`/api/tasks/sync/${workspace.id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    const { token: otherDevToken, user: otherDev } = await registerAndLogin('developer', 'other')
    await db('users').where({ id: otherDev.id }).update({ workspace_id: workspace.id })

    const tasks = await db('tasks').where({ workspace_id: workspace.id })
    const taskId = tasks[0].id

    const res = await request(app)
      .patch(`/api/tasks/${taskId}/completion`)
      .set('Authorization', `Bearer ${otherDevToken}`)
      .send({ completed: true })

    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/not assigned/i)
  })

  test('task completion increments streak on first activity of the day', async () => {
    const { adminToken, devToken, workspace, devUserId } =
      await createWorkspaceWithDeveloper('streak')

    await request(app)
      .post(`/api/tasks/sync/${workspace.id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    const listRes = await request(app).get('/api/tasks').set('Authorization', `Bearer ${devToken}`)
    const taskId = listRes.body.tasks[0].id

    const res = await request(app)
      .patch(`/api/tasks/${taskId}/completion`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ completed: true })

    expect(res.status).toBe(200)
    expect(res.body.user.streak_days).toBe(1)

    const devUser = await db('users').where({ id: devUserId }).first()
    expect(devUser.streak_days).toBe(1)
    expect(devUser.last_activity_date).toBeTruthy()
  })
})

describe('jiraClient helpers', () => {
  test('parseDifficultyFromStoryPoints maps story points to easy, medium, or hard', () => {
    expect(jiraClient.parseDifficultyFromStoryPoints(1)).toBe('easy')
    expect(jiraClient.parseDifficultyFromStoryPoints(2)).toBe('easy')
    expect(jiraClient.parseDifficultyFromStoryPoints(3)).toBe('medium')
    expect(jiraClient.parseDifficultyFromStoryPoints(5)).toBe('medium')
    expect(jiraClient.parseDifficultyFromStoryPoints(8)).toBe('hard')
    expect(jiraClient.parseDifficultyFromStoryPoints(null)).toBe('medium')
  })

  test('mapJiraIssueToDifficulty maps story points and labels; throws on unknown', () => {
    expect(jiraClient.mapJiraIssueToDifficulty(2)).toBe('easy')
    expect(jiraClient.mapJiraIssueToDifficulty('Hard')).toBe('hard')
    expect(jiraClient.mapJiraIssueToDifficulty(null)).toBe('medium')
    expect(() => jiraClient.mapJiraIssueToDifficulty('impossible')).toThrow(TypeError)
    expect(() => jiraClient.mapJiraIssueToDifficulty(-1)).toThrow(TypeError)
  })

  test('mapIssues inherits parent story points for subtasks', () => {
    const fieldId = 'customfield_10016'
    const mapped = jiraClient.mapIssues(
      [
        {
          id: '1',
          key: 'SCRUM-1',
          fields: {
            summary: 'Parent',
            status: { name: 'To Do' },
            priority: { name: 'Medium' },
            [fieldId]: 8,
          },
        },
        {
          id: '2',
          key: 'SCRUM-2',
          fields: {
            summary: 'Subtask',
            status: { name: 'To Do' },
            priority: { name: 'Medium' },
            parent: { key: 'SCRUM-1' },
          },
        },
      ],
      fieldId,
    )

    expect(mapped[0]).toMatchObject({ difficulty: 'hard', xpReward: 70, storyPoints: 8 })
    expect(mapped[1]).toMatchObject({ difficulty: 'hard', xpReward: 70, storyPoints: 8 })
  })
})
