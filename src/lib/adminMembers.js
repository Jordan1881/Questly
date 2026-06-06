export function mapMemberToDeveloper(member, index = 0) {
  const lifetimeXp = member.lifetime_xp ?? member.lifetimeXp ?? 0
  const level = Math.floor(Math.max(0, lifetimeXp) / 1000) + 1

  return {
    id: member.id,
    name: member.username,
    level,
    xp: member.current_sprint_xp ?? member.currentSprintXp ?? 0,
    xpMax: level * 1000,
    coins: member.coin_balance ?? member.coinBalance ?? 0,
    tasks: member.tasks_completed ?? 0,
    status: member.status ?? 'active',
    avatarIdx: index,
  }
}

export function summarizeTeam(members = [], pendingCount = 0) {
  const active = members.filter((m) => (m.status ?? 'active') === 'active').length
  return {
    total: members.length,
    active,
    inactive: Math.max(0, members.length - active),
    pending: pendingCount,
  }
}
