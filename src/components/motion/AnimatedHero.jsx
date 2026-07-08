import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, registerGsap, MOTION } from '../../design-system/motion'

registerGsap()

export function useHeroMotion() {
  const rootRef = useRef(null)

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: MOTION.ease.entrance } })

      tl.from('[data-hero-logo]', {
        autoAlpha: 0,
        y: MOTION.distance.md,
        duration: MOTION.duration.slow,
      })
        .from(
          '[data-hero-title]',
          { autoAlpha: 0, y: MOTION.distance.md, duration: MOTION.duration.normal },
          '-=0.45',
        )
        .from(
          '[data-hero-subtitle]',
          { autoAlpha: 0, y: MOTION.distance.sm, duration: MOTION.duration.normal },
          '-=0.3',
        )
        .from(
          '[data-hero-cta]',
          { autoAlpha: 0, y: MOTION.distance.sm, scale: 0.96, duration: MOTION.duration.fast },
          '-=0.2',
        )
        .from(
          '[data-hero-footer]',
          { autoAlpha: 0, duration: MOTION.duration.fast },
          '-=0.1',
        )

      gsap.to('[data-motion-blob]', {
        x: 'random(-30, 30)',
        y: 'random(-40, 40)',
        duration: 'random(8, 13)',
        ease: MOTION.ease.ambient,
        repeat: -1,
        yoyo: true,
        stagger: { each: 1.2, from: 'random' },
      })
    },
    { scope: rootRef },
  )

  return rootRef
}
