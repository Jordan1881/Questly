export const DEFAULT_PREFERENCES = {
  levelUpNotifications: true,
}

export function parsePreferences(raw) {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_PREFERENCES }
  }

  return {
    ...DEFAULT_PREFERENCES,
    ...raw,
    levelUpNotifications:
      raw.levelUpNotifications !== undefined ? Boolean(raw.levelUpNotifications) : true,
  }
}

export function isLevelUpNotificationsEnabled(userOrProfile) {
  const prefs = parsePreferences(userOrProfile?.preferences)
  return prefs.levelUpNotifications !== false
}
