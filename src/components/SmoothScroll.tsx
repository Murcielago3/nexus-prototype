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

let current: Lenis | null = null

/**
 * The live instance, or null on routes that opt out. The guided tour needs
 * this: calling window.scrollTo while Lenis is running gets overwritten on
 * the next frame, because Lenis reasserts its own target every tick.
 */
export function getLenis(): Lenis | null {
  return current
}

/** Scrolls an element into view through whichever scroller is in charge. */
export function tourScrollTo(el: Element, offset = -160) {
  const lenis = getLenis()
  if (lenis) {
    lenis.scrollTo(el as HTMLElement, { offset, duration: 0.9 })
    return
  }
  const top = window.scrollY + el.getBoundingClientRect().top + offset
  window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' })
}

export function SmoothScroll() {
  const { pathname } = useLocation()
  const enabled = pathname !== '/war-room'

  useEffect(() => {
    if (!enabled) {
      current = null
      return
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
      autoRaf: true,
      // Lenis defaults this to true, and when the OS reports reduced motion it
      // sets lerp to 1, which is no smoothing at all. That is why removing our
      // own reduced-motion guard changed nothing: this one was still firing.
      // Turned off deliberately, because smooth scrolling is a requested part
      // of this build rather than decoration.
      respectReducedMotion: false,
    })
    current = lenis

    // Lenis only publishes its version globally, not the instance, which makes
    // "is smoothing actually on?" impossible to answer from the console.
    // Dev only, so nothing extra ships.
    if (import.meta.env.DEV) {
      ;(window as unknown as { __lenis?: Lenis }).__lenis = lenis
    }

    return () => {
      lenis.destroy()
      current = null
    }
  }, [enabled])

  return null
}
