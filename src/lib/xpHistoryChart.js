const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Aggregate positive XP amounts by weekday for the last 7 calendar days. */
export function buildWeeklyXpData(transactions = []) {
  const today = new Date()
  const days = []

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today)
    date.setDate(today.getDate() - offset)
    const key = date.toDateString()
    days.push({
      day: DAY_LABELS[date.getDay()],
      dateKey: key,
      xp: 0,
    })
  }

  const dayMap = Object.fromEntries(days.map((d) => [d.dateKey, d]))

  transactions.forEach((tx) => {
    if (!tx.createdAt || tx.amount <= 0) return
    const key = new Date(tx.createdAt).toDateString()
    if (dayMap[key]) dayMap[key].xp += tx.amount
  })

  return days
}

export function weeklyXpTotal(transactions = []) {
  return buildWeeklyXpData(transactions).reduce((sum, d) => sum + d.xp, 0)
}
