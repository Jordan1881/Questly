import { useCallback, useRef } from 'react'
import { gsap, registerGsap, MOTION, prefersReducedMotion } from '../design-system/motion'

registerGsap()

const { taskComplete: TC } = MOTION
const CARD_GLOW = 'var(--shadow-primary-sm)'
const CARD_SHADOW_DEFAULT = 'var(--shadow-soft-sm)'

function isXpBarOnScreen(bar) {
  if (!bar) return false
  const rect = bar.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight
}

/** Prefer explicit ref; only tick a Level progress bar that is currently on-screen. */
function resolveXpBar(xpBarRef) {
  const bar =
    xpBarRef?.current ??
    (typeof document !== 'undefined' ? document.querySelector('[data-xp-progress-bar]') : null)
  return isXpBarOnScreen(bar) ? bar : null
}

/**
 * GSAP completion juice for task check-off (complete only, not uncomplete).
 * Returns a promise that resolves when the timeline finishes (or immediately when reduced motion).
 */
export function useTaskCompleteMotion({ cardRef, checkboxRef, xpGhostRef, xpBarRef } = {}) {
  const timelineRef = useRef(null)

  const killTimeline = useCallback(() => {
    timelineRef.current?.kill()
    timelineRef.current = null
  }, [])

  const playCompleteJuice = useCallback(
    ({ xp = 0, compressed = false } = {}) => {
      killTimeline()

      if (prefersReducedMotion()) {
        return Promise.resolve()
      }

      const checkbox = checkboxRef?.current
      const card = cardRef?.current
      const xpGhost = xpGhostRef?.current
      const xpBar = resolveXpBar(xpBarRef)

      if (!checkbox && !card && !xpGhost) {
        return Promise.resolve()
      }

      return new Promise((resolve) => {
        const tl = gsap.timeline({
          onComplete: () => {
            timelineRef.current = null
            resolve()
          },
        })
        timelineRef.current = tl

        if (checkbox) {
          tl.fromTo(
            checkbox,
            { scale: 1 },
            { scale: 1.15, duration: TC.checkbox / 2, ease: 'power2.out' },
          ).to(checkbox, { scale: 1, duration: TC.checkbox / 2, ease: 'power2.out' })
        }

        if (card) {
          tl.to(
            card,
            {
              boxShadow: CARD_GLOW,
              duration: TC.glow / 2,
              ease: 'power2.out',
            },
            checkbox ? '<0.02' : 0,
          ).to(card, {
            boxShadow: CARD_SHADOW_DEFAULT,
            duration: TC.glow / 2,
            ease: 'power2.in',
          })
        }

        if (xpGhost && xp > 0) {
          gsap.set(xpGhost, { autoAlpha: 0, y: 0 })
          tl.set(xpGhost, { autoAlpha: 1 }, card || checkbox ? '<0.02' : 0)
          tl.to(
            xpGhost,
            {
              y: -TC.ghostRise,
              autoAlpha: 0,
              duration: TC.ghost,
              ease: 'power2.out',
            },
            '<',
          )
        }

        if (!compressed && xpBar) {
          const fill = xpBar.querySelector('[data-xp-bar-fill]')
          if (fill) {
            tl.to(
              fill,
              {
                scaleX: 1.03,
                duration: TC.barTick / 2,
                transformOrigin: 'left center',
                ease: 'power2.out',
              },
              '>-0.02',
            ).to(fill, {
              scaleX: 1,
              duration: TC.barTick / 2,
              ease: 'power2.in',
            })
          }
        }
      })
    },
    [cardRef, checkboxRef, xpGhostRef, xpBarRef, killTimeline],
  )

  return { playCompleteJuice, killTimeline }
}

export { TC as TASK_COMPLETE_MOTION }
