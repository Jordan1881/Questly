import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import XpApprovalsTab from '../../components/XpApprovalsTab'

const store = {
  workspace: { id: 'ws-1' },
  pendingXpApprovals: [],
  error: null,
  fetchMine: vi.fn(),
  fetchPendingXpApprovals: vi.fn(),
  reviewXpApproval: vi.fn(),
}

vi.mock('../../stores/workspaceStore', () => ({
  useWorkspaceStore: () => store,
}))

const approvals = [
  {
    id: 'xp-1',
    username: 'Dana',
    email: 'dana@example.com',
    task_title: 'Fix login bug',
    jira_issue_key: 'SCRUM-1',
    xp_amount: 40,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'xp-2',
    username: 'Omer',
    email: 'omer@example.com',
    task_title: 'Add dashboard',
    jira_issue_key: 'SCRUM-2',
    xp_amount: 70,
    created_at: '2026-01-02T00:00:00Z',
  },
]

describe('XpApprovalsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    store.workspace = { id: 'ws-1' }
    store.pendingXpApprovals = []
    store.error = null
    store.fetchMine = vi.fn().mockResolvedValue({ id: 'ws-1' })
    store.fetchPendingXpApprovals = vi.fn().mockResolvedValue(undefined)
    store.reviewXpApproval = vi.fn().mockResolvedValue(undefined)
  })

  it('fetches approvals on mount and shows the empty state', async () => {
    render(<XpApprovalsTab />)

    await waitFor(() => {
      expect(store.fetchMine).toHaveBeenCalled()
      expect(store.fetchPendingXpApprovals).toHaveBeenCalledWith('ws-1')
    })

    expect(screen.getByText('All caught up!')).toBeInTheDocument()
    expect(screen.getByText('0 completions awaiting XP approval')).toBeInTheDocument()
  })

  it('renders the approvals table with singular count for one item', () => {
    store.pendingXpApprovals = [approvals[0]]
    render(<XpApprovalsTab />)

    expect(screen.getByText('1 completion awaiting XP approval')).toBeInTheDocument()
    expect(screen.getByText('Dana')).toBeInTheDocument()
    expect(screen.getByText('Fix login bug')).toBeInTheDocument()
    expect(screen.getByText('SCRUM-1')).toBeInTheDocument()
    expect(screen.getByText('+40 XP')).toBeInTheDocument()
  })

  it('uses plural count for multiple approvals', () => {
    store.pendingXpApprovals = approvals
    render(<XpApprovalsTab />)

    expect(screen.getByText('2 completions awaiting XP approval')).toBeInTheDocument()
  })

  it('displays the store error when present', () => {
    store.error = 'Approval failed'
    render(<XpApprovalsTab />)

    expect(screen.getByText('Approval failed')).toBeInTheDocument()
  })

  describe('review actions', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('approves an XP request', async () => {
      store.pendingXpApprovals = [approvals[0]]
      render(<XpApprovalsTab />)

      fireEvent.click(screen.getByRole('button', { name: /Approve XP/ }))
      expect(screen.getByText('✓ Approved')).toBeInTheDocument()

      await vi.advanceTimersByTimeAsync(800)

      expect(store.reviewXpApproval).toHaveBeenCalledWith('ws-1', 'xp-1', 'approved')
    })

    it('rejects an XP request', async () => {
      store.pendingXpApprovals = [approvals[0]]
      render(<XpApprovalsTab />)

      fireEvent.click(screen.getByRole('button', { name: /Reject/ }))
      expect(screen.getByText('✗ Rejected')).toBeInTheDocument()

      await vi.advanceTimersByTimeAsync(800)

      expect(store.reviewXpApproval).toHaveBeenCalledWith('ws-1', 'xp-1', 'rejected')
    })

    it('does not review when there is no active workspace', async () => {
      store.workspace = null
      store.pendingXpApprovals = [approvals[0]]
      render(<XpApprovalsTab />)

      fireEvent.click(screen.getByRole('button', { name: /Approve XP/ }))
      await vi.advanceTimersByTimeAsync(800)

      expect(store.reviewXpApproval).not.toHaveBeenCalled()
    })
  })
})
