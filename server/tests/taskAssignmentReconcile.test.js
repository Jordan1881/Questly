const { diffTaskAssignments } = require('../services/taskAssignmentReconcile')

describe('diffTaskAssignments', () => {
  test('returns users to add when not yet assigned', () => {
    const result = diffTaskAssignments([], ['user-1', 'user-2'])
    expect(result).toEqual({ toAdd: ['user-1', 'user-2'], toRemove: [] })
  })

  test('returns uncompleted assignments to remove when no longer desired', () => {
    const result = diffTaskAssignments(
      [
        { user_id: 'user-1', completed_at: null },
        { user_id: 'user-2', completed_at: new Date() },
      ],
      ['user-3'],
    )
    expect(result.toAdd).toEqual(['user-3'])
    expect(result.toRemove).toEqual(['user-1'])
  })

  test('keeps completed assignments out of toRemove even when unassigned in Jira', () => {
    const result = diffTaskAssignments(
      [{ user_id: 'user-1', completed_at: new Date() }],
      [],
    )
    expect(result).toEqual({ toAdd: [], toRemove: [] })
  })
})
