import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import JoinRequestsTab from '../../components/JoinRequestsTab'

const store = {
  workspace: { id: 'ws-1' },
  pendingJoinRequests: [],
  error: null,
  fetchMine: vi.fn(),
  fetchPendingJoinRequests: vi.fn(),
  fetchMembers: vi.fn(),
  reviewJoinRequest: vi.fn(),
}

vi.mock('../../stores/workspaceStore', () => ({
  useWorkspaceStore: () => store,
}))

const requests = [
  { id: 'req-1', username: 'Dana', email: 'dana@example.com', created_at: '2026-01-01T00:00:00Z' },
  { id: 'req-2', username: 'Omer', email: 'omer@example.com', created_at: '2026-01-02T00:00:00Z' },
]

describe('JoinRequestsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    store.workspace = { id: 'ws-1' }
    store.pendingJoinRequests = []
    store.error = null
    store.fetchMine = vi.fn().mockResolvedValue({ id: 'ws-1' })
    store.fetchPendingJoinRequests = vi.fn().mockResolvedValue(undefined)
    store.fetchMembers = vi.fn().mockResolvedValue(undefined)
    store.reviewJoinRequest = vi.fn().mockResolvedValue(undefined)
  })

  it('fetches pending requests on mount and shows the empty state', async () => {
    render(<JoinRequestsTab />)

    await waitFor(() => {
      expect(store.fetchMine).toHaveBeenCalled()
      expect(store.fetchPendingJoinRequests).toHaveBeenCalledWith('ws-1')
    })

    expect(screen.getByText('All caught up!')).toBeInTheDocument()
    expect(screen.getByText('0 requests awaiting review')).toBeInTheDocument()
  })

  it('renders the request table with singular count for one request', () => {
    store.pendingJoinRequests = [requests[0]]
    render(<JoinRequestsTab />)

    expect(screen.getByText('1 request awaiting review')).toBeInTheDocument()
    expect(screen.getByText('Dana')).toBeInTheDocument()
    expect(screen.getByText('dana@example.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Approve/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Reject/ })).toBeInTheDocument()
  })

  it('uses plural count for multiple requests', () => {
    store.pendingJoinRequests = requests
    render(<JoinRequestsTab />)

    expect(screen.getByText('2 requests awaiting review')).toBeInTheDocument()
  })

  it('displays the store error when present', () => {
    store.error = 'Something went wrong'
    render(<JoinRequestsTab />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  describe('review actions', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('approves a request and refreshes members', async () => {
      store.pendingJoinRequests = [requests[0]]
      render(<JoinRequestsTab />)

      fireEvent.click(screen.getByRole('button', { name: /Approve/ }))
      expect(screen.getByText('✓ Approved')).toBeInTheDocument()

      await vi.advanceTimersByTimeAsync(800)

      expect(store.reviewJoinRequest).toHaveBeenCalledWith('ws-1', 'req-1', 'approved')
      expect(store.fetchMembers).toHaveBeenCalledWith('ws-1')
    })

    it('rejects a request without refreshing members', async () => {
      store.pendingJoinRequests = [requests[0]]
      render(<JoinRequestsTab />)

      fireEvent.click(screen.getByRole('button', { name: /Reject/ }))
      expect(screen.getByText('✗ Rejected')).toBeInTheDocument()

      await vi.advanceTimersByTimeAsync(800)

      expect(store.reviewJoinRequest).toHaveBeenCalledWith('ws-1', 'req-1', 'rejected')
      expect(store.fetchMembers).not.toHaveBeenCalled()
    })

    it('does not review when there is no active workspace', async () => {
      store.workspace = null
      store.pendingJoinRequests = [requests[0]]
      render(<JoinRequestsTab />)

      fireEvent.click(screen.getByRole('button', { name: /Approve/ }))
      await vi.advanceTimersByTimeAsync(800)

      expect(store.reviewJoinRequest).not.toHaveBeenCalled()
    })
  })
})
