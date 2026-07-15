/** Shared labels for Questly’s three-way economy (level / season / coins). */

export const ECONOMY = {
  levelProgress: 'Level progress',
  lifetimeXp: 'Lifetime XP',
  seasonScore: 'Season score',
  seasonXpHint: 'Sprint XP this season — resets when the sprint closes',
  coins: 'Coins',
  coinsSpendable: 'Spendable coins',
  economySentence:
    'Lifetime XP builds your level. Season score ranks you this sprint. Coins are what you spend in the Reward Shop.',
  howXpWorks:
    'Complete quests to earn XP from difficulty (Easy 20 · Medium 40 · Hard 70). Lifetime XP levels you up (1000 XP per level). Season score resets when your admin closes the sprint. Every 100 XP also earns 10 coins for the shop.',
  closeSprintConfirm:
    'Close this season? Season score resets for everyone. Levels and coins stay.',
  shopIntro:
    'Spend coins on workspace rewards. Earn coins from XP (100 XP = 10 coins). Season score ranks the board — it does not spend at the shop.',
  myRewardsEmpty: 'Visit the Reward Shop to spend coins on coupons.',
  noSeason:
    'No active season. Your admin can start a sprint — then season score and the team climb begin.',
  seasonSpendHint: 'Spend coins before the season ends — season score resets on close; coins stay.',
}

const STREAK_MILESTONES = [3, 7]

export function streakPercent(days) {
  const n = Math.max(0, Number(days) || 0)
  return Math.min(100, Math.round((n / 7) * 100))
}

/** Light purpose copy for streak without a new currency. */
export function streakMilestoneCopy(days) {
  const n = Math.max(0, Number(days) || 0)
  if (n <= 0) {
    return 'Complete a quest today to start your streak.'
  }
  if (n >= 7) {
    return '7-day streak unlocked — keep the chain going!'
  }
  for (const milestone of STREAK_MILESTONES) {
    if (n < milestone) {
      const left = milestone - n
      return `${left} more day${left === 1 ? '' : 's'} to a ${milestone}-day streak.`
    }
  }
  return `${n}-day streak — keep questing daily.`
}
