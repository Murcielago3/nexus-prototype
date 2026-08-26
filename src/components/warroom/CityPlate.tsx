import { useState } from 'react'
import { ZONE_BY_ID } from '@/data/city'
import { BANDS } from '@/data/types'
import type { Snapshot } from '@/data/types'
import { cn } from '@/lib/utils'

const W = 160
const H = 96
const PAD_X = 12
const PAD_Y = 11

function px(x: number) {
  return PAD_X + x * (W - PAD_X * 2)
}
function py(y: number) {
  return PAD_Y + y * (H - PAD_Y * 2)
}

/**
 * Schematic pressure plate. Not a street map on purpose: an operator scanning
 * this at a glance needs topology and load, not geography.
 *
 * Every label here sets its size with the SVG fontSize attribute and nothing
 * else. A CSS font-size class on an SVG text node is read in user units, which
 * on a 160 wide viewBox renders enormous.
 */
export function CityPlate({
  snapshot,
  selected,
  onSelect,
  className,
}: {
  snapshot: Snapshot
  selected: string
  onSelect: (id: string) => void
  className?: string
}) {
  const byId = Object.fromEntries(snapshot.pressures.map((p) => [p.zoneId, p]))
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div className={cn('relative', className)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" role="img" aria-label="Zone pressure plate">
        <defs>
          <pattern id="plate-grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M10 0H0V10" fill="none" stroke="var(--color-line)" strokeWidth="0.15" />
          </pattern>
          {Object.entries(BANDS).map(([band, meta]) => (
            <radialGradient key={band} id={`glow-${band}`}>
              <stop offset="0%" stopColor={meta.color} stopOpacity="0.26" />
              <stop offset="100%" stopColor={meta.color} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>

        <rect width={W} height={H} fill="url(#plate-grid)" />

        {/* transit links */}
        {snapshot.links.map((l) => {
          const a = ZONE_BY_ID[l.from]
          const b = ZONE_BY_ID[l.to]
          if (!a || !b) return null
          const hot = l.load > 0.72
          return (
            <line
              key={l.id}
              x1={px(a.x)}
              y1={py(a.y)}
              x2={px(b.x)}
              y2={py(b.y)}
              stroke={hot ? 'var(--color-ember-500)' : 'var(--color-line-strong)'}
              strokeWidth={hot ? 0.5 : 0.28}
              opacity={hot ? 0.85 : 0.6}
            />
          )
        })}

        {/* zones */}
        {snapshot.zones.map((z) => {
          const p = byId[z.id]
          if (!p) return null
          const meta = BANDS[p.band]
          const r = 2.4 + (z.capacity / 62_000) * 2.4
          const isSelected = selected === z.id
          const isHovered = hovered === z.id
          const alarming = p.band === 'warning' || p.band === 'critical'

          return (
            <g
              key={z.id}
              transform={`translate(${px(z.x)} ${py(z.y)})`}
              onClick={() => onSelect(z.id)}
              onMouseEnter={() => setHovered(z.id)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer"
            >
              <circle r={r * 3.2} fill={`url(#glow-${p.band})`} />

              {alarming && (
                <circle
                  r={r + 2}
                  fill="none"
                  stroke={meta.color}
                  strokeWidth="0.3"
                  style={{ animation: 'nexus-pulse 1.8s ease-in-out infinite', transformOrigin: 'center' }}
                />
              )}

              {isSelected && (
                <circle
                  r={r + 3.4}
                  fill="none"
                  stroke="var(--color-ember-500)"
                  strokeWidth="0.35"
                  strokeDasharray="1.2 1.8"
                />
              )}

              {/* the ring is the zone, the inner disc is how full it is */}
              <circle r={r} fill="var(--color-surface)" stroke={meta.color} strokeWidth="0.55" />
              <circle r={r * Math.min(p.occupancy / p.capacity, 1) * 0.86} fill={meta.color} />

              <text
                y={r + 4.4}
                textAnchor="middle"
                fontSize="2.9"
                fontFamily="var(--font-tele)"
                fontWeight={isSelected || isHovered ? 700 : 500}
                fill="var(--color-ink)"
                opacity={isSelected || isHovered ? 0.95 : 0.55}
              >
                {z.code}
              </text>
              <text
                y={r + 8.4}
                textAnchor="middle"
                fontSize="3.2"
                fontFamily="var(--font-tele)"
                fontWeight="700"
                fill={meta.color}
              >
                {p.score.toFixed(0)}
              </text>
            </g>
          )
        })}
      </svg>

      {/* the full name only when it is asked for, so the plate stays quiet */}
      {hovered && ZONE_BY_ID[hovered] && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap border border-line bg-surface px-3 py-2 shadow-sm"
          style={{
            left: (px(ZONE_BY_ID[hovered].x) / W) * 100 + '%',
            top: (py(ZONE_BY_ID[hovered].y) / H) * 100 - 4 + '%',
          }}
        >
          <div className="tele text-ink/45">{ZONE_BY_ID[hovered].sector}</div>
          <div className="num mt-0.5 text-[0.74rem] font-bold text-ink">{ZONE_BY_ID[hovered].name}</div>
        </div>
      )}
    </div>
  )
}
