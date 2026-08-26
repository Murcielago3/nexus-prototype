import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ZONE_BY_ID } from '@/data/city'
import { buildIntervention, getRecommendations, getSnapshot } from '@/data/mock'
import type { Intervention } from '@/data/types'

/**
 * Sim minutes advanced per real second. The old baseline of 6 pushed the whole
 * 220 minute scenario past in half a minute, which is faster than anyone can
 * read a card. 1X now takes about seven minutes end to end, and roughly a
 * minute to reach the moment Z-01 goes critical.
 */
export const SPEEDS = [
  { label: '1X', minutesPerSecond: 0.5 },
  { label: '2X', minutesPerSecond: 1 },
  { label: '8X', minutesPerSecond: 4 },
]

/** Opens on the build toward the final, which is the interesting part. */
const START_CLOCK = 300
const MAX_CLOCK = 520

/**
 * Drives the demo clock and holds whatever the operator has dispatched.
 * This is presentation state only. When the backend arrives, the clock
 * comes from the server and `relief` disappears entirely.
 */
export function useSimClock() {
  const [clock, setClock] = useState(START_CLOCK)
  const [playing, setPlaying] = useState(true)
  const [speedIndex, setSpeedIndex] = useState(0)
  const [dispatched, setDispatched] = useState<Intervention[]>([])
  const [divertedTotal, setDivertedTotal] = useState(0)
  const relief = useRef<Record<string, number>>({})
  const [reliefVersion, setReliefVersion] = useState(0)

  useEffect(() => {
    if (!playing) return
    const step = SPEEDS[speedIndex].minutesPerSecond / 10
    const id = setInterval(() => {
      setClock((c) => (c >= MAX_CLOCK ? MAX_CLOCK : c + step))
    }, 100)
    return () => clearInterval(id)
  }, [playing, speedIndex])

  useEffect(() => {
    if (clock >= MAX_CLOCK) setPlaying(false)
  }, [clock])

  const dispatch = useCallback(
    (intervention: Intervention) => {
      const next = { ...relief.current }
      const origin = ZONE_BY_ID[intervention.zoneId]
      let moved = 0
      for (const t of intervention.targets) {
        // the origin zone sheds load, the target zones absorb it
        const target = ZONE_BY_ID[t.zoneId]
        if (!target || !origin) continue
        next[intervention.zoneId] = (next[intervention.zoneId] ?? 0) + t.divert / origin.capacity
        next[t.zoneId] = (next[t.zoneId] ?? 0) - t.divert / target.capacity
        moved += t.divert
      }
      relief.current = next
      setDivertedTotal((d) => d + moved)
      setReliefVersion((v) => v + 1)
      const sent: Intervention = { ...intervention, status: 'dispatched' }
      setDispatched((d) => [sent, ...d].slice(0, 12))
    },
    [],
  )

  const reset = useCallback(() => {
    relief.current = {}
    setReliefVersion((v) => v + 1)
    setDispatched([])
    setDivertedTotal(0)
    setClock(START_CLOCK)
    setPlaying(true)
  }, [])

  const seek = useCallback((to: number) => {
    setClock(Math.max(0, Math.min(to, MAX_CLOCK)))
  }, [])

  const rounded = Math.round(clock)

  const snapshot = useMemo(
    () => getSnapshot(rounded, relief.current),
    // reliefVersion is a deliberate cache key, the ref itself never changes identity
    [rounded, reliefVersion],
  )

  const recommendations = useMemo(
    () => getRecommendations(rounded, relief.current),
    [rounded, reliefVersion],
  )

  /** Live alert queue, rebuilt from whatever is currently over the watch line. */
  const queue = useMemo(() => {
    const dispatchedZones = new Set(dispatched.map((d) => d.zoneId))
    return snapshot.pressures
      .filter((p) => p.score >= 70 && !dispatchedZones.has(p.zoneId))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((p) => buildIntervention(p.zoneId, rounded, relief.current))
  }, [snapshot, dispatched, rounded, reliefVersion])

  return {
    clock,
    rounded,
    playing,
    setPlaying,
    speedIndex,
    setSpeedIndex,
    snapshot,
    recommendations,
    queue,
    dispatched,
    divertedTotal,
    dispatch,
    reset,
    seek,
    maxClock: MAX_CLOCK,
  }
}
