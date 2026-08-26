import type { EventBlock, TransportLink, Zone } from './types'

/**
 * Synthetic host city. Coordinates are real (Ahmedabad metro) so the globe and
 * any future GIS layer are meaningful; the zoning itself is fabricated, which
 * is standard practice for a hackathon prototype and is stated openly in the UI.
 */
export const HOST_CITY = {
  name: 'AHMEDABAD',
  country: 'IN',
  lat: 23.0225,
  lng: 72.5714,
  eventName: 'CONTINENTAL GAMES · MATCHDAY 11',
  population: 8_450_000,
  expectedVisitors: 1_240_000,
}

/** Other candidate host cities, plotted on the globe as the network. */
export const NETWORK_CITIES: { name: string; lat: number; lng: number; weight: number }[] = [
  { name: 'AHMEDABAD', lat: 23.0225, lng: 72.5714, weight: 1 },
  { name: 'MUMBAI', lat: 19.076, lng: 72.8777, weight: 0.62 },
  { name: 'DELHI', lat: 28.6139, lng: 77.209, weight: 0.58 },
  { name: 'DOHA', lat: 25.2854, lng: 51.531, weight: 0.44 },
  { name: 'RIYADH', lat: 24.7136, lng: 46.6753, weight: 0.4 },
  { name: 'SINGAPORE', lat: 1.3521, lng: 103.8198, weight: 0.38 },
  { name: 'PARIS', lat: 48.8566, lng: 2.3522, weight: 0.42 },
  { name: 'LONDON', lat: 51.5074, lng: -0.1278, weight: 0.4 },
  { name: 'MILAN', lat: 45.4642, lng: 9.19, weight: 0.3 },
  { name: 'LOS ANGELES', lat: 34.0522, lng: -118.2437, weight: 0.46 },
  { name: 'RIO DE JANEIRO', lat: -22.9068, lng: -43.1729, weight: 0.34 },
  { name: 'TOKYO', lat: 35.6762, lng: 139.6503, weight: 0.44 },
  { name: 'SYDNEY', lat: -33.8688, lng: 151.2093, weight: 0.3 },
  { name: 'JOHANNESBURG', lat: -26.2041, lng: 28.0473, weight: 0.26 },
  { name: 'TORONTO', lat: 43.6532, lng: -79.3832, weight: 0.28 },
]

