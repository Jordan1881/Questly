import { useEffect, useState } from 'react'
import { gsap, registerGsap } from '../design-system/motion'

registerGsap()

/**
 * Reactive prefers-reduced-motion + gsap.matchMedia helper.
 */
export function useQuestlyMotion(scopeRef) {
  const [reduceMotion, setReduceMotion] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (e) => setReduceMotion(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const runScoped = (setup) => {
    const mm = gsap.matchMedia()
    mm.add(
      {
        reduceMotion: '(prefers-reduced-motion: reduce)',
        fullMotion: '(prefers-reduced-motion: no-preference)',
      },
      (context) => {
        const { reduceMotion: reduced } = context.conditions
        setup({ reduced, gsap, context })
        return () => {}
      },
      scopeRef,
    )
    return () => mm.revert()
  }

  return { reduceMotion, runScoped }
}
