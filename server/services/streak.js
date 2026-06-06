function toUtcDateString(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  return d.toISOString().slice(0, 10)
}

function daysBetween(earlier, later) {
  const start = new Date(`${earlier}T00:00:00.000Z`).getTime()
  const end = new Date(`${later}T00:00:00.000Z`).getTime()
  return Math.round((end - start) / 86_400_000)
}

function updateStreak({ streak_days = 0, last_activity_date }, activityDate = new Date()) {
  const today = toUtcDateString(activityDate)

  if (!last_activity_date) {
    return { streak_days: 1, last_activity_date: today }
  }

  if (last_activity_date === today) {
    return { streak_days, last_activity_date: today }
  }

  const gap = daysBetween(last_activity_date, today)
  if (gap === 1) {
    return { streak_days: streak_days + 1, last_activity_date: today }
  }

  return { streak_days: 1, last_activity_date: today }
}

async function applyStreakUpdate(trx, userId, activityDate = new Date()) {
  const user = await trx('users')
    .where({ id: userId })
    .select('streak_days', 'last_activity_date')
    .first()

  if (!user) return null

  const patch = updateStreak(user, activityDate)
  const [updated] = await trx('users').where({ id: userId }).update(patch).returning('*')
  return updated
}

module.exports = {
  toUtcDateString,
  daysBetween,
  updateStreak,
  applyStreakUpdate,
}
