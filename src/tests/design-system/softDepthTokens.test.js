import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Seam: design-token / ds-* soft-depth contract (spec #258 / T0–T6).
 * Asserts token source of truth — not pixel screenshots.
 */
const tokensPath = resolve(process.cwd(), 'src/design-system/tokens.css')
const indexCssPath = resolve(process.cwd(), 'src/index.css')

describe('soft-depth design tokens', () => {
  let css
  let indexCss

  beforeAll(() => {
    css = readFileSync(tokensPath, 'utf8')
    indexCss = readFileSync(indexCssPath, 'utf8')
  })

  it('defines soft-depth canvas, card surface, border, layered shadows, focus, and chrome tint', () => {
    const softDepthTokens = [
      '--color-bg-canvas',
      '--color-card-surface',
      '--color-border-soft',
      '--shadow-soft-sm',
      '--shadow-soft-md',
      '--focus-ring-soft',
      '--color-chrome-tint',
      '--color-chrome-surface',
    ]
    for (const token of softDepthTokens) {
      expect(css, `missing ${token} in tokens.css`).toMatch(new RegExp(`${token}\\s*:`))
    }
  })

  it('wires ds-page, ds-card, and ds-chrome utilities to soft-depth tokens', () => {
    expect(indexCss).toMatch(/\.ds-page\s*\{[^}]*var\(--color-bg-canvas\)/s)
    expect(indexCss).toMatch(/\.ds-card\s*\{[^}]*var\(--color-card-surface\)/s)
    expect(indexCss).toMatch(/\.ds-card\s*\{[^}]*var\(--color-border-soft\)/s)
    expect(indexCss).toMatch(/\.ds-card\s*\{[^}]*var\(--shadow-soft-sm\)/s)
    expect(indexCss).toMatch(/\.ds-chrome\s*\{[^}]*var\(--color-chrome-surface\)/s)
    expect(indexCss).toMatch(/\.ds-chrome\s*\{[^}]*var\(--color-border-soft\)/s)
    expect(indexCss).toMatch(/\.ds-chrome-tint\s*\{[^}]*var\(--color-chrome-tint\)/s)
    expect(indexCss).toMatch(/\.ds-focus-ring:focus-visible\s*\{[^}]*var\(--focus-ring-soft\)/s)
    expect(indexCss).toMatch(/\.ds-card-lift:hover\s*\{[^}]*var\(--shadow-soft-md\)/s)
  })

  it('keeps the purple light-mode brand primary', () => {
    expect(css).toMatch(/--color-primary-500:\s*#942FCD/)
    expect(css).not.toMatch(/prefers-color-scheme:\s*dark/)
  })

  it('does not introduce glass-blur or grain as system tokens', () => {
    expect(css).not.toMatch(/backdrop-filter/)
    expect(css).not.toMatch(/noise|grain/i)
  })
})