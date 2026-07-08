import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, registerGsap, MOTION, MOTION_SELECTORS } from '../../design-system/motion'

registerGsap()

/**
 * Staggered entrance for child items marked with data-motion-reveal.
 */
export default function AnimatedReveal({
  children,
  className = '',
  stagger = MOTION.stagger.normal,
  y = MOTION.distance.sm,
  delay = 0,
  refreshKey,
  as: Tag = 'div',
}) {
  const rootRef = useRef(null)

  useGSAP(
    () => {
      const items = rootRef.current?.querySelectorAll(MOTION_SELECTORS.revealItem)
      if (!items?.length) return

      gsap.from(items, {
        autoAlpha: 0,
        y,
        duration: MOTION.duration.normal,
        ease: MOTION.ease.entrance,
        stagger,
        delay,
      })
    },
    {
      scope: rootRef,
      dependencies: [stagger, y, delay, refreshKey],
      revertOnUpdate: true,
    },
  )

  return (
    <Tag ref={rootRef} className={className}>
      {children}
    </Tag>
  )
}
