const XP_BY_DIFFICULTY = { easy: 20, medium: 40, hard: 70 }

function calculateXP(difficulty) {
  if (difficulty == null || difficulty === '') {
    return XP_BY_DIFFICULTY.medium
  }

  const normalized = String(difficulty).trim().toLowerCase()
  if (Object.prototype.hasOwnProperty.call(XP_BY_DIFFICULTY, normalized)) {
    return XP_BY_DIFFICULTY[normalized]
  }

  throw new TypeError(`Unknown difficulty value: ${difficulty}`)
}

module.exports = {
  XP_BY_DIFFICULTY,
  calculateXP,
}
