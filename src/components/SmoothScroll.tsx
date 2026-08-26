import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Inertial scrolling for the whole app.
 *
 * Framer Motion has no smooth scroll of its own, so this runs Lenis. Motion's
 * useScroll reads window scroll, which Lenis keeps authoritative, so every
 * parallax and reveal on the page stays in sync with no extra wiring.
 *
 * Two things this depends on, both easy to break by accident:
 *  - no `scroll-behavior: smooth` anywhere in CSS, it fights Lenis and the
 *    result is no smoothing at all
 *  - lenis.css, which sets the html and body rules the library needs
 *
 * The War Room opts out. An operator scrubbing a dense console wants the
 * scroll position to stop exactly where they let go.
 */
export function SmoothScroll() {
  const { pathname } = useLocation()
  const enabled = pathname !== '/war-room'

  useEffect(() => {
    if (!enabled) return

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
      autoRaf: true,
    })

    return () => lenis.destroy()
  }, [enabled])

  return null
}
