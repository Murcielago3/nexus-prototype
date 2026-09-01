import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSim } from '@/hooks/SimProvider'
import { STEPS, type TourControls, type TourStep } from './steps'

const SEEN_KEY = 'nexus.tour.seen'

interface TourApi {
  active: boolean
  index: number
  step: TourStep | null
  total: number
  start: (from?: number) => void
  stop: () => void
  next: () => void
  prev: () => void
  goTo: (i: number) => void
  /** True while the route is changing and the target has not appeared yet. */
  settling: boolean
}

const Ctx = createContext<TourApi | null>(null)

export function useTour(): TourApi {
  const c = useContext(Ctx)
  if (!c) throw new Error('useTour must be used inside TourProvider')
  return c
}

export function TourProvider({ children }: { children: ReactNode }) {
  const sim = useSim()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const [active, setActive] = useState(false)
  const [index, setIndex] = useState(0)
  const [settling, setSettling] = useState(false)

  const step = active ? (STEPS[index] ?? null) : null

  // sim setters are stable, but the ref keeps `controls` from changing identity
  // every tick as the clock advances
  const simRef = useRef(sim)
  simRef.current = sim

  const controls = useMemo<TourControls>(
    () => ({
      seek: (m) => simRef.current.seek(m),
      setPlaying: (p) => simRef.current.setPlaying(p),
      setSpeed: (i) => simRef.current.setSpeedIndex(i),
      reset: () => simRef.current.reset(),
      dispatchTop: () => {
        const top = simRef.current.queue[0]
        if (top) simRef.current.dispatch(top)
      },
    }),
    [],
  )

  const start = useCallback(
    (from = 0) => {
      setIndex(from)
      setActive(true)
      try {
        localStorage.setItem(SEEN_KEY, '1')
      } catch {
        // private windows and blocked site data both throw here, and a tour
        // that runs again next visit is a much smaller problem than a crash
      }
    },
    [],
  )

  const stop = useCallback(() => {
    setActive(false)
    simRef.current.setPlaying(true)
  }, [])

  const goTo = useCallback((i: number) => {
    if (i < 0) return
    if (i >= STEPS.length) {
      setActive(false)
      simRef.current.setPlaying(true)
      return
    }
    setIndex(i)
  }, [])

  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const prev = useCallback(() => goTo(index - 1), [goTo, index])

  // put the app on the right route, then run whatever state the step needs
  useEffect(() => {
    if (!step) return
    let cancelled = false

    if (step.route !== pathname) {
      setSettling(true)
      navigate(step.route)
    }

    // one frame after any navigation, so the page has mounted before a step
    // seeks the clock or dispatches
    const id = requestAnimationFrame(() => {
      if (cancelled) return
      step.act?.(controls)
      setSettling(false)
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(id)
    }
    // pathname is deliberately excluded: reacting to it would re-run `act`
    // a second time immediately after the navigation it just triggered
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, controls, navigate])

  // keyboard driving
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        stop()
      } else if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        next()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prev()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, next, prev, stop])

  // first visit gets the tour offered automatically
  useEffect(() => {
    let seen = true
    try {
      seen = localStorage.getItem(SEEN_KEY) === '1'
    } catch {
      seen = true
    }
    if (seen || pathname !== '/') return
    const id = setTimeout(() => start(0), 1400)
    return () => clearTimeout(id)
    // only ever on the very first mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo<TourApi>(
    () => ({ active, index, step, total: STEPS.length, start, stop, next, prev, goTo, settling }),
    [active, index, step, start, stop, next, prev, goTo, settling],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