export const ZONES: Zone[] = [
  {
    id: 'z01', code: 'Z-01', name: 'NORTHGATE QUARTER', sector: 'SECTOR A',
    kind: 'accommodation', lat: 23.0642, lng: 72.5812, x: 0.34, y: 0.16,
    capacity: 24_000, transportConnectivity: 0.82, baseRateInr: 8400,
    neighbors: ['z05', 'z03', 'z07'],
  },
  {
    id: 'z02', code: 'Z-02', name: 'RIVERFRONT EAST', sector: 'SECTOR A',
    kind: 'accommodation', lat: 23.0398, lng: 72.6011, x: 0.62, y: 0.27,
    capacity: 36_500, transportConnectivity: 0.74, baseRateInr: 9600,
    neighbors: ['z03', 'z05', 'z09'],
  },
  {
    id: 'z03', code: 'Z-03', name: 'ARENA PRECINCT', sector: 'SECTOR B',
    kind: 'venue', lat: 23.0919, lng: 72.5975, x: 0.5, y: 0.42,
    capacity: 62_000, transportConnectivity: 0.9, baseRateInr: 0,
    neighbors: ['z01', 'z02', 'z05', 'z06'],
  },
  {
    id: 'z04', code: 'Z-04', name: 'OLD TOWN BAZAAR', sector: 'SECTOR C',
    kind: 'hospitality', lat: 23.0216, lng: 72.5797, x: 0.24, y: 0.53,
    capacity: 28_000, transportConnectivity: 0.55, baseRateInr: 5200,
    neighbors: ['z05', 'z12', 'z07'],
  },
  {
    id: 'z05', code: 'Z-05', name: 'CENTRAL INTERCHANGE', sector: 'SECTOR B',
    kind: 'transit', lat: 23.0501, lng: 72.5809, x: 0.44, y: 0.32,
    capacity: 34_000, transportConnectivity: 1.0, baseRateInr: 0,
    neighbors: ['z01', 'z02', 'z03', 'z04', 'z11'],
  },
  {
    id: 'z06', code: 'Z-06', name: 'SOUTH PAVILION', sector: 'SECTOR D',
    kind: 'venue', lat: 22.9908, lng: 72.6142, x: 0.68, y: 0.61,
    capacity: 24_000, transportConnectivity: 0.68, baseRateInr: 0,
    neighbors: ['z03', 'z09', 'z10'],
  },
  {
    id: 'z07', code: 'Z-07', name: 'WESTFIELD LODGINGS', sector: 'SECTOR C',
    kind: 'accommodation', lat: 23.0447, lng: 72.5108, x: 0.12, y: 0.34,
    capacity: 33_000, transportConnectivity: 0.61, baseRateInr: 6100,
    neighbors: ['z01', 'z04', 'z08'],
  },
  {
    id: 'z08', code: 'Z-08', name: 'AEROCITY', sector: 'SECTOR E',
    kind: 'accommodation', lat: 23.0772, lng: 72.6347, x: 0.83, y: 0.14,
    capacity: 29_500, transportConnectivity: 0.88, baseRateInr: 7300,
    neighbors: ['z02', 'z07', 'z11'],
  },
  {
    id: 'z09', code: 'Z-09', name: 'TEXTILE MILE', sector: 'SECTOR D',
    kind: 'hospitality', lat: 23.0104, lng: 72.6008, x: 0.6, y: 0.76,
    capacity: 21_000, transportConnectivity: 0.49, baseRateInr: 4400,
    neighbors: ['z02', 'z06', 'z10'],
  },
  {
    id: 'z10', code: 'Z-10', name: 'LAKESIDE RESIDENCY', sector: 'SECTOR F',
    kind: 'accommodation', lat: 22.9611, lng: 72.5502, x: 0.31, y: 0.86,
    capacity: 38_000, transportConnectivity: 0.57, baseRateInr: 3900,
    neighbors: ['z06', 'z09', 'z12'],
  },
  {
    id: 'z11', code: 'Z-11', name: 'RING ROAD DEPOT', sector: 'SECTOR E',
    kind: 'transit', lat: 23.0855, lng: 72.5219, x: 0.86, y: 0.44,
    capacity: 18_000, transportConnectivity: 0.93, baseRateInr: 0,
    neighbors: ['z05', 'z08'],
  },
  {
    id: 'z12', code: 'Z-12', name: 'HERITAGE ROW', sector: 'SECTOR F',
    kind: 'hospitality', lat: 22.9884, lng: 72.5384, x: 0.1, y: 0.69,
    capacity: 16_500, transportConnectivity: 0.44, baseRateInr: 4800,
    neighbors: ['z04', 'z10'],
  },
]

export const ZONE_BY_ID: Record<string, Zone> = Object.fromEntries(
  ZONES.map((z) => [z.id, z]),
)

/** Starting occupancy ratio per zone. This is the pre-event steady state. */
export const SEED_OCCUPANCY: Record<string, number> = {
  z01: 0.45, z02: 0.58, z03: 0.22, z04: 0.44, z05: 0.37, z06: 0.19,
  z07: 0.4, z08: 0.46, z09: 0.31, z10: 0.21, z11: 0.29, z12: 0.26,
}

