/** Shared helpers for auth/profile user display (API uses snake_case; profile uses camelCase). */

export function getDisplayUsername(user, role = 'developer') {
  const name = user?.username?.trim()
  if (name) return name
  return role === 'admin' ? 'Admin' : 'Developer'
}

export function getAvatarUrl(user) {
  return user?.avatar_url ?? user?.avatarUrl ?? null
}

export function getLifetimeXp(user) {
  return user?.lifetime_xp ?? user?.lifetimeXp ?? 0
}
