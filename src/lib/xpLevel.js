const LEVEL_SIZE = 1000

export function xpLevelInfo(xp) {
  const total = Math.max(0, xp ?? 0)
  const level = Math.floor(total / LEVEL_SIZE) + 1
  const xpInLevel = total % LEVEL_SIZE
  const percent = Math.round((xpInLevel / LEVEL_SIZE) * 100)
  const xpToNext = xpInLevel === 0 && total > 0 ? LEVEL_SIZE : LEVEL_SIZE - xpInLevel

  return {
    level,
    xpInLevel,
    levelMax: LEVEL_SIZE,
    percent: total === 0 ? 0 : percent,
    xpToNext,
    nextLevel: level + 1,
  }
}
