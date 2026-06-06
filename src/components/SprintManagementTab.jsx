import { useEffect, useState } from 'react'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useSprintStore } from '../stores/sprintStore'
import SprintStatusWidget from './SprintStatusWidget'

const CARD = 'bg-white border border-[#e5e7eb] rounded-[12px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.10)]'

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
      <div className={`${CARD} p-6`}>
        <h2 className="text-[18px] font-semibold text-[#1f2937] mb-4">Create Sprint</h2>
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[#374151]">Sprint name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 px-3 rounded-[8px] border border-[#e5e7eb] text-[14px]"
              placeholder="Sprint 1"
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[#374151]">Start date</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-11 px-3 rounded-[8px] border border-[#e5e7eb] text-[14px]"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[#374151]">End date</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-11 px-3 rounded-[8px] border border-[#e5e7eb] text-[14px]"
              />
            </label>
          </div>
          {formError && <p className="text-[13px] text-red-600">{formError}</p>}
          {error && !formError && <p className="text-[13px] text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="h-11 rounded-[8px] text-[14px] font-medium text-white cursor-pointer disabled:opacity-60"
            style={{ background: 'linear-gradient(to bottom, #942fcd, #ca9af4)' }}
          >
            {isLoading ? 'Saving…' : 'Create Sprint'}
          </button>
        </form>
      </div>

      {activeSprint && (
        <div className={`${CARD} p-6`}>
          <h2 className="text-[18px] font-semibold text-[#1f2937] mb-4">Active Sprint</h2>
          <SprintStatusWidget sprint={activeSprint} className="mb-4" />
          {confirmCloseId === activeSprint.id ? (
            <div className="flex items-center gap-3">
              <p className="text-[14px] text-[#374151]">Close sprint and reset all developer sprint XP?</p>
              <button
                type="button"
                onClick={() => handleClose(activeSprint.id)}
                className="h-10 px-4 rounded-[8px] bg-[#ef4444] text-white text-[13px] font-medium cursor-pointer"
              >
                Confirm Close
              </button>
              <button
                type="button"
                onClick={() => setConfirmCloseId(null)}
                className="h-10 px-4 rounded-[8px] border border-[#e5e7eb] text-[13px] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmCloseId(activeSprint.id)}
              className="h-10 px-4 rounded-[8px] border border-[#ef4444] text-[#ef4444] text-[13px] font-medium cursor-pointer"
            >
              Close Sprint
            </button>
          )}
        </div>
      )}

      <div className={`${CARD} p-6`}>
        <h2 className="text-[18px] font-semibold text-[#1f2937] mb-4">All Sprints</h2>
        {sprints.length === 0 ? (
          <p className="text-[14px] text-[#6b7280]">No sprints yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {sprints.map((sprint) => (
              <div key={sprint.id} className="border border-[#e5e7eb] rounded-[8px] px-4 py-3">
                <SprintStatusWidget sprint={sprint} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
