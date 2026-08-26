import { EVENTS, LINKS, SEED_OCCUPANCY, ZONES, ZONE_BY_ID, wallClock, zoneDistanceKm } from './city'
import { bandFor } from './types'
import type {
  GuideRecommendation,
  Intervention,
  Snapshot,
  ZoneForecast,
  ZonePressure,
} from './types'

/**
 * UI-only mock data.
 *
 * This exists solely so the screens have something to render and animate.
 * It is NOT the product's intelligence layer. The real scoring, forecasting
 * and recommendation logic lives in the backend. When that backend lands,
 * replace the body of `getSnapshot` / `getRecommendations` with fetch calls;
 * every component consumes the returned shapes and nothing else.
 */

// ── deterministic noise so the demo looks identical every run ────────────
function hash(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

function wobble(zoneId: string, clock: number, amp: number): number {
  const base = zoneId.charCodeAt(1) * 7 + zoneId.charCodeAt(2) * 13
  return (hash(base + clock * 0.35) - 0.5) * 2 * amp
}

/** How much scheduled event flux lands on a zone within the next hour. */
function fluxFor(zoneId: string, clock: number): number {
  let flux = 0
  for (const ev of EVENTS) {
    const minutesToRelease = ev.endsAt - clock
    if (minutesToRelease < -45 || minutesToRelease > 75) continue
    const share = ev.releaseProfile.find((r) => r.zoneId === zoneId)?.share ?? 0
    if (!share) continue
    const proximity = 1 - Math.min(Math.abs(minutesToRelease), 110) / 110
    flux += (ev.attendees * share * proximity) / (ZONE_BY_ID[zoneId]?.capacity ?? 1)
  }
  return Math.min(flux, 1)
}

/** Occupancy ratio for a zone at a given sim minute. */
function occupancyRatio(zoneId: string, clock: number, relief: Record<string, number>): number {
  const seed = SEED_OCCUPANCY[zoneId] ?? 0.3
  let ratio = seed

  for (const ev of EVENTS) {
    const share = ev.releaseProfile.find((r) => r.zoneId === zoneId)?.share ?? 0
    if (!share) continue
    // crowd arrives over the 22 minutes following the event's end
    const since = clock - ev.endsAt
    if (since <= -1) continue
    const arrived = Math.min(Math.max(since, 0) / 22, 1)
    ratio += (ev.attendees * share * arrived) / (ZONE_BY_ID[zoneId]?.capacity ?? 1)
  }

  // venues fill while their event runs
  const hosting = EVENTS.find((e) => e.venueZoneId === zoneId && clock >= e.startsAt && clock <= e.endsAt)
  if (hosting) {
    const ramp = Math.min((clock - hosting.startsAt) / 40, 1)
    const drain = clock > hosting.endsAt - 15 ? Math.max(0, (hosting.endsAt - clock) / 15) : 1
    ratio += (hosting.attendees * ramp * drain) / (ZONE_BY_ID[zoneId]?.capacity ?? 1)
  }

  ratio += wobble(zoneId, clock, 0.012)
  ratio -= relief[zoneId] ?? 0
  return Math.max(0.04, Math.min(ratio, 1.25))
}

function scoreAt(zoneId: string, clock: number, relief: Record<string, number>) {
  const occ = occupancyRatio(zoneId, clock, relief)
  const prev = occupancyRatio(zoneId, Math.max(0, clock - 15), relief)
  const velocity = Math.max(0, Math.min((occ - prev) / 0.14, 1))
  const flux = fluxFor(zoneId, clock)
  const score = (0.5 * Math.min(occ, 1) + 0.3 * velocity + 0.2 * flux) * 100
  return { occ, velocity, flux, score: Math.max(0, Math.min(score, 100)) }
}

export function getPressures(clock: number, relief: Record<string, number> = {}): ZonePressure[] {
  return ZONES.map((z) => {
    const now = scoreAt(z.id, clock, relief)
    const past = scoreAt(z.id, Math.max(0, clock - 15), relief)
    return {
      zoneId: z.id,
      score: now.score,
      band: bandFor(now.score),
      // the occupancy term is capped in the score, so show the capped value
      components: { occupancy: Math.min(now.occ, 1), velocity: now.velocity, flux: now.flux },
      rateOfChange15m: now.score - past.score,
      occupancy: Math.round(now.occ * z.capacity),
      capacity: z.capacity,
      timestamp: clock,
    }
  })
}

export function getForecast(
  zoneId: string,
  clock: number,
  relief: Record<string, number> = {},
  horizonMinutes = 120,
): ZoneForecast {
  const zone = ZONE_BY_ID[zoneId]
  const points = []
  let eta: number | null = null
  let peak = 0

  for (let t = 0; t <= horizonMinutes; t += 10) {
    const { score } = scoreAt(zoneId, clock + t, relief)
    const spread = 1.6 + (t / horizonMinutes) * 9
    points.push({
      t,
      value: score,
      lower: Math.max(0, score - spread),
      upper: Math.min(100, score + spread),
    })
    if (score > peak) peak = score
    if (eta === null && score >= 95) eta = t
  }

  const current = points[0].value
  // the trend is measured backwards, from what has already happened
  const trend = current - scoreAt(zoneId, Math.max(0, clock - 15), relief).score
  const upcoming = EVENTS.filter((e) => e.endsAt > clock && e.endsAt <= clock + horizonMinutes)
    .filter((e) => e.releaseProfile.some((r) => r.zoneId === zoneId))

  const chain = [
    zone.code + ' at ' + current.toFixed(0) + '% now',
    (trend >= 0.5
      ? 'climbing ' + trend.toFixed(1) + ' points'
      : trend <= -0.5
        ? 'easing ' + Math.abs(trend).toFixed(1) + ' points'
        : 'flat') + ' over the last 15 minutes',
  ]
  for (const ev of upcoming) {
    const share = ev.releaseProfile.find((r) => r.zoneId === zoneId)!.share
    chain.push(
      ev.name + ' releases ' + Math.round(ev.attendees * share).toLocaleString('en-IN') +
        ' into this zone at ' + wallClock(ev.endsAt),
    )
  }
  chain.push(
    eta !== null
      ? 'projected saturation in ' + eta + ' min (' + wallClock(clock + eta) + ')'
      : current >= 85
        ? 'already inside the warning band, holding near ' + peak.toFixed(0) + '%'
        : 'projected peak ' + peak.toFixed(0) + '%, stays under saturation',
  )

  return {
    zoneId,
    horizonMinutes,
    points,
    projectedPeak: peak,
    etaToSaturationMin: eta,
    confidence: 0.78 + hash(clock + zoneId.charCodeAt(2)) * 0.14,
    chain,
  }
}

const INCENTIVE_WINDOWS = ['after 22:00', 'after 22:30', 'between 22:00 and 00:30']

export function buildIntervention(
  zoneId: string,
  clock: number,
  relief: Record<string, number> = {},
): Intervention {
  const zone = ZONE_BY_ID[zoneId]
  const pressures = getPressures(clock, relief)
  const self = pressures.find((p) => p.zoneId === zoneId)!
  const forecast = getForecast(zoneId, clock, relief)

  const targets = pressures
    .filter((p) => p.zoneId !== zoneId && p.score < 62)
    .filter((p) => ZONE_BY_ID[p.zoneId].kind === 'accommodation' || ZONE_BY_ID[p.zoneId].kind === 'hospitality')
    .map((p) => {
      const t = ZONE_BY_ID[p.zoneId]
      const headroom = Math.max(0, 1 - p.occupancy / p.capacity)
      const distance = zoneDistanceKm(zone, t)
      const proximity = Math.max(0.05, 1 - distance / 26)
      const connectivity = t.transportConnectivity
      const score = headroom * 0.5 + proximity * 0.28 + connectivity * 0.22
      return { zoneId: p.zoneId, headroom, proximity, connectivity, score, divert: 0 }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  const overflow = Math.max(0, self.occupancy - zone.capacity * 0.82)
  const weightSum = targets.reduce((s, t) => s + t.score, 0) || 1
  for (const t of targets) {
    t.divert = Math.round((overflow * t.score) / weightSum / 100) * 100
  }

  const lead = targets[0]
  const leadZone = lead ? ZONE_BY_ID[lead.zoneId] : undefined
  const totalDiverted = targets.reduce((s, t) => s + t.divert, 0)
  const incentive = Math.round((220 + (self.score - 70) * 12) / 10) * 10

  const window = INCENTIVE_WINDOWS[Math.floor(hash(clock) * INCENTIVE_WINDOWS.length)]

  let attendeeMessage: string
  if (!leadZone || !lead) {
    attendeeMessage = 'Hold position. No relief zone currently meets the diversion threshold.'
  } else if (zone.kind === 'transit' || zone.kind === 'venue') {
    // nobody books a room at an interchange, so this reads as a routing nudge
    attendeeMessage =
      zone.name + ' is congested. Route out through ' + leadZone.name +
      ' instead, which is running at ' + Math.round((1 - lead.headroom) * 100) +
      '% capacity. Travel ' + window + ' and we will credit ₹' + incentive + ' to your pass.'
  } else {
    const cheaper =
      zone.baseRateInr > 0 && leadZone.baseRateInr > 0
        ? Math.round((1 - leadZone.baseRateInr / zone.baseRateInr) * 100)
        : 0
    attendeeMessage =
      leadZone.name + ' is at ' + Math.round((1 - lead.headroom) * 100) + '% capacity' +
      (cheaper >= 5 ? ' and ' + cheaper + '% cheaper tonight' : '') +
      '. Head there instead of ' + zone.name + ' and we will credit ₹' + incentive +
      ' for checking in ' + window + '.'
  }

  const opsAlert =
    zone.code + ' ' + self.score.toFixed(0) + '% · ' +
    (forecast.etaToSaturationMin !== null
      ? 'saturation in ' + forecast.etaToSaturationMin + ' min'
      : 'peak ' + forecast.projectedPeak.toFixed(0) + '%') +
    ' · divert ' + totalDiverted.toLocaleString('en-IN') + ' to ' +
    targets.map((t) => ZONE_BY_ID[t.zoneId].code).join(' / ') +
    ' · ₹' + incentive + ' nudge'

  return {
    id: 'iv-' + zoneId + '-' + Math.round(clock),
    zoneId,
    createdAt: clock,
    band: self.band,
    etaToSaturationMin: forecast.etaToSaturationMin,
    targets,
    incentive: { amountInr: incentive, window, budgetInr: incentive * totalDiverted },
    attendeeMessage,
    opsAlert,
    copySource: 'template',
    status: 'pending',
    projectedRelief: Math.min(24, (totalDiverted / zone.capacity) * 100),
    chain: forecast.chain,
  }
}

export function getSnapshot(clock: number, relief: Record<string, number> = {}): Snapshot {
  const pressures = getPressures(clock, relief)
  const atRisk = pressures.filter((p) => p.score >= 70).sort((a, b) => b.score - a.score)
  const forecasts = atRisk.slice(0, 4).map((p) => getForecast(p.zoneId, clock, relief))

  const visitors = pressures.reduce((s, p) => s + p.occupancy, 0)
  const capacity = pressures.reduce((s, p) => s + p.capacity, 0)
  const diverted = Object.entries(relief).reduce(
    (s, [id, r]) => s + r * (ZONE_BY_ID[id]?.capacity ?? 0),
    0,
  )

  return {
    clock,
    wallClock: wallClock(clock),
    zones: ZONES,
    pressures,
    forecasts,
    events: EVENTS,
    links: LINKS.map((l) => ({
      ...l,
      load: Math.max(0.05, Math.min(0.99, l.load + wobble(l.from, clock, 0.09) + fluxFor(l.to, clock) * 0.35)),
    })),
    interventions: [],
    totals: {
      visitors,
      capacity,
      meanPressure: pressures.reduce((s, p) => s + p.score, 0) / pressures.length,
      zonesAtRisk: atRisk.length,
      diverted: Math.round(diverted),
      reliefPoints: Object.values(relief).reduce((s, r) => s + r * 100, 0),
    },
  }
}

export function getRecommendations(clock: number, relief: Record<string, number> = {}): GuideRecommendation[] {
  const pressures = getPressures(clock, relief)
  const byId = Object.fromEntries(pressures.map((p) => [p.zoneId, p]))
  const hottest = [...pressures].sort((a, b) => b.score - a.score)[0]
  const origin = ZONE_BY_ID[hottest.zoneId]

  return pressures
    .filter((p) => {
      const k = ZONE_BY_ID[p.zoneId].kind
      return k === 'accommodation' || k === 'hospitality'
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, 4)
    .map((p) => {
      const zone = ZONE_BY_ID[p.zoneId]
      const load = p.occupancy / p.capacity
      // pressure-driven pricing: quiet zones discount, busy zones surge
      const multiplier = 0.68 + load * 0.72
      const rate = Math.round((zone.baseRateInr * multiplier) / 50) * 50
      const savings = Math.round((1 - rate / zone.baseRateInr) * 100)
      const distance = zoneDistanceKm(origin, zone)
      const travel = Math.round(distance * 2.1 + (1 - zone.transportConnectivity) * 14)
      const incentive = p.score < 45 ? Math.round((300 - p.score * 3) / 10) * 10 : 0

      const tags: string[] = []
      if (p.score < 40) tags.push('LOW PRESSURE')
      if (zone.transportConnectivity > 0.75) tags.push('METRO DIRECT')
      if (savings >= 15) tags.push(savings + '% BELOW PEAK')
      if (incentive > 0) tags.push('₹' + incentive + ' CREDIT')

      return {
        zone,
        pressure: p,
        rateInr: rate,
        savingsPct: savings,
        travelMinutes: travel,
        incentiveInr: incentive,
        reason:
          zone.name + ' is running at ' + Math.round(load * 100) + '% capacity while ' +
          origin.name + ' sits at ' + Math.round((byId[origin.id].occupancy / byId[origin.id].capacity) * 100) +
          '%. Lower demand is why the rate dropped, not a downgrade in quality.',
        tags,
      }
    })
}

/** Scripted demo beats, surfaced as a scrubber in the War Room. */
export const SCENARIO_MARKS = [
  { clock: 0, label: 'STEADY STATE', note: 'Pre-event baseline. All zones nominal.' },
  { clock: 175, label: 'CEREMONY OUT', note: '26,000 released. First pressure wave.' },
  { clock: 305, label: 'PRE-FINAL BUILD', note: 'Northgate already carrying the ceremony crowd.' },
  { clock: 320, label: 'FINAL WHISTLE', note: '40,000 released. The detonator.' },
  { clock: 330, label: 'CRITICAL', note: 'Z-01 crosses 95. Intervention window is open.' },
  { clock: 400, label: 'POST-DIVERSION', note: 'The curve bends if the dispatch went out.' },
]
