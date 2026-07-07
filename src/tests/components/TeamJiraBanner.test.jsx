import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import TeamJiraBanner from '../../components/TeamJiraBanner'

function renderBanner(user) {
  return render(
    <MemoryRouter>
      <TeamJiraBanner user={user} />
    </MemoryRouter>,
  )
}

describe('TeamJiraBanner', () => {
  it('renders nothing when developer has no workspace', () => {
    const { container } = renderBanner({ workspace_id: null })
    expect(container).toBeEmptyDOMElement()
  })

  it('shows team site host when workspace Jira is ready and personal Jira is not connected', () => {
    renderBanner({
      workspace_id: 'ws-1',
      jira_connected: false,
      team_jira_connected: true,
      team_jira_site_host: 'acme.atlassian.net',
    })

    expect(screen.getByText(/acme\.atlassian\.net/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /connect your Jira account in Settings/i })).toHaveAttribute(
      'href',
      '/settings',
    )
  })

  it('shows admin-not-connected message when team Jira is not ready', () => {
    renderBanner({
      workspace_id: 'ws-1',
      jira_connected: false,
      team_jira_connected: false,
    })

    expect(screen.getByText(/admin has not connected team Jira yet/i)).toBeInTheDocument()
  })
})
