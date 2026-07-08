export const createMockTask = (overrides = {}) => ({
  id: crypto.randomUUID(),
  title: 'Mock Task',
  difficulty: 'medium',
  xpReward: 100,
  status: 'to_do',
  highPriority: false,
  dueDate: null,
  ...overrides,
})

export const createMockSprint = (overrides = {}) => ({
  id: crypto.randomUUID(),
  name: 'Sprint 1',
  status: 'active',
  startDate: '2026-03-01',
  endDate: '2026-03-14',
  ...overrides,
})
