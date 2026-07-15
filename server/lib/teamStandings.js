const LEVEL_SIZE = 1000

function computeLevel(lifetimeXp) {
  return Math.floor(Math.max(0, lifetimeXp ?? 0) / LEVEL_SIZE) + 1
}

/**
 * Public season board rows from workspace members (no emails).
 * Sorted by season XP (current_sprint_xp) descending.
 */
function buildTeamStandings(members) {
  const rows = (members || []).map((m) => ({
    userId: m.id,
    username: m.username,
    seasonXp: m.current_sprint_xp ?? 0,
    lifetimeXp: m.lifetime_xp ?? 0,
    level: computeLevel(m.lifetime_xp),
  }))
  rows.sort((a, b) => b.seasonXp - a.seasonXp || a.username.localeCompare(b.username))
  return rows.map((row, index) => ({ ...row, rank: index + 1 }))
}

module.exports = {
  buildTeamStandings,
  computeLevel,
}
