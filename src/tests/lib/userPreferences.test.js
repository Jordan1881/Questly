import { describe, it, expect } from 'vitest'
import {
  DEFAULT_PREFERENCES,
  parsePreferences,
  isLevelUpNotificationsEnabled,
} from '../../lib/userPreferences'

describe('parsePreferences', () => {
  it('returns a fresh copy of defaults for nullish input', () => {
    expect(parsePreferences(null)).toEqual({ levelUpNotifications: true })
    expect(parsePreferences(undefined)).toEqual({ levelUpNotifications: true })
  })

  it('does not mutate the shared DEFAULT_PREFERENCES object', () => {
    const parsed = parsePreferences(null)
    parsed.levelUpNotifications = false
    expect(DEFAULT_PREFERENCES.levelUpNotifications).toBe(true)
  })

  it('returns defaults for non-object input', () => {
    expect(parsePreferences('nope')).toEqual({ levelUpNotifications: true })
    expect(parsePreferences(42)).toEqual({ levelUpNotifications: true })
    expect(parsePreferences(true)).toEqual({ levelUpNotifications: true })
  })

  it('coerces a truthy levelUpNotifications value to true', () => {
    expect(parsePreferences({ levelUpNotifications: 1 }).levelUpNotifications).toBe(true)
    expect(parsePreferences({ levelUpNotifications: 'yes' }).levelUpNotifications).toBe(true)
  })

  it('coerces a falsy levelUpNotifications value to false', () => {
    expect(parsePreferences({ levelUpNotifications: false }).levelUpNotifications).toBe(false)
    expect(parsePreferences({ levelUpNotifications: 0 }).levelUpNotifications).toBe(false)
    expect(parsePreferences({ levelUpNotifications: '' }).levelUpNotifications).toBe(false)
  })

  it('defaults levelUpNotifications to true when the key is undefined', () => {
    expect(parsePreferences({ levelUpNotifications: undefined }).levelUpNotifications).toBe(true)
    expect(parsePreferences({ other: 'x' }).levelUpNotifications).toBe(true)
  })

  it('preserves additional preference keys', () => {
    expect(parsePreferences({ theme: 'dark', levelUpNotifications: false })).toEqual({
      theme: 'dark',
      levelUpNotifications: false,
    })
  })
})

describe('isLevelUpNotificationsEnabled', () => {
  it('returns true when there is no user/profile', () => {
    expect(isLevelUpNotificationsEnabled(null)).toBe(true)
    expect(isLevelUpNotificationsEnabled(undefined)).toBe(true)
  })

  it('returns true when preferences are missing or empty', () => {
    expect(isLevelUpNotificationsEnabled({})).toBe(true)
    expect(isLevelUpNotificationsEnabled({ preferences: null })).toBe(true)
    expect(isLevelUpNotificationsEnabled({ preferences: {} })).toBe(true)
  })

  it('returns true when notifications are explicitly enabled', () => {
    expect(isLevelUpNotificationsEnabled({ preferences: { levelUpNotifications: true } })).toBe(true)
  })

  it('returns false when notifications are explicitly disabled', () => {
    expect(isLevelUpNotificationsEnabled({ preferences: { levelUpNotifications: false } })).toBe(false)
    expect(isLevelUpNotificationsEnabled({ preferences: { levelUpNotifications: 0 } })).toBe(false)
  })
})
