import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { BurgerIcon, CheckmarkIcon, StarIcon } from '../../components/icons'

describe('BurgerIcon', () => {
  it('renders an svg with a menu path', () => {
    const { container } = render(<BurgerIcon />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('w-6', 'h-6')
    expect(container.querySelector('path')).toHaveAttribute('stroke', '#374151')
  })
})

describe('CheckmarkIcon', () => {
  it('renders a white checkmark path', () => {
    const { container } = render(<CheckmarkIcon />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(container.querySelector('path')).toHaveAttribute('stroke', 'white')
  })
})

describe('StarIcon', () => {
  it('uses default color and size', () => {
    const { container } = render(<StarIcon />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '16')
    expect(svg).toHaveAttribute('height', '16')
    expect(container.querySelector('path')).toHaveAttribute('fill', '#942fcd')
  })

  it('accepts a custom color and size', () => {
    const { container } = render(<StarIcon color="#000000" size={32} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '32')
    expect(svg).toHaveAttribute('height', '32')
    expect(container.querySelector('path')).toHaveAttribute('fill', '#000000')
  })
})
