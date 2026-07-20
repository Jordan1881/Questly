import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import LegalFooterLinks, { LegalAgreementText } from '../../components/LegalFooterLinks'

describe('LegalFooterLinks', () => {
  it('renders Terms and Privacy links pointing at the right routes', () => {
    render(
      <MemoryRouter>
        <LegalFooterLinks />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms')
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy')
    expect(screen.getByRole('navigation', { name: 'Legal' })).toBeInTheDocument()
  })

  it('applies a custom className to the nav', () => {
    render(
      <MemoryRouter>
        <LegalFooterLinks className="my-legal" />
      </MemoryRouter>,
    )
    expect(screen.getByRole('navigation', { name: 'Legal' })).toHaveClass('my-legal')
  })
})

describe('LegalAgreementText', () => {
  it('renders the agreement copy with both links', () => {
    render(
      <MemoryRouter>
        <LegalAgreementText />
      </MemoryRouter>,
    )
    expect(screen.getByText(/By using Questly, you agree/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms')
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy')
  })

  it('applies a custom className to the paragraph', () => {
    render(
      <MemoryRouter>
        <LegalAgreementText className="custom-copy" />
      </MemoryRouter>,
    )
    expect(screen.getByText(/By using Questly, you agree/i)).toHaveClass('custom-copy')
  })
})
