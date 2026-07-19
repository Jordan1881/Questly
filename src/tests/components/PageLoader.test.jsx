import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PageLoader from '../../components/PageLoader'

describe('PageLoader', () => {
  it('renders an accessible loading status with a spinner', () => {
    const { container } = render(<PageLoader />)
    const status = screen.getByRole('status', { name: 'Loading page' })
    expect(status).toBeInTheDocument()
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })
})
