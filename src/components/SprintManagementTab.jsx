import { useEffect, useState } from 'react'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useSprintStore } from '../stores/sprintStore'
import SprintStatusWidget from './SprintStatusWidget'

const INPUT_CLASS =
  'ds-input-field ds-focus-ring h-11 px-3 rounded-[var(--radius-md)] border border-[color:var(--color-border)] text-[length:var(--text-body)] text-[color:var(--color-gray-800)] bg-[color:var(--color-bg)] w-full'

export default function SprintManagementTab() {
  const workspace = useWorkspaceStore((s) => s.workspace)
  const fetchMine = useWorkspaceStore((s) => s.fetchMine)
  const sprints = useSprintStore((s) => s.sprints)
  const activeSprint = useSprintStore((s) => s.activeSprint)
  const isLoading = useSprintStore((s) => s.isLoading)
  const error = useSprintStore((s) => s.error)
  const fetchSprints = useSprintStore((s) => s.fetchSprints)
  const fetchActiveSprint = useSprintStore((s) => s.fetchActiveSprint)
  const createSprint = useSprintStore((s) => s.createSprint)
  const closeSprintById = useSprintStore((s) => s.closeSprintById)

  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [confirmCloseId, setConfirmCloseId] = useState(null)
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    fetchMine()
      .then((ws) => {
        if (ws?.id) {
          fetchSprints(ws.id).catch(() => {})
          fetchActiveSprint(ws.id).catch(() => {})
        }
      })
      .catch(() => {})
  }, [fetchMine, fetchSprints, fetchActiveSprint])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!workspace?.id || !name.trim()) {
      setFormError('Sprint name is required.')
      return
    }
    if (startDate && endDate && endDate < startDate) {
      setFormError('End date must be on or after the start date.')
      return
    }
    setFormError(null)
    try {
      await createSprint(workspace.id, {
        name: name.trim(),
        startDate: startDate || null,
        endDate: endDate || null,
      })
      setName('')
      setStartDate('')
      setEndDate('')
      await fetchSprints(workspace.id)
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleClose = async (sprintId) => {
    if (!workspace?.id) return
    try {
      await closeSprintById(sprintId, workspace.id)
      setConfirmCloseId(null)
      await fetchSprints(workspace.id)
      await fetchActiveSprint(workspace.id)
    } catch (err) {
      setFormError(err.message)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="ds-card ds-card-pad">
        <h2 className="ds-section-title mb-4">Create Sprint</h2>
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="ds-body-sm font-medium text-[color:var(--color-gray-700)]">Sprint name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={INPUT_CLASS}
              placeholder="Sprint 1"
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="ds-body-sm font-medium text-[color:var(--color-gray-700)]">Start date</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={INPUT_CLASS}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="ds-body-sm font-medium text-[color:var(--color-gray-700)]">End date</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={INPUT_CLASS}
              />
            </label>
          </div>
          {formError && <p className="ds-body-sm text-[color:var(--color-error-600)]">{formError}</p>}
          {error && !formError && <p className="ds-body-sm text-[color:var(--color-error-600)]">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="h-11 ds-btn-primary ds-focus-ring rounded-[var(--radius-md)] text-[length:var(--text-body)] font-medium"
          >
            {isLoading ? 'Saving…' : 'Create Sprint'}
          </button>
        </form>
      </div>

      {activeSprint && (
        <div className="ds-card ds-card-pad">
          <h2 className="ds-section-title mb-4">Current season</h2>
          <SprintStatusWidget sprint={activeSprint} className="mb-4" />
          {confirmCloseId === activeSprint.id ? (
            <div className="flex items-center gap-3 flex-wrap">
              <p className="ds-body text-[color:var(--color-gray-700)]">
                Close this season? Season score resets for everyone. Levels and coins stay.
              </p>
              <button
                type="button"
                onClick={() => handleClose(activeSprint.id)}
                className="h-10 px-4 rounded-[var(--radius-md)] bg-[color:var(--color-error-500)] text-white ds-body-sm font-medium cursor-pointer ds-focus-ring transition-colors hover:bg-[color:var(--color-error-600)]"
              >
                Confirm Close
              </button>
              <button
                type="button"
                onClick={() => setConfirmCloseId(null)}
                className="h-10 px-4 rounded-[var(--radius-md)] border border-[color:var(--color-border-soft)] ds-body-sm cursor-pointer hover:bg-[color:var(--color-bg-subtle)] ds-focus-ring transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmCloseId(activeSprint.id)}
              className="h-10 px-4 rounded-[var(--radius-md)] border border-[color:var(--color-error-500)] text-[color:var(--color-error-500)] ds-body-sm font-medium cursor-pointer hover:bg-[color:var(--color-error-50)] ds-focus-ring transition-colors"
            >
              Close Sprint
            </button>
          )}
        </div>
      )}

      <div className="ds-card ds-card-pad">
        <h2 className="ds-section-title mb-4">All Sprints</h2>
        {sprints.length === 0 ? (
          <p className="ds-body">No sprints yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {sprints.map((sprint) => (
              <div key={sprint.id} className="border border-[color:var(--color-border-soft)] rounded-[var(--radius-md)] px-4 py-3 bg-[color:var(--color-card-surface)] shadow-[var(--shadow-soft-sm)]">
                <SprintStatusWidget sprint={sprint} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
