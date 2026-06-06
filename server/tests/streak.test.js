const { updateStreak, toUtcDateString, daysBetween } = require('../services/streak')

describe('updateStreak', () => {
  const today = '2026-06-06'

  it('starts streak at 1 on first activity', () => {
    expect(updateStreak({ streak_days: 0, last_activity_date: null }, new Date(`${today}T12:00:00Z`))).toEqual({
      streak_days: 1,
      last_activity_date: today,
    })
  })

  it('does not increment on same-day repeat activity', () => {
    expect(
      updateStreak({ streak_days: 5, last_activity_date: today }, new Date(`${today}T18:00:00Z`)),
    ).toEqual({
      streak_days: 5,
      last_activity_date: today,
    })
  })

  it('increments when last activity was yesterday', () => {
    expect(
      updateStreak(
        { streak_days: 3, last_activity_date: '2026-06-05' },
        new Date(`${today}T12:00:00Z`),
      ),
    ).toEqual({
      streak_days: 4,
      last_activity_date: today,
    })
  })

  it('resets to 1 when gap exceeds one day', () => {
    expect(
      updateStreak(
        { streak_days: 10, last_activity_date: '2026-06-03' },
        new Date(`${today}T12:00:00Z`),
      ),
    ).toEqual({
      streak_days: 1,
      last_activity_date: today,
    })
  })

  it('daysBetween counts UTC date gaps', () => {
    expect(daysBetween('2026-06-05', '2026-06-06')).toBe(1)
    expect(daysBetween('2026-06-03', '2026-06-06')).toBe(3)
  })

  it('toUtcDateString normalizes to YYYY-MM-DD', () => {
    expect(toUtcDateString(new Date('2026-06-06T23:59:00Z'))).toBe('2026-06-06')
  })
})
