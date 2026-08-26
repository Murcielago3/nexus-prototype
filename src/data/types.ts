/**
 * NEXUS domain contract.
 *
 * These types are the single source of truth shared by the in-browser
 * simulation (demo mode) and the FastAPI backend (live mode). If the backend
 * response shape and this file ever disagree, this file wins. Regenerate the
 * Pydantic models from it, not the other way round.
 */

export type PressureBand = 'nominal' | 'watch' | 'warning' | 'critical'

export type ZoneKind = 'accommodation' | 'venue' | 'transit' | 'hospitality'

/** Alert thresholds, per the locked spec. */
export const BANDS: Record<PressureBand, { min: number; label: string; color: string }> = {
  nominal: { min: 0, label: 'NOMINAL', color: '#fbdbbb' },
  watch: { min: 70, label: 'WATCH', color: '#f9843f' },
  warning: { min: 85, label: 'WARNING', color: '#e85d10' },
  critical: { min: 95, label: 'CRITICAL', color: '#a61304' },
}

export function bandFor(score: number): PressureBand {
  if (score >= BANDS.critical.min) return 'critical'
  if (score >= BANDS.warning.min) return 'warning'
  if (score >= BANDS.watch.min) return 'watch'
  return 'nominal'
}

export interface Zone {
  id: string
  /** Ops short code, e.g. "Z-04". Used everywhere in the War Room. */
  code: string
  name: string
  sector: string
  kind: ZoneKind
  /** Real coordinates. Drives the globe and any future GIS work. */
  lat: number
  lng: number
  /** Normalised 0..1 position on the schematic city plate. */
  x: number
  y: number
  capacity: number
  /** 0..1, how well this zone is served by mass transit. */
  transportConnectivity: number
  /** Median nightly rate, INR. Drives the Smart Guide's price reasoning. */
  baseRateInr: number
  neighbors: string[]
}

export interface ZoneState {
  zoneId: string
  occupancy: number
  /** Inbound people per hour, observed. */
  inflowPerHour: number
  timestamp: number
}

export interface PressureComponents {
  /** 0.5 weight: occupancy / capacity */
  occupancy: number
  /** 0.3 weight: normalised 15-minute rate of change */
  velocity: number
  /** 0.2 weight: scheduled event flux arriving within the hour */
  flux: number
}

export interface ZonePressure {
  zoneId: string
  score: number
  band: PressureBand
  components: PressureComponents
  /**
   * Signed change in the score over the last 15 minutes, in points.
   * Deliberately not extrapolated to an hourly figure: a stadium empties
   * in twenty minutes, so a per hour slope reads as nonsense on screen.
   */
  rateOfChange15m: number
  occupancy: number
  capacity: number
  timestamp: number
}

export interface ForecastPoint {
  /** Minutes from now. */
  t: number
  value: number
  lower: number
  upper: number
}

export interface ZoneForecast {
  zoneId: string
  horizonMinutes: number
  points: ForecastPoint[]
  projectedPeak: number
  /** Minutes until the zone crosses 95, or null if it does not within horizon. */
  etaToSaturationMin: number | null
  confidence: number
  /**
   * The reasoning trail, rendered verbatim in the alert card. This is the
   * thing that separates NEXUS from a dashboard, so never hide it.
   */
  chain: string[]
}

export interface EventBlock {
  id: string
  name: string
  venueZoneId: string
  /** Minutes since sim epoch. */
  startsAt: number
  endsAt: number
  attendees: number
  /** Where the crowd goes when the event ends. Shares sum to <= 1. */
  releaseProfile: { zoneId: string; share: number }[]
}

export interface InterventionTarget {
  zoneId: string
  headroom: number
  proximity: number
  connectivity: number
  /** Composite rank score, 0..1. */
  score: number
  /** People NEXUS proposes diverting here. */
  divert: number
}

export interface Intervention {
  id: string
  zoneId: string
  createdAt: number
  band: PressureBand
  etaToSaturationMin: number | null
  targets: InterventionTarget[]
  incentive: { amountInr: number; window: string; budgetInr: number }
  /** Copy for the Smart Guide. LLM-authored in live mode. */
  attendeeMessage: string
  /** Copy for the War Room feed. LLM-authored in live mode. */
  opsAlert: string
  /** Where the copy came from. Surfaced in the UI, never faked. */
  copySource: 'template' | 'llm'
  status: 'pending' | 'dispatched' | 'expired'
  projectedRelief: number
  chain: string[]
}

export interface TransportLink {
  id: string
  from: string
  to: string
  mode: 'metro' | 'bus' | 'road' | 'rail'
  capacityPerHour: number
  load: number
  travelMinutes: number
}

export interface Snapshot {
  /** Minutes since sim epoch. */
  clock: number
  wallClock: string
  zones: Zone[]
  pressures: ZonePressure[]
  forecasts: ZoneForecast[]
  events: EventBlock[]
  links: TransportLink[]
  interventions: Intervention[]
  totals: {
    visitors: number
    capacity: number
    meanPressure: number
    zonesAtRisk: number
    diverted: number
    reliefPoints: number
  }
}

/** Attendee-facing recommendation, driven by the same pressure numbers. */
export interface GuideRecommendation {
  zone: Zone
  pressure: ZonePressure
  /** Live rate after pressure-driven pricing. */
  rateInr: number
  savingsPct: number
  travelMinutes: number
  incentiveInr: number
  /** Why this zone. Shown to the attendee, not hidden. */
  reason: string
  tags: string[]
}
