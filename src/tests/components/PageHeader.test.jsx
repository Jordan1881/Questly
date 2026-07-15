import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import PageHeader from '../../components/PageHeader'

vi.mock('../../stores/authStore', () => ({
  useAuthStore: (selector) =>
    selector({
      userRole: 'developer',
      user: { username: 'Yarden', workspace_id: 'ws-1', lifetime_xp: 0 },
      memberships: undefined,
      activeWorkspaceId: null,
      activeMembership: null,
    }),
}))

describe('PageHeader', () => {
  it('shows the logged-in username instead of demo placeholders', () => {
    render(
      <MemoryRouter>
        <PageHeader onOpenSidebar={vi.fn()} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Yarden')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Questly home' })).toBeInTheDocument()
    expect(screen.queryByText('Ashton_44')).not.toBeInTheDocument()
    expect(screen.queryByText('Admin_User')).not.toBeInTheDocument()
  })
})
