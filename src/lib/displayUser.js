/** Shared helpers for auth/profile user display (API uses snake_case; profile uses camelCase). */

export function getDisplayUsername(user, role = 'developer') {
  const name = user?.username?.trim()
  if (name) return name
  return role === 'admin' ? 'Admin' : 'Developer'
}

export function getAvatarUrl(user) {
  return user?.avatar_url ?? user?.avatarUrl ?? null
}

export function resolveAvatarUrl(url) {
  if (!url) return null
  if (url.startsWith('blob:') || url.startsWith('data:')) return url
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/')) {
    const apiBase = import.meta.env.VITE_API_URL ?? ''
    return `${apiBase}${url}`
  }
  return url
}

export function getLifetimeXp(user) {
  return user?.lifetime_xp ?? user?.lifetimeXp ?? 0
}
