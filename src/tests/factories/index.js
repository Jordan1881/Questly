export const createMockUser = (overrides = {}) => ({
  id: crypto.randomUUID(),
  email: 'test@example.com',
  username: 'TestUser',
  role: 'developer',
  currentSprintXp: 0,
  lifetimeXp: 0,
  streakDays: 0,
  ...overrides,
})

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

export const createMockReward = (overrides = {}) => ({
  id: crypto.randomUUID(),
  title: 'Mock Reward',
  description: 'A test reward',
  coinCost: 50,
  isAvailable: true,
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
