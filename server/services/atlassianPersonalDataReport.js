const config = require('../config')
const UserModel = require('../models/user')
const atlassianOAuth = require('./atlassianOAuth')

const REPORT_URL = 'https://api.atlassian.com/app/report-accounts/'
const BATCH_SIZE = 90

function toRfc3339(value) {
  const date = value ? new Date(value) : new Date()
  return date.toISOString()
}

async function getReportingAccessToken() {
  const refreshToken = config.atlassian.reportingRefreshToken
  if (!refreshToken) return null
  const tokens = await atlassianOAuth.refreshAccessToken(refreshToken)
  return tokens.access_token
}

async function reportAccountBatch(accounts) {
  const accessToken = await getReportingAccessToken()
  if (!accessToken) {
    return { skipped: true, reason: 'ATLASSIAN_REPORTING_REFRESH_TOKEN is not configured' }
  }

  const response = await atlassianOAuth.httpRequest(REPORT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
    body: { accounts },
  })

  return { skipped: false, response }
}

async function refreshUserPersonalData(user) {
  if (!user?.jira_access_token) {
    await UserModel.eraseJiraPersonalData(user.id)
    return
  }

  try {
    await atlassianOAuth.fetchAuthenticatedUser(user.jira_access_token)
    await UserModel.touchJiraPersonalDataUpdatedAt(user.id)
  } catch {
    await UserModel.eraseJiraPersonalData(user.id)
  }
}

async function applyErasureActions(actions = []) {
  let erased = 0
  let refreshed = 0

  for (const action of actions) {
    if (!action?.accountId) continue
    const user = await UserModel.findByJiraAccountIdGlobal(action.accountId)
    if (!user) continue

    if (action.status === 'closed') {
      await UserModel.eraseJiraPersonalData(user.id)
      erased += 1
    } else if (action.status === 'updated') {
      await refreshUserPersonalData(user)
      refreshed += 1
    }
  }

  return { erased, refreshed }
}

async function runPersonalDataReportCycle() {
  if (!config.atlassian.reportingRefreshToken) {
    return { skipped: true, reason: 'reporting_refresh_token_unset' }
  }

  const users = await UserModel.listUsersWithJiraPersonalData()
  if (!users.length) {
    return { skipped: false, reported: 0, erased: 0, refreshed: 0 }
  }

  let reported = 0
  let erased = 0
  let refreshed = 0

  for (let offset = 0; offset < users.length; offset += BATCH_SIZE) {
    const batch = users.slice(offset, offset + BATCH_SIZE)
    const accounts = batch.map((user) => ({
      accountId: user.jira_account_id,
      updatedAt: toRfc3339(user.jira_personal_data_updated_at),
    }))

    const result = await reportAccountBatch(accounts)
    if (result.skipped) return result

    reported += accounts.length

    const actions = result.response?.accounts
    if (Array.isArray(actions) && actions.length) {
      const applied = await applyErasureActions(actions)
      erased += applied.erased
      refreshed += applied.refreshed
    }
  }

  return { skipped: false, reported, erased, refreshed }
}

module.exports = {
  BATCH_SIZE,
  reportAccountBatch,
  applyErasureActions,
  runPersonalDataReportCycle,
}
