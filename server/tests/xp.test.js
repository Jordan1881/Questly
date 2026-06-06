const { calculateXP } = require('../services/xp')

describe('calculateXP', () => {
  it('returns 20 / 40 / 70 for easy / medium / hard', () => {
    expect(calculateXP('easy')).toBe(20)
    expect(calculateXP('medium')).toBe(40)
    expect(calculateXP('hard')).toBe(70)
  })

  it('is case-insensitive', () => {
    expect(calculateXP('Easy')).toBe(20)
    expect(calculateXP('MEDIUM')).toBe(40)
    expect(calculateXP('Hard')).toBe(70)
  })

  it('throws TypeError for unknown difficulty', () => {
    expect(() => calculateXP('legendary')).toThrow(TypeError)
    expect(() => calculateXP('legendary')).toThrow('Unknown difficulty value: legendary')
  })
})
