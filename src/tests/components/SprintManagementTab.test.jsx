import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SprintManagementTab from '../../components/SprintManagementTab'

const wsState = {
  workspace: { id: 'ws-1' },
  fetchMine: vi.fn(),
}

const spState = {
  sprints: [],
  activeSprint: null,
  isLoading: false,
  error: null,
  fetchSprints: vi.fn(),
  fetchActiveSprint: vi.fn(),
  createSprint: vi.fn(),
  closeSprintById: vi.fn(),
}

vi.mock('../../stores/workspaceStore', () => ({
  useWorkspaceStore: (selector) => selector(wsState),
}))

vi.mock('../../stores/sprintStore', () => ({
  useSprintStore: (selector) => selector(spState),
}))

describe('SprintManagementTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    wsState.workspace = { id: 'ws-1' }
    wsState.fetchMine = vi.fn().mockResolvedValue({ id: 'ws-1' })

    spState.sprints = []
    spState.activeSprint = null
    spState.isLoading = false
    spState.error = null
    spState.fetchSprints = vi.fn().mockResolvedValue(undefined)
    spState.fetchActiveSprint = vi.fn().mockResolvedValue(undefined)
    spState.createSprint = vi.fn().mockResolvedValue(undefined)
    spState.closeSprintById = vi.fn().mockResolvedValue(undefined)
  })

  it('fetches sprints on mount and shows the empty list', async () => {
    render(<SprintManagementTab />)

    await waitFor(() => {
      expect(wsState.fetchMine).toHaveBeenCalled()
      expect(spState.fetchSprints).toHaveBeenCalledWith('ws-1')
      expect(spState.fetchActiveSprint).toHaveBeenCalledWith('ws-1')
    })

    expect(screen.getByRole('heading', { name: 'Create Sprint' })).toBeInTheDocument()
    expect(screen.getByText('No sprints yet.')).toBeInTheDocument()
  })

  it('validates that a sprint name is required', async () => {
    const user = userEvent.setup()
    render(<SprintManagementTab />)

    await user.click(screen.getByRole('button', { name: 'Create Sprint' }))

    expect(screen.getByText('Sprint name is required.')).toBeInTheDocument()
    expect(spState.createSprint).not.toHaveBeenCalled()
  })

  it('validates that the end date is on or after the start date', async () => {
    const user = userEvent.setup()
    render(<SprintManagementTab />)

    await user.type(screen.getByPlaceholderText('Sprint 1'), 'Sprint A')
    const dateInputs = document.querySelectorAll('input[type="date"]')
    fireEvent.change(dateInputs[0], { target: { value: '2026-02-10' } })
    fireEvent.change(dateInputs[1], { target: { value: '2026-02-01' } })

    await user.click(screen.getByRole('button', { name: 'Create Sprint' }))

    expect(screen.getByText('End date must be on or after the start date.')).toBeInTheDocument()
    expect(spState.createSprint).not.toHaveBeenCalled()
  })

  it('creates a sprint with null dates when they are empty', async () => {
    const user = userEvent.setup()
    render(<SprintManagementTab />)

    await user.type(screen.getByPlaceholderText('Sprint 1'), '  Sprint A  ')
    await user.click(screen.getByRole('button', { name: 'Create Sprint' }))

    await waitFor(() => {
      expect(spState.createSprint).toHaveBeenCalledWith('ws-1', {
        name: 'Sprint A',
        startDate: null,
        endDate: null,
      })
    })
    expect(spState.fetchSprints).toHaveBeenCalledWith('ws-1')
  })

  it('creates a sprint with provided dates', async () => {
    const user = userEvent.setup()
    render(<SprintManagementTab />)

    await user.type(screen.getByPlaceholderText('Sprint 1'), 'Sprint B')
    const dateInputs = document.querySelectorAll('input[type="date"]')
    fireEvent.change(dateInputs[0], { target: { value: '2026-02-01' } })
    fireEvent.change(dateInputs[1], { target: { value: '2026-02-14' } })

    await user.click(screen.getByRole('button', { name: 'Create Sprint' }))

    await waitFor(() => {
      expect(spState.createSprint).toHaveBeenCalledWith('ws-1', {
        name: 'Sprint B',
        startDate: '2026-02-01',
        endDate: '2026-02-14',
      })
    })
  })

  it('shows a form error when creation rejects', async () => {
    spState.createSprint = vi.fn().mockRejectedValue(new Error('Create failed'))
    const user = userEvent.setup()
    render(<SprintManagementTab />)

    await user.type(screen.getByPlaceholderText('Sprint 1'), 'Sprint C')
    await user.click(screen.getByRole('button', { name: 'Create Sprint' }))

    expect(await screen.findByText('Create failed')).toBeInTheDocument()
  })

  it('shows the loading label and disables the submit button', () => {
    spState.isLoading = true
    render(<SprintManagementTab />)

    const button = screen.getByRole('button', { name: 'Saving…' })
    expect(button).toBeDisabled()
  })

  it('shows the store error when there is no form error', () => {
    spState.error = 'Server exploded'
    render(<SprintManagementTab />)

    expect(screen.getByText('Server exploded')).toBeInTheDocument()
  })

  it('requires a workspace before creating a sprint', async () => {
    wsState.workspace = null
    const user = userEvent.setup()
    render(<SprintManagementTab />)

    await user.type(screen.getByPlaceholderText('Sprint 1'), 'Sprint D')
    await user.click(screen.getByRole('button', { name: 'Create Sprint' }))

    expect(screen.getByText('Sprint name is required.')).toBeInTheDocument()
    expect(spState.createSprint).not.toHaveBeenCalled()
  })

  it('renders the sprint list when sprints exist', () => {
    spState.sprints = [
      { id: 's1', name: 'Season One', status: 'completed', startDate: null, endDate: null },
      { id: 's2', name: 'Season Two', status: 'completed', startDate: null, endDate: null },
    ]
    render(<SprintManagementTab />)

    expect(screen.getByText('Season One')).toBeInTheDocument()
    expect(screen.getByText('Season Two')).toBeInTheDocument()
    expect(screen.queryByText('No sprints yet.')).not.toBeInTheDocument()
  })

  it('confirms and closes the active sprint', async () => {
    spState.activeSprint = { id: 'active-1', name: 'Live Season', status: 'active', startDate: null, endDate: null }
    const user = userEvent.setup()
    render(<SprintManagementTab />)

    expect(screen.getByRole('heading', { name: 'Current season' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Close Sprint' }))
    expect(screen.getByRole('button', { name: 'Confirm Close' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Confirm Close' }))

    await waitFor(() => {
      expect(spState.closeSprintById).toHaveBeenCalledWith('active-1', 'ws-1')
    })
    expect(spState.fetchActiveSprint).toHaveBeenCalledWith('ws-1')
  })

  it('cancels the close confirmation', async () => {
    spState.activeSprint = { id: 'active-1', name: 'Live Season', status: 'active', startDate: null, endDate: null }
    const user = userEvent.setup()
    render(<SprintManagementTab />)

    await user.click(screen.getByRole('button', { name: 'Close Sprint' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByRole('button', { name: 'Close Sprint' })).toBeInTheDocument()
    expect(spState.closeSprintById).not.toHaveBeenCalled()
  })

  it('surfaces an error when closing a sprint rejects', async () => {
    spState.activeSprint = { id: 'active-1', name: 'Live Season', status: 'active', startDate: null, endDate: null }
    spState.closeSprintById = vi.fn().mockRejectedValue(new Error('Close failed'))
    const user = userEvent.setup()
    render(<SprintManagementTab />)

    await user.click(screen.getByRole('button', { name: 'Close Sprint' }))
    await user.click(screen.getByRole('button', { name: 'Confirm Close' }))

    expect(await screen.findByText('Close failed')).toBeInTheDocument()
  })
})
