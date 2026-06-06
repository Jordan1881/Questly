function isExpired(expiresAt) {
  if (expiresAt == null || expiresAt === undefined) return false

  const expiry = new Date(expiresAt)
  if (Number.isNaN(expiry.getTime())) return false

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  expiry.setUTCHours(0, 0, 0, 0)

  return expiry < today
}

function defaultExpiresAt() {
  const date = new Date()
  date.setUTCFullYear(date.getUTCFullYear() + 1)
  return date
}

module.exports = {
  isExpired,
  defaultExpiresAt,
}
