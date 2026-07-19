import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import AuthLayout, { authInputClass } from '../../../components/layout/AuthLayout'

function renderLayout(props = {}, children = <div>form body</div>) {
  return render(
    <MemoryRouter>
      <AuthLayout {...props}>{children}</AuthLayout>
    </MemoryRouter>,
  )
}

describe('AuthLayout', () => {
  it('exports a shared input class string', () => {
    expect(typeof authInputClass).toBe('string')
    expect(authInputClass).toContain('ds-input-field')
  })

  it('renders the default split layout with a home logo link and children', () => {
    renderLayout()
    expect(screen.getByRole('link', { name: 'Questly home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('img', { name: 'Questly' })).toBeInTheDocument()
    expect(screen.getByText('form body')).toBeInTheDocument()
  })

  it('does not render the left column when no text props are provided', () => {
    renderLayout()
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('renders title, subtitle, footer and leftExtra in the left column', () => {
    renderLayout({
      title: 'Welcome back',
      subtitle: 'Sign in to continue',
      footer: <span>footer content</span>,
      leftExtra: <span>extra content</span>,
    })
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(screen.getByText('Sign in to continue')).toBeInTheDocument()
    expect(screen.getByText('footer content')).toBeInTheDocument()
    expect(screen.getByText('extra content')).toBeInTheDocument()
  })

  it('renders the centered shell variant with logo and children', () => {
    renderLayout({ centered: true, className: 'my-page', logoClassName: 'my-logo' })
    const link = screen.getByRole('link', { name: 'Questly home' })
    expect(link).toHaveClass('my-logo')
    expect(screen.getByText('form body')).toBeInTheDocument()
    // centered variant does not render the title heading region
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('applies a custom className and logoClassName in the default variant', () => {
    renderLayout({ title: 'Hi', className: 'default-page', logoClassName: 'default-logo' })
    expect(screen.getByRole('link', { name: 'Questly home' })).toHaveClass('default-logo')
  })
})
