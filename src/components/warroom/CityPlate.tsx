import { ZONE_BY_ID } from '@/data/city'
import { BANDS } from '@/data/types'
import type { Snapshot } from '@/data/types'
import { cn } from '@/lib/utils'

const W = 160
const H = 100
const PAD_X = 10
const PAD_Y = 9

function px(x: number) {
  return PAD_X + x * (W - PAD_X * 2)
}
function py(y: number) {
  return PAD_Y + y * (H - PAD_Y * 2)
}

/**
 * Schematic pressure plate. Not a street map on purpose: an operator
 * scanning this at a glance needs topology and load, not geography.
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

  return (
    <div className={cn('relative', className)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" role="img" aria-label="Zone pressure plate">
        <defs>
          <pattern id="plate-grid" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M8 0H0V8" fill="none" stroke="var(--color-line-strong)" strokeWidth="0.12" opacity="0.5" />
          </pattern>
          <radialGradient id="plate-vignette">
            <stop offset="55%" stopColor="transparent" />
            <stop offset="100%" stopColor="var(--color-paper)" />
          </radialGradient>
          {Object.entries(BANDS).map(([band, meta]) => (
            <radialGradient key={band} id={`glow-${band}`}>
              <stop offset="0%" stopColor={meta.color} stopOpacity="0.5" />
              <stop offset="100%" stopColor={meta.color} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>

        <rect width={W} height={H} fill="url(#plate-grid)" />

        {/* sector labels */}
        {['SECTOR A', 'SECTOR B', 'SECTOR C', 'SECTOR D', 'SECTOR E', 'SECTOR F'].map((s, i) => (
          <text
            key={s}
            x={PAD_X + (i % 3) * 47}
            y={PAD_Y - 3 + Math.floor(i / 3) * 88}
            className="tele"
            fill="var(--color-line-strong)"
            fontSize="2.1"
            letterSpacing="0.5"
          >
            {s}
          </text>
        ))}

        {/* transit links */}
        {snapshot.links.map((l) => {
          const a = ZONE_BY_ID[l.from]
          const b = ZONE_BY_ID[l.to]
          if (!a || !b) return null
          const hot = l.load > 0.72
          return (
            <g key={l.id}>
              <line
                x1={px(a.x)}
                y1={py(a.y)}
                x2={px(b.x)}
                y2={py(b.y)}
                stroke={hot ? 'var(--color-ember-500)' : 'var(--color-line-strong)'}
                strokeWidth={0.22 + l.load * 0.75}
                opacity={0.35 + l.load * 0.5}
              />
              {hot && (
                <line
                  x1={px(a.x)}
                  y1={py(a.y)}
                  x2={px(b.x)}
                  y2={py(b.y)}
                  stroke="var(--color-ember-400)"
                  strokeWidth="0.5"
                  strokeDasharray="1.5 4"
                  opacity="0.9"
                >
                  <animate attributeName="stroke-dashoffset" from="11" to="0" dur="1.1s" repeatCount="indefinite" />
                </line>
              )}
            </g>
          )
        })}

        {/* zones */}
        {snapshot.zones.map((z) => {
          const p = byId[z.id]
          if (!p) return null
          const meta = BANDS[p.band]
          const r = 1.9 + (z.capacity / 62_000) * 2.6
          const isSelected = selected === z.id
          const alarming = p.band === 'warning' || p.band === 'critical'

          return (
            <g
              key={z.id}
              transform={`translate(${px(z.x)} ${py(z.y)})`}
              onClick={() => onSelect(z.id)}
              className="cursor-pointer"
            >
              {/* pressure halo */}
              <circle r={r * 3.6} fill={`url(#glow-${p.band})`} opacity={0.35 + (p.score / 100) * 0.65} />

              {alarming && (
                <circle
                  r={r + 2.2}
                  fill="none"
                  stroke={meta.color}
                  strokeWidth="0.28"
                  style={{ animation: 'nexus-pulse 1.6s ease-in-out infinite', transformOrigin: 'center' }}
                />
              )}

              {isSelected && (
                <>
                  <circle r={r + 4.4} fill="none" stroke="var(--color-ember-500)" strokeWidth="0.22" strokeDasharray="1 2" />
                  {[0, 90, 180, 270].map((d) => (
                    <line
                      key={d}
                      x1="0"
                      y1={-(r + 5.6)}
                      x2="0"
                      y2={-(r + 3.6)}
                      stroke="var(--color-ember-500)"
                      strokeWidth="0.35"
                      transform={`rotate(${d})`}
                    />
                  ))}
                </>
              )}

              <circle r={r} fill="var(--color-surface)" stroke={meta.color} strokeWidth="0.42" />
              <circle r={r * Math.min(p.occupancy / p.capacity, 1) * 0.92} fill={meta.color} opacity="0.85" />

              <text
                y={r + 3.3}
                textAnchor="middle"
                fontSize="2.2"
                fontFamily="var(--font-tele)"
                letterSpacing="0.22"
                fill={isSelected ? 'var(--color-ink)' : 'var(--color-ink)'}
                opacity={isSelected ? 1 : 0.62}
              >
                {z.code}
              </text>
              <text
                y={r + 6.2}
                textAnchor="middle"
                fontSize="2.4"
                fontFamily="var(--font-tele)"
                fontWeight="700"
                fill={meta.color}
                opacity={alarming ? 1 : 0.72}
              >
                {p.score.toFixed(0)}
              </text>
            </g>
          )
        })}

        <rect width={W} height={H} fill="url(#plate-vignette)" pointerEvents="none" />
      </svg>

    </div>
  )
}
