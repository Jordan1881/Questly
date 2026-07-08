import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { MOTION } from './config'

let registered = false

export function registerGsap() {
  if (registered) return gsap
  gsap.registerPlugin(useGSAP)
  gsap.defaults({
    duration: MOTION.duration.normal,
    ease: MOTION.ease.entrance,
  })
  registered = true
  return gsap
}

export { gsap, useGSAP }
