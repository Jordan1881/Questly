require('dotenv').config()
const db = require('../config/db')
const TaskModel = require('../models/task')
const WorkspaceModel = require('../models/workspace')
const { cleanupCoreTables } = require('./helpers/cleanup')

beforeAll(async () => {
  await db.migrate.latest()
})

beforeEach(async () => {
  await cleanupCoreTables(db)
})

afterAll(async () => {
  await db.destroy()
})

describe('scoped Jira task upsert', () => {
  test('same jira_issue_id in two workspaces creates independent task rows', async () => {
    const wsA = await WorkspaceModel.create({ name: 'Tenant A' })
    const wsB = await WorkspaceModel.create({ name: 'Tenant B' })

    const first = await TaskModel.upsertByJiraIssue({
      workspace_id: wsA.id,
      jira_issue_id: '10001',
      jira_issue_key: 'A-1',
      title: 'Tenant A task',
      difficulty: 'easy',
      xp_reward: 20,
      status: 'to_do',
    })

    const second = await TaskModel.upsertByJiraIssue({
      workspace_id: wsB.id,
      jira_issue_id: '10001',
      jira_issue_key: 'B-1',
      title: 'Tenant B task',
      difficulty: 'medium',
      xp_reward: 40,
      status: 'to_do',
    })

    expect(first.created).toBe(true)
    expect(second.created).toBe(true)
    expect(first.task.id).not.toBe(second.task.id)

    await TaskModel.upsertByJiraIssue({
      workspace_id: wsA.id,
      jira_issue_id: '10001',
      jira_issue_key: 'A-1',
      title: 'Tenant A updated',
      difficulty: 'easy',
      xp_reward: 20,
      status: 'in_progress',
    })

    const rowB = await db('tasks').where({ id: second.task.id }).first()
    expect(rowB.title).toBe('Tenant B task')
    expect(rowB.workspace_id).toBe(wsB.id)
  })
})

describe('workspace Jira requirement', () => {
  test('assertWorkspaceJiraReady throws 503 in production without workspace Jira', () => {
    const savedEnv = process.env.NODE_ENV
    const savedFallback = process.env.JIRA_FALLBACK_ENABLED
    process.env.NODE_ENV = 'production'
    delete process.env.JIRA_FALLBACK_ENABLED

    jest.isolateModules(() => {
      const { assertWorkspaceJiraReady } = require('../lib/jiraConfig')
      expect(() => assertWorkspaceJiraReady({ name: 'No Jira' })).toThrow(
        /Workspace Jira is not connected/,
      )
      try {
        assertWorkspaceJiraReady({ name: 'No Jira' })
      } catch (err) {
        expect(err.status).toBe(503)
      }
    })

    process.env.NODE_ENV = savedEnv
    if (savedFallback === undefined) delete process.env.JIRA_FALLBACK_ENABLED
    else process.env.JIRA_FALLBACK_ENABLED = savedFallback
  })

  test('syncWorkspaceTasks rejects unconnected workspace in production', async () => {
    const savedEnv = process.env.NODE_ENV
    const savedFallback = process.env.JIRA_FALLBACK_ENABLED
    process.env.NODE_ENV = 'production'
    delete process.env.JIRA_FALLBACK_ENABLED

    let syncWorkspaceTasks
    jest.isolateModules(() => {
      ;({ syncWorkspaceTasks } = require('../services/jiraSync'))
    })

    await expect(syncWorkspaceTasks({ id: 'ws-1', name: 'No Jira' })).rejects.toMatchObject({
      status: 503,
      message: expect.stringMatching(/Workspace Jira is not connected/),
    })

    process.env.NODE_ENV = savedEnv
    if (savedFallback === undefined) delete process.env.JIRA_FALLBACK_ENABLED
    else process.env.JIRA_FALLBACK_ENABLED = savedFallback
  })
})
