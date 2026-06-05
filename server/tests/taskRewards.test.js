const taskRewards = require('../services/taskRewards')

describe('taskRewards', () => {
  test('xpToCoins converts XP using 100 XP = 10 coins', () => {
    expect(taskRewards.xpToCoins(20)).toBe(2)
    expect(taskRewards.xpToCoins(40)).toBe(4)
    expect(taskRewards.xpToCoins(70)).toBe(7)
    expect(taskRewards.xpToCoins(0)).toBe(0)
  })
})
