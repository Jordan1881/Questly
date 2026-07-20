import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonList,
  SkeletonRewardGrid,
} from '../../components/Skeleton'

describe('Skeleton', () => {
  it('renders a decorative placeholder hidden from assistive tech', () => {
    const { container } = render(<Skeleton />)
    const el = container.firstChild
    expect(el).toHaveAttribute('aria-hidden', 'true')
    expect(el).toHaveClass('animate-pulse')
  })

  it('merges an extra className', () => {
    const { container } = render(<Skeleton className="h-4 w-10" />)
    expect(container.firstChild).toHaveClass('h-4', 'w-10')
  })
})

describe('SkeletonText', () => {
  it('renders the default number of lines', () => {
    const { container } = render(<SkeletonText />)
    const wrapper = screen.getByLabelText('Loading')
    expect(wrapper).toHaveAttribute('aria-busy', 'true')
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(3)
  })

  it('renders a custom number of lines and shortens the last one', () => {
    const { container } = render(<SkeletonText lines={4} className="mt-2" />)
    const lines = container.querySelectorAll('[aria-hidden="true"]')
    expect(lines).toHaveLength(4)
    expect(screen.getByLabelText('Loading')).toHaveClass('mt-2')
    // last line is narrower (w-2/3), earlier lines are full-width
    expect(lines[3]).toHaveClass('w-2/3')
    expect(lines[0]).toHaveClass('w-full')
  })
})

describe('SkeletonCard', () => {
  it('renders a busy card with several placeholders', () => {
    const { container } = render(<SkeletonCard className="extra" />)
    const card = screen.getByLabelText('Loading')
    expect(card).toHaveAttribute('aria-busy', 'true')
    expect(card).toHaveClass('extra', 'ds-card')
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(4)
  })
})

describe('SkeletonList', () => {
  it('renders the default count of rows', () => {
    render(<SkeletonList />)
    const list = screen.getByLabelText('Loading')
    expect(list).toHaveAttribute('aria-busy', 'true')
    // 3 rows × 4 skeletons each = 12
    expect(list.querySelectorAll('[aria-hidden="true"]')).toHaveLength(12)
  })

  it('honors a custom count and className', () => {
    render(<SkeletonList count={2} className="gapper" />)
    const list = screen.getByLabelText('Loading')
    expect(list).toHaveClass('gapper')
    expect(list.querySelectorAll('[aria-hidden="true"]')).toHaveLength(8)
  })
})

describe('SkeletonRewardGrid', () => {
  it('renders the default number of reward cards', () => {
    render(<SkeletonRewardGrid />)
    const grid = screen.getByLabelText('Loading rewards')
    expect(grid).toHaveAttribute('aria-busy', 'true')
    // 4 cards × 4 skeletons each = 16
    expect(grid.querySelectorAll('[aria-hidden="true"]')).toHaveLength(16)
  })

  it('honors a custom count and className', () => {
    render(<SkeletonRewardGrid count={1} className="grid-extra" />)
    const grid = screen.getByLabelText('Loading rewards')
    expect(grid).toHaveClass('grid-extra')
    expect(grid.querySelectorAll('[aria-hidden="true"]')).toHaveLength(4)
  })
})