export const LINKS: TransportLink[] = [
  { id: 'l01', from: 'z05', to: 'z03', mode: 'metro', capacityPerHour: 22_000, load: 0.42, travelMinutes: 7 },
  { id: 'l02', from: 'z05', to: 'z01', mode: 'metro', capacityPerHour: 18_000, load: 0.38, travelMinutes: 9 },
  { id: 'l03', from: 'z05', to: 'z02', mode: 'bus', capacityPerHour: 9_000, load: 0.51, travelMinutes: 14 },
  { id: 'l04', from: 'z05', to: 'z04', mode: 'road', capacityPerHour: 6_500, load: 0.47, travelMinutes: 11 },
  { id: 'l05', from: 'z03', to: 'z06', mode: 'bus', capacityPerHour: 8_000, load: 0.33, travelMinutes: 18 },
  { id: 'l06', from: 'z11', to: 'z08', mode: 'metro', capacityPerHour: 16_000, load: 0.29, travelMinutes: 12 },
  { id: 'l07', from: 'z11', to: 'z05', mode: 'rail', capacityPerHour: 12_000, load: 0.35, travelMinutes: 16 },
  { id: 'l08', from: 'z07', to: 'z01', mode: 'road', capacityPerHour: 5_500, load: 0.4, travelMinutes: 19 },
  { id: 'l09', from: 'z09', to: 'z10', mode: 'bus', capacityPerHour: 4_800, load: 0.22, travelMinutes: 21 },
  { id: 'l10', from: 'z10', to: 'z12', mode: 'road', capacityPerHour: 4_200, load: 0.18, travelMinutes: 15 },
  { id: 'l11', from: 'z06', to: 'z10', mode: 'road', capacityPerHour: 5_000, load: 0.24, travelMinutes: 23 },
  { id: 'l12', from: 'z04', to: 'z12', mode: 'bus', capacityPerHour: 3_600, load: 0.31, travelMinutes: 13 },
  { id: 'l13', from: 'z08', to: 'z02', mode: 'road', capacityPerHour: 6_000, load: 0.36, travelMinutes: 17 },
]

/**
 * Event schedule, in minutes since sim epoch (sim epoch = 16:00 local).
 * The 40,000-seat final ending at T+320 is the demo's detonator.
 */
export const EVENTS: EventBlock[] = [
  {
    id: 'e01', name: 'GROUP STAGE · HEATS', venueZoneId: 'z06',
    startsAt: 30, endsAt: 110, attendees: 18_000,
    releaseProfile: [
      { zoneId: 'z09', share: 0.3 }, { zoneId: 'z02', share: 0.28 },
      { zoneId: 'z10', share: 0.22 }, { zoneId: 'z05', share: 0.2 },
    ],
  },
  {
    id: 'e02', name: 'OPENING CEREMONY', venueZoneId: 'z03',
    startsAt: 95, endsAt: 175, attendees: 26_000,
    releaseProfile: [
      { zoneId: 'z01', share: 0.2 }, { zoneId: 'z05', share: 0.3 },
      { zoneId: 'z02', share: 0.24 }, { zoneId: 'z07', share: 0.12 },
    ],
  },
  {
    id: 'e03', name: 'HEADLINE FIXTURE · FINAL', venueZoneId: 'z03',
    startsAt: 200, endsAt: 320, attendees: 40_000,
    releaseProfile: [
      { zoneId: 'z01', share: 0.5 }, { zoneId: 'z02', share: 0.26 },
      { zoneId: 'z05', share: 0.14 }, { zoneId: 'z07', share: 0.1 },
    ],
  },
  {
    id: 'e04', name: 'AFTER-HOURS CONCERT', venueZoneId: 'z06',
    startsAt: 330, endsAt: 420, attendees: 22_000,
    releaseProfile: [
      { zoneId: 'z09', share: 0.34 }, { zoneId: 'z10', share: 0.3 },
      { zoneId: 'z02', share: 0.2 }, { zoneId: 'z06', share: 0.16 },
    ],
  },
]

/** Sim epoch = 16:00 local. Converts sim minutes to a wall-clock string. */
export function wallClock(minutes: number): string {
  const total = (16 * 60 + Math.floor(minutes)) % (24 * 60)
  const h = Math.floor(total / 60)
  const m = total % 60
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0')
}

/** Great-circle-ish distance in km between two zones (flat-earth is fine at city scale). */
export function zoneDistanceKm(a: Zone, b: Zone): number {
  const dLat = (a.lat - b.lat) * 111
  const dLng = (a.lng - b.lng) * 111 * Math.cos((a.lat * Math.PI) / 180)
  return Math.sqrt(dLat * dLat + dLng * dLng)
}
