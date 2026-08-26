import Lenis from 'lenis'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Inertial scrolling for the whole app.
 *
 * Framer Motion has no smooth scroll of its own, so this drives Lenis from a
 * requestAnimationFrame loop. Motion's useScroll reads window scroll, which
 * Lenis keeps authoritative, so every parallax and reveal on the page stays in
 * sync with no extra wiring.
 *
 * The War Room opts out: an operator scrubbing a dense console wants the
 * scroll position to stop exactly where they let go.
 */
export function SmoothScroll() {
  const { pathname } = useLocation()
  const enabled = pathname !== '/war-room'

  useEffect(() => {
    if (!enabled) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    })

    let raf = 0
    const frame = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [enabled])

  return null
}
