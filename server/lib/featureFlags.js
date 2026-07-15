function envFlagEnabled(value) {
  if (value == null || value === '') return false
  const normalized = String(value).trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on'
}

function isMultiWorkspaceEnabled() {
  return envFlagEnabled(process.env.MULTI_WORKSPACE)
}

module.exports = {
  envFlagEnabled,
  isMultiWorkspaceEnabled,
}
