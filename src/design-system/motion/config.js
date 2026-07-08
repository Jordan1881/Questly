/**
 * Questly motion tokens — aligned with ui-ux-pro-max motion dial 7/10 (Standard)
 * and the existing Figma tokens in tokens.css.
 */
export const MOTION = {
  duration: {
    instant: 0,
    fast: 0.2,
    normal: 0.5,
    slow: 0.7,
    page: 0.45,
  },
  ease: {
    entrance: 'power3.out',
    exit: 'power2.in',
    standard: 'power2.inOut',
    bounce: 'back.out(1.4)',
    ambient: 'sine.inOut',
  },
  stagger: {
    tight: 0.06,
    normal: 0.1,
    relaxed: 0.14,
  },
  distance: {
    sm: 16,
    md: 28,
    lg: 40,
  },
}

export const MOTION_SELECTORS = {
  revealItem: '[data-motion-reveal]',
  heroBlob: '[data-motion-blob]',
}
