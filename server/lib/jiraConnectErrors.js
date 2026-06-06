const { jiraSiteHostname } = require('./jiraSiteContext')

function formatDeveloperConnectError(err, siteUrl) {
  const host = jiraSiteHostname(siteUrl) || 'your team Jira site'

  if (err?.status === 401) {
    return `Could not verify your Jira account for ${host}. Use the same email as Questly and create an API token while logged into that Atlassian account. Ask your Jira admin to invite you if you are not on the site yet.`
  }

  if (err?.status === 403) {
    return `You do not have access to ${host}. Ask your Jira admin to invite your email to the site.`
  }

  if (err?.status === 404) {
    return `Team Jira site not found (${host}). Ask your admin to check Jira settings in Admin.`
  }

  return err?.message || 'Invalid Jira credentials'
}

module.exports = {
  formatDeveloperConnectError,
}
