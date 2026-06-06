const TaskAssignmentModel = require('../models/taskAssignment')

function diffTaskAssignments(existingAssignments, desiredUserIds) {
  const desiredSet = new Set(desiredUserIds)
  const existingByUser = new Map(
    existingAssignments.map((assignment) => [assignment.user_id, assignment]),
  )

  const toAdd = desiredUserIds.filter((userId) => !existingByUser.has(userId))
  const toRemove = existingAssignments
    .filter((assignment) => !desiredSet.has(assignment.user_id) && !assignment.completed_at)
    .map((assignment) => assignment.user_id)

  return { toAdd, toRemove }
}

async function reconcileTaskAssignments(taskId, desiredUserIds) {
  const existing = await TaskAssignmentModel.listByTask(taskId)
  const { toAdd, toRemove } = diffTaskAssignments(existing, desiredUserIds)

  let removed = 0
  for (const userId of toRemove) {
    const deleted = await TaskAssignmentModel.removeUncompleted(taskId, userId)
    if (deleted) removed += 1
  }

  let added = 0
  for (const userId of toAdd) {
    await TaskAssignmentModel.ensure(taskId, userId)
    added += 1
  }

  return { added, removed }
}

module.exports = {
  diffTaskAssignments,
  reconcileTaskAssignments,
}
