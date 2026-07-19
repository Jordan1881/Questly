import { afterEach, beforeEach, describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Toast from '../../components/Toast'
import { useToastStore } from '../../stores/toastStore'

describe('Toast', () => {
  beforeEach(() => {
    useToastStore.setState({ message: null, type: 'success' })
  })

  afterEach(() => {
    useToastStore.setState({ message: null, type: 'success' })
  })

  it('renders nothing when there is no message', () => {
    const { container } = render(<Toast />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a success toast with the status role', () => {
    useToastStore.setState({ message: 'Saved!', type: 'success' })
    render(<Toast />)
    const toast = screen.getByRole('status')
    expect(toast).toHaveTextContent('Saved!')
    expect(toast).toHaveClass('text-white')
    expect(toast.style.background).toContain('linear-gradient')
  })

  it('renders an error toast with the alert role', () => {
    useToastStore.setState({ message: 'Something broke', type: 'error' })
    render(<Toast />)
    const toast = screen.getByRole('alert')
    expect(toast).toHaveTextContent('Something broke')
    expect(toast.style.background).toBe('var(--color-error-50)')
  })

  it('falls back to success styling for an unknown type', () => {
    useToastStore.setState({ message: 'Mystery', type: 'weird' })
    render(<Toast />)
    const toast = screen.getByRole('status')
    expect(toast).toHaveTextContent('Mystery')
    expect(toast).toHaveClass('text-white')
  })
})
