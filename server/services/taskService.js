// Dependency Injection example (factory / constructor injection).
//
// Instead of reaching for `require('../models/taskAssignment')` inside the
// business logic, the service receives its collaborators as arguments. This
// inverts the dependency: the service depends on an abstraction ("something
// with listForUser/countForUser"), not a concrete module. Benefits:
//   - Unit-testable in isolation: inject a fake model, no DB required.
//   - Swappable data source without touching business logic.
//   - Explicit, readable dependencies at the composition root (controller).
function createTaskService({ taskAssignmentModel }) {
  if (!taskAssignmentModel) {
    throw new Error('createTaskService requires a taskAssignmentModel dependency')
  }

  async function listForUser({ userId, workspaceId, pagination }) {
    if (pagination && pagination.active) {
      const [total, rows] = await Promise.all([
        taskAssignmentModel.countForUser(userId, workspaceId),
        taskAssignmentModel.listForUser(userId, workspaceId, {
          limit: pagination.limit,
          offset: pagination.offset,
        }),
      ])
      return { rows, total }
    }

    const rows = await taskAssignmentModel.listForUser(userId, workspaceId)
    return { rows, total: null }
  }

  return { listForUser }
}

module.exports = { createTaskService }
