import { resolveAvatarUrl } from './displayUser'

function devicePixelRatio() {
  if (typeof window === 'undefined') return 2
  return Math.min(window.devicePixelRatio || 1, 3)
}

/** Request a retina-sized render (?w=) from the API avatar pipeline. */
export function buildAvatarSrc(avatarUrl, displaySize) {
  const resolved = resolveAvatarUrl(avatarUrl)
  if (!resolved) return null

  const width = Math.min(Math.max(Math.round(displaySize * devicePixelRatio()), 64), 1024)
  const joiner = resolved.includes('?') ? '&' : '?'
  return `${resolved}${joiner}w=${width}`
}
