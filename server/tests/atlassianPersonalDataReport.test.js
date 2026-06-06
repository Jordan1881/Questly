require('dotenv').config()

process.env.ATLASSIAN_REPORTING_REFRESH_TOKEN = 'reporting-refresh-token'

const nock = require('nock')
const db = require('../config/db')
const UserModel = require('../models/user')
const {
  reportAccountBatch,
  applyErasureActions,
  runPersonalDataReportCycle,
} = require('../services/atlassianPersonalDataReport')

beforeAll(async () => {
  await db.migrate.latest()
})

beforeEach(async () => {
  nock.cleanAll()
  await db('join_requests').del()
  await db('sprints').del()
  await db('purchases').del()
  await db('reward_coupons').del()
  await db('rewards').del()
  await db('users').del()
  await db('workspaces').del()
})

afterAll(async () => {
  nock.restore()
  await db.destroy()
})

describe('atlassianPersonalDataReport', () => {
  test('reportAccountBatch posts accounts with reporting refresh token', async () => {
    nock('https://auth.atlassian.com')
      .post('/oauth/token')
      .reply(200, { access_token: 'reporting-access-token' })

    nock('https://api.atlassian.com')
      .post('/app/report-accounts/')
      .reply(204)

    const result = await reportAccountBatch([
      { accountId: 'acct-1', updatedAt: '2026-06-01T12:00:00.000Z' },
    ])

    expect(result.skipped).toBe(false)
  })

  test('applyErasureActions erases closed accounts', async () => {
    const [user] = await db('users')
      .insert({
        email: 'dev@test.com',
        username: 'dev',
        password_hash: 'hash',
        role: 'developer',
        jira_account_id: 'closed-acct',
        jira_access_token: 'token',
        jira_personal_data_updated_at: new Date(),
      })
      .returning('*')

    const applied = await applyErasureActions([{ accountId: 'closed-acct', status: 'closed' }])

    expect(applied.erased).toBe(1)
    const row = await db('users').where({ id: user.id }).first()
    expect(row.jira_account_id).toBeNull()
    expect(row.jira_access_token).toBeNull()
    expect(row.jira_personal_data_updated_at).toBeNull()
  })

  test('runPersonalDataReportCycle reports all users with jira_account_id', async () => {
    await db('users').insert({
      email: 'dev@test.com',
      username: 'dev',
      password_hash: 'hash',
      role: 'developer',
      jira_account_id: 'acct-report',
      jira_access_token: 'token',
      jira_personal_data_updated_at: new Date('2026-06-01T12:00:00.000Z'),
    })

    nock('https://auth.atlassian.com')
      .post('/oauth/token')
      .reply(200, { access_token: 'reporting-access-token' })

    nock('https://api.atlassian.com')
      .post('/app/report-accounts/', (body) => {
        expect(body.accounts).toHaveLength(1)
        expect(body.accounts[0].accountId).toBe('acct-report')
        return true
      })
      .reply(200, { accounts: [] })

    const result = await runPersonalDataReportCycle()

    expect(result.skipped).toBe(false)
    expect(result.reported).toBe(1)
  })

  test('skips when reporting refresh token is unset', async () => {
    const config = require('../config')
    const original = config.atlassian.reportingRefreshToken
    config.atlassian.reportingRefreshToken = null

    try {
      const result = await runPersonalDataReportCycle()
      expect(result.skipped).toBe(true)
      expect(result.reason).toBe('reporting_refresh_token_unset')
    } finally {
      config.atlassian.reportingRefreshToken = original
    }
  })
})
