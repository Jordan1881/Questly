export function maskCouponCode(code) {
  if (!code) return '****'
  const trimmed = String(code).trim()
  if (trimmed.length <= 4) return '****'
  return `****-${trimmed.slice(-4)}`
}

export function isExpiringSoon(expiresAt, withinDays = 30) {
  if (!expiresAt) return false

  const expiry = new Date(expiresAt)
  if (Number.isNaN(expiry.getTime())) return false

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  expiry.setUTCHours(0, 0, 0, 0)

  if (expiry < today) return false

  const diffMs = expiry.getTime() - today.getTime()
  const diffDays = Math.ceil(diffMs / 86_400_000)
  return diffDays <= withinDays
}

export function isExpiredClient(expiresAt) {
  if (!expiresAt) return false
  const expiry = new Date(expiresAt)
  if (Number.isNaN(expiry.getTime())) return false
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  expiry.setUTCHours(0, 0, 0, 0)
  return expiry < today
}

export function formatExpiryDate(expiresAt) {
  if (!expiresAt) return 'No expiry'
  const date = new Date(expiresAt)
  if (Number.isNaN(date.getTime())) return 'No expiry'
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
