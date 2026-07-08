import { MOTION } from './config'

export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Returns motion-safe vars — zero duration when user prefers reduced motion.
 */
export function withMotionGuard(vars = {}) {
  if (prefersReducedMotion()) {
    return { ...vars, duration: MOTION.duration.instant, stagger: 0, delay: 0 }
  }
  return vars
}
