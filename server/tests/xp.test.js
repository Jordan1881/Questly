const { calculateXP, XP_BY_DIFFICULTY } = require('../services/xp')

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

  it('exports XP_BY_DIFFICULTY constant', () => {
    expect(XP_BY_DIFFICULTY).toEqual({ easy: 20, medium: 40, hard: 70 })
  })
})
