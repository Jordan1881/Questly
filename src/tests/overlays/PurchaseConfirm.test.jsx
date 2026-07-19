import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PurchaseConfirm from '../../overlays/PurchaseConfirm'

const reward = { title: 'Coffee Voucher', coinCost: 30 }

describe('PurchaseConfirm overlay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when there is no reward', () => {
    const { container } = render(
      <PurchaseConfirm reward={null} currentCoins={100} onConfirm={() => {}} onCancel={() => {}} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders reward details and computed remaining balance', () => {
    render(
      <PurchaseConfirm reward={reward} currentCoins={100} onConfirm={() => {}} onCancel={() => {}} />,
    )

    expect(screen.getByRole('heading', { name: 'Confirm purchase' })).toBeInTheDocument()
    expect(screen.getByText('Coffee Voucher')).toBeInTheDocument()
    expect(screen.getByText('30 Coins')).toBeInTheDocument()
    expect(screen.getByText('100 Coins')).toBeInTheDocument()
    expect(screen.getByText('70 Coins')).toBeInTheDocument()
  })

  it('supports a negative remaining balance', () => {
    render(
      <PurchaseConfirm reward={reward} currentCoins={10} onConfirm={() => {}} onCancel={() => {}} />,
    )
    expect(screen.getByText('-20 Coins')).toBeInTheDocument()
  })

  it('invokes onConfirm when the confirm button is clicked', () => {
    const onConfirm = vi.fn()
    render(
      <PurchaseConfirm reward={reward} currentCoins={100} onConfirm={onConfirm} onCancel={() => {}} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Confirm purchase' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('invokes onCancel when the cancel button is clicked', () => {
    const onCancel = vi.fn()
    render(
      <PurchaseConfirm reward={reward} currentCoins={100} onConfirm={() => {}} onCancel={onCancel} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('invokes onCancel when the backdrop is clicked', () => {
    const onCancel = vi.fn()
    const { container } = render(
      <PurchaseConfirm reward={reward} currentCoins={100} onConfirm={() => {}} onCancel={onCancel} />,
    )

    fireEvent.click(container.firstChild)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('does not invoke onCancel when clicking inside the dialog card', () => {
    const onCancel = vi.fn()
    render(
      <PurchaseConfirm reward={reward} currentCoins={100} onConfirm={() => {}} onCancel={onCancel} />,
    )

    fireEvent.click(screen.getByRole('heading', { name: 'Confirm purchase' }))
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('shows a loading label and disables both buttons while purchasing', () => {
    render(
      <PurchaseConfirm
        reward={reward}
        currentCoins={100}
        isLoading
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    )

    expect(screen.getByRole('button', { name: 'Purchasing…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Confirm purchase' })).not.toBeInTheDocument()
  })
})
