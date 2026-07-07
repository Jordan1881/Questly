const DEFAULT_PREFERENCES = {
  levelUpNotifications: true,
}

function parsePreferences(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULT_PREFERENCES }
  }

  return {
    ...DEFAULT_PREFERENCES,
    ...raw,
    levelUpNotifications:
      raw.levelUpNotifications !== undefined ? Boolean(raw.levelUpNotifications) : true,
  }
}

function mergePreferences(existing, patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    return parsePreferences(existing)
  }

  const current = parsePreferences(existing)
  const next = { ...current }

  if (patch.levelUpNotifications !== undefined) {
    next.levelUpNotifications = Boolean(patch.levelUpNotifications)
  }

  return next
}

module.exports = {
  DEFAULT_PREFERENCES,
  parsePreferences,
  mergePreferences,
}
