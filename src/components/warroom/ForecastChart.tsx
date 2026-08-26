import { wallClock } from '@/data/city'
import { BANDS } from '@/data/types'
import type { ZoneForecast } from '@/data/types'
import { cn } from '@/lib/utils'

const W = 320
const H = 118
const L = 26
const R = 8
const T = 8
const B = 18

function sx(t: number, horizon: number) {
  return L + (t / horizon) * (W - L - R)
}
function sy(v: number) {
  return T + (1 - v / 100) * (H - T - B)
}

/**
 * Two hour projection with its confidence band. The threshold lines are
 * drawn on the same axis so the crossing point is readable without a legend.
 */
export function ForecastChart({
  forecast,
  clock,
  className,
}: {
  forecast: ZoneForecast
  clock: number
  className?: string
}) {
  const { points, horizonMinutes } = forecast

  const line = points.map((p, i) => (i ? 'L' : 'M') + sx(p.t, horizonMinutes) + ' ' + sy(p.value)).join(' ')
  const band =
    points.map((p, i) => (i ? 'L' : 'M') + sx(p.t, horizonMinutes) + ' ' + sy(p.upper)).join(' ') +
    ' ' +
    [...points].reverse().map((p) => 'L' + sx(p.t, horizonMinutes) + ' ' + sy(p.lower)).join(' ') +
    ' Z'
  const fill = line + ' L' + sx(horizonMinutes, horizonMinutes) + ' ' + sy(0) + ' L' + sx(0, horizonMinutes) + ' ' + sy(0) + ' Z'

  const eta = forecast.etaToSaturationMin

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn('w-full', className)} role="img" aria-label="Pressure forecast">
      <defs>
        <linearGradient id="fc-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-ember-500)" stopOpacity="0.34" />
          <stop offset="100%" stopColor="var(--color-ember-500)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* threshold rules */}
      {(['watch', 'warning', 'critical'] as const).map((b) => (
        <g key={b}>
          <line
            x1={L}
            y1={sy(BANDS[b].min)}
            x2={W - R}
            y2={sy(BANDS[b].min)}
            stroke={BANDS[b].color}
            strokeWidth="0.5"
            strokeDasharray="2 3"
            opacity="0.4"
          />
          <text x={2} y={sy(BANDS[b].min) + 2.4} fontSize="6.5" fontFamily="var(--font-tele)" fill={BANDS[b].color} opacity="0.7">
            {BANDS[b].min}
          </text>
        </g>
      ))}

      <path d={band} fill="var(--color-ember-400)" opacity="0.2" />
      <path d={fill} fill="url(#fc-fill)" />
      <path d={line} fill="none" stroke="var(--color-ember-500)" strokeWidth="1.6" strokeLinejoin="round" />

      {/* saturation crossing */}
      {eta !== null && (
        <g>
          <line
            x1={sx(eta, horizonMinutes)}
            y1={T}
            x2={sx(eta, horizonMinutes)}
            y2={H - B}
            stroke="var(--color-critical)"
            strokeWidth="0.8"
          />
          <circle cx={sx(eta, horizonMinutes)} cy={sy(95)} r="2.6" fill="var(--color-critical)" />
          <circle cx={sx(eta, horizonMinutes)} cy={sy(95)} r="4.6" fill="none" stroke="var(--color-critical)" strokeWidth="0.5">
            <animate attributeName="r" values="3;7;3" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0;0.9" dur="1.8s" repeatCount="indefinite" />
          </circle>
          <text
            x={sx(eta, horizonMinutes) + 4}
            y={T + 8}
            fontSize="7"
            fontFamily="var(--font-tele)"
            fontWeight="700"
            fill="var(--color-critical)"
          >
            T+{eta}
          </text>
        </g>
      )}

      {/* now marker */}
      <circle cx={sx(0, horizonMinutes)} cy={sy(points[0].value)} r="2.4" fill="var(--color-ink)" />

      {/* x axis */}
      <line x1={L} y1={H - B} x2={W - R} y2={H - B} stroke="var(--color-line-strong)" strokeWidth="0.5" />
      {[0, 30, 60, 90, 120].map((t) => (
        <text
          key={t}
          x={sx(t, horizonMinutes)}
          y={H - B + 9}
          textAnchor="middle"
          fontSize="6.5"
          fontFamily="var(--font-tele)"
          fill="var(--color-ink)"
          opacity="0.38"
        >
          {wallClock(clock + t)}
        </text>
      ))}
    </svg>
  )
}
