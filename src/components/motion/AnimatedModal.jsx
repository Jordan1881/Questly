import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, registerGsap, MOTION, prefersReducedMotion } from '../../design-system/motion'
import DismissBackdrop from '../DismissBackdrop'

registerGsap()

export default function AnimatedModal({ open, children, className = '', onBackdropClick }) {
  const overlayRef = useRef(null)
  const panelRef = useRef(null)

  useGSAP(
    () => {
      if (!open) return

      const overlay = overlayRef.current
      const panel = panelRef.current
      if (!overlay || !panel) return

      const skipMotion = prefersReducedMotion() || import.meta.env.MODE === 'test'
      if (skipMotion) {
        gsap.set([overlay, panel], { autoAlpha: 1, scale: 1, y: 0 })
        return
      }

      const tl = gsap.timeline({ defaults: { ease: MOTION.ease.standard } })
      tl.fromTo(
        overlay,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: MOTION.duration.fast },
      ).fromTo(
        panel,
        { autoAlpha: 0, scale: 0.92, y: 24 },
        { autoAlpha: 1, scale: 1, y: 0, duration: MOTION.duration.normal, ease: MOTION.ease.bounce },
        '-=0.05',
      )
    },
    { scope: overlayRef, dependencies: [open] },
  )

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-[90] flex items-center justify-center ${className}`}
      style={{ background: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(4px)' }}
    >
      <DismissBackdrop onClick={onBackdropClick} />
      <div ref={panelRef} className="relative z-[1]">
        {children}
      </div>
    </div>
  )
}
