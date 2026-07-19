import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import NoWorkspacePrompt from '../../components/NoWorkspacePrompt'

function renderPrompt(props) {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<NoWorkspacePrompt {...props} />} />
        <Route path="/workspace/join" element={<div>Join page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('NoWorkspacePrompt', () => {
  it('renders default title and description', () => {
    renderPrompt()
    expect(screen.getByRole('heading', { name: 'Join a team to get started' })).toBeInTheDocument()
    expect(screen.getByText(/turn Jira issues into quests/i)).toBeInTheDocument()
  })

  it('renders custom title and description', () => {
    renderPrompt({ title: 'Custom title', description: 'Custom description' })
    expect(screen.getByRole('heading', { name: 'Custom title' })).toBeInTheDocument()
    expect(screen.getByText('Custom description')).toBeInTheDocument()
  })

  it('hides the Jira hint by default', () => {
    renderPrompt()
    expect(screen.queryByText(/connect your Jira account on Profile/i)).not.toBeInTheDocument()
  })

  it('shows the Jira hint when enabled', () => {
    renderPrompt({ showJiraHint: true })
    expect(screen.getByText(/connect your Jira account on Profile/i)).toBeInTheDocument()
  })

  it('navigates to the join workspace route on button click', async () => {
    const user = userEvent.setup()
    renderPrompt()
    await user.click(screen.getByRole('button', { name: 'Join a workspace' }))
    expect(screen.getByText('Join page')).toBeInTheDocument()
  })
})
