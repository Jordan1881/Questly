const { createTaskService } = require('../services/taskService')

// Demonstrates the DI payoff: the service is tested with an injected fake model,
// with no database and no HTTP — pure business logic in isolation.
describe('createTaskService (dependency injection)', () => {
  test('throws when its dependency is missing', () => {
    expect(() => createTaskService({})).toThrow(/taskAssignmentModel/)
  })

  test('returns rows without a total when unpaginated', async () => {
    const fakeModel = {
      listForUser: jest.fn().mockResolvedValue([{ id: 't1' }]),
      countForUser: jest.fn(),
    }
    const service = createTaskService({ taskAssignmentModel: fakeModel })

    const result = await service.listForUser({ userId: 'u1', workspaceId: 'w1' })

    expect(result).toEqual({ rows: [{ id: 't1' }], total: null })
    expect(fakeModel.listForUser).toHaveBeenCalledWith('u1', 'w1')
    expect(fakeModel.countForUser).not.toHaveBeenCalled()
  })

  test('returns rows and total when pagination is active', async () => {
    const fakeModel = {
      listForUser: jest.fn().mockResolvedValue([{ id: 't1' }, { id: 't2' }]),
      countForUser: jest.fn().mockResolvedValue(17),
    }
    const service = createTaskService({ taskAssignmentModel: fakeModel })

    const result = await service.listForUser({
      userId: 'u1',
      workspaceId: 'w1',
      pagination: { active: true, limit: 2, offset: 0 },
    })

    expect(result).toEqual({ rows: [{ id: 't1' }, { id: 't2' }], total: 17 })
    expect(fakeModel.listForUser).toHaveBeenCalledWith('u1', 'w1', { limit: 2, offset: 0 })
    expect(fakeModel.countForUser).toHaveBeenCalledWith('u1', 'w1')
  })
})
