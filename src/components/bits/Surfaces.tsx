import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'motion/react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* ============================================================
   Aurora
   Slow drifting gradient fields. This is the atmosphere behind
   the landing page, kept strictly inside the palette.
   ============================================================ */

export function Aurora({ className, intensity = 1 }: { className?: string; intensity?: number }) {
  return (
    <div data-decorative className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      <style>
        {'@keyframes aur-a{0%,100%{transform:translate3d(-6%,-3%,0) scale(1)}' +
          '50%{transform:translate3d(8%,5%,0) scale(1.2)}}' +
          '@keyframes aur-b{0%,100%{transform:translate3d(10%,6%,0) scale(1.12)}' +
          '50%{transform:translate3d(-8%,-5%,0) scale(0.92)}}'}
      </style>
      <div
        className="absolute -left-[18%] top-[-24%] h-[78vh] w-[78vh] rounded-full blur-[120px]"
        style={{
          background: 'radial-gradient(circle, var(--color-ember-100), transparent 68%)',
          opacity: 0.85 * intensity,
          animation: 'aur-a 24s ease-in-out infinite',
        }}
      />
      <div
        className="absolute -right-[12%] top-[10%] h-[64vh] w-[64vh] rounded-full blur-[130px]"
        style={{
          background: 'radial-gradient(circle, var(--color-ember-400), transparent 70%)',
          opacity: 0.16 * intensity,
          animation: 'aur-b 29s ease-in-out infinite',
        }}
      />
    </div>
  )
}

/* ============================================================
   Particles
   A drifting field of embers on canvas. Density is deliberately
   low so it never competes with the content.
   ============================================================ */

export function Particles({
  count = 90,
  className,
  speed = 0.16,
  connect = false,
}: {
  count?: number
  className?: string
  speed?: number
  connect?: boolean
}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let w = 0
    let h = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const dots = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * speed * 0.01,
      vy: (Math.random() - 0.5) * speed * 0.01,
      r: Math.random() * 1.6 + 0.4,
      a: Math.random() * 0.5 + 0.15,
    }))

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      for (const d of dots) {
        d.x += d.vx
        d.y += d.vy
        if (d.x < 0 || d.x > 1) d.vx *= -1
        if (d.y < 0 || d.y > 1) d.vy *= -1
        ctx.beginPath()
        ctx.arc(d.x * w, d.y * h, d.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(249,132,63,' + d.a + ')'
        ctx.fill()
      }
      if (connect) {
        ctx.lineWidth = 0.5
        for (let i = 0; i < dots.length; i++) {
          for (let j = i + 1; j < dots.length; j++) {
            const dx = (dots[i].x - dots[j].x) * w
            const dy = (dots[i].y - dots[j].y) * h
            const dist = Math.hypot(dx, dy)
            if (dist < 110) {
              ctx.beginPath()
              ctx.strokeStyle = 'rgba(232,93,16,' + (1 - dist / 110) * 0.14 + ')'
              ctx.moveTo(dots[i].x * w, dots[i].y * h)
              ctx.lineTo(dots[j].x * w, dots[j].y * h)
              ctx.stroke()
            }
          }
        }
      }
      raf = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [count, speed, connect])

  return (
    <canvas
      ref={ref}
      data-decorative
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
      aria-hidden
    />
  )
}

/* ============================================================
   PressureCard
   The hover state runs the product's own mechanic on the card.

   A fill rises from the bottom the way occupancy fills a zone on
   the pressure plate, crossing the 70 / 85 / 95 threshold rules
   drawn across the card. The readout counts up with it and the
   accent steps bands as it passes each line, so hovering a card
   demonstrates what a pressure score is without a word of
   explanation. Leaving drains it back down.

   Two earlier attempts here were a cursor tracked radial gradient
   and a border trace with corner ticks. Both were generic motion
   borrowed from other sites. This one is only possible because of
   what NEXUS is, which is the point.
   ============================================================ */

const BAND_STOPS: { min: number; color: string; label: string }[] = [
  { min: 95, color: '#a61304', label: 'CRITICAL' },
  { min: 85, color: '#e85d10', label: 'WARNING' },
  { min: 70, color: '#f9843f', label: 'WATCH' },
  { min: 0, color: '#4a0d02', label: 'NOMINAL' },
]

function stopFor(v: number) {
  return BAND_STOPS.find((b) => v >= b.min) ?? BAND_STOPS[BAND_STOPS.length - 1]
}

export function PressureCard({
  children,
  className,
  score = 78,
  ...rest
}: {
  children: ReactNode
  className?: string
  /** Where the fill settles on hover. Real zone scores where we have them. */
  score?: number
  'data-tour'?: string
}) {
  const [value, setValue] = useState(0)
  const target = useRef(0)
  const raf = useRef(0)

  const run = useCallback(() => {
    cancelAnimationFrame(raf.current)
    const from = value
    const to = target.current
    const dist = Math.abs(to - from)
    if (dist < 0.5) {
      setValue(to)
      return
    }
    // filling is slower than draining, the same asymmetry a real zone has
    const dur = (to > from ? 780 : 420) * (dist / 100) + 140
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / dur, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(from + (to - from) * eased)
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }, [value])

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const stop = stopFor(value)
  const lit = value > 1

  return (
    <div
      {...rest}
      onMouseEnter={() => {
        target.current = score
        run()
      }}
      onMouseLeave={() => {
        target.current = 0
        run()
      }}
      className={cn('panel group relative overflow-hidden', className)}
      style={{
        borderColor: lit ? stop.color : undefined,
        transition: 'border-color 240ms linear',
      }}
    >
      {/* the fill, kept faint so the copy over it stays readable */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0"
        style={{
          height: value + '%',
          background: `linear-gradient(180deg,
            color-mix(in oklab, ${stop.color} 20%, transparent),
            color-mix(in oklab, ${stop.color} 9%, transparent))`,
        }}
      />
      {/* its surface line */}
      <div
        className="pointer-events-none absolute inset-x-0"
        style={{
          bottom: value + '%',
          height: 1,
          background: stop.color,
          opacity: lit ? 0.85 : 0,
        }}
      />

      {/* the three thresholds, measured from the bottom like the plate */}
      {[70, 85, 95].map((t) => (
        <div
          key={t}
          className="pointer-events-none absolute inset-x-0 flex items-center gap-2 px-4"
          style={{
            bottom: t + '%',
            height: 1,
            opacity: lit ? 0.55 : 0,
            transition: 'opacity 260ms linear',
          }}
        >
          <span
            className="num text-[0.55rem] tracking-[0.14em]"
            style={{ color: stopFor(t).color }}
          >
            {t}
          </span>
          <span className="h-px flex-1" style={{ background: stopFor(t).color, opacity: 0.45 }} />
        </div>
      ))}

      {/* The readout rides the fill line rather than sitting in a corner.
          A fixed corner collided with content the cards already put there,
          and a marker at the water line reads like a gauge anyway. The chip
          carries its own ground so it stays legible over the copy. */}
      <div
        className="pointer-events-none absolute right-3 z-20 flex items-center gap-2 border bg-surface px-2.5 py-1"
        style={{
          bottom: `calc(${value}% - 0.85rem)`,
          borderColor: stop.color,
          opacity: lit ? 1 : 0,
          transition: 'opacity 200ms linear',
        }}
      >
        <span className="num text-[0.95rem] font-bold leading-none" style={{ color: stop.color }}>
          {Math.round(value)}
        </span>
        <span className="tele leading-none" style={{ color: stop.color }}>
          {stop.label}
        </span>
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  )
}

/* ============================================================
   TiltCard
   Subtle 3D tilt toward the cursor.
   ============================================================ */

export function TiltCard({
  children,
  className,
  max = 8,
}: {
  children: ReactNode
  className?: string
  max?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const rx = useSpring(useMotionValue(0), { stiffness: 220, damping: 22 })
  const ry = useSpring(useMotionValue(0), { stiffness: 220, damping: 22 })

  return (
    <motion.div
      ref={ref}
      className={cn('relative', className)}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect()
        if (!rect) return
        const px = (e.clientX - rect.left) / rect.width - 0.5
        const py = (e.clientY - rect.top) / rect.height - 0.5
        ry.set(px * max * 2)
        rx.set(-py * max * 2)
      }}
      onMouseLeave={() => {
        rx.set(0)
        ry.set(0)
      }}
    >
      {children}
    </motion.div>
  )
}

function clampOffset(v: number, max: number): number {
  return Math.max(-max, Math.min(v, max))
}

/* ============================================================
   Magnet
   Pulls an element toward the cursor within a radius. Used on the
   primary buttons only.
   ============================================================ */

export function Magnet({
  children,
  className,
  strength = 0.12,
  radius = 70,
  maxOffset = 9,
}: {
  children: ReactNode
  className?: string
  strength?: number
  radius?: number
  /** Hard cap in pixels, so the pull is felt rather than watched. */
  maxOffset?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  // a soft spring, not a snappy one, or the button chases the cursor
  const x = useSpring(useMotionValue(0), { stiffness: 130, damping: 24, mass: 0.6 })
  const y = useSpring(useMotionValue(0), { stiffness: 130, damping: 24, mass: 0.6 })

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const rect = ref.current?.getBoundingClientRect()
      if (!rect) return
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      if (Math.hypot(dx, dy) < radius + rect.width / 2) {
        x.set(clampOffset(dx * strength, maxOffset))
        y.set(clampOffset(dy * strength, maxOffset))
      } else {
        x.set(0)
        y.set(0)
      }
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [strength, radius, maxOffset, x, y])

  return (
    <motion.div ref={ref} className={cn('inline-block', className)} style={{ x, y }}>
      {children}
    </motion.div>
  )
}

/* ============================================================
   Parallax
   Moves a layer against the scroll. Negative speed sends it the
   other way, which is what sells the depth on the hero.
   ============================================================ */

export function Parallax({
  children,
  speed = 0.3,
  className,
}: {
  children: ReactNode
  speed?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', speed * 100 + '%'])
  const smooth = useSpring(y, { stiffness: 120, damping: 30, mass: 0.4 })

  return (
    <div ref={ref} className={cn('relative', className)}>
      <motion.div style={{ y: smooth }}>{children}</motion.div>
    </div>
  )
}

/* ============================================================
   Marquee
   Infinite horizontal ticker. Duplicated once so the loop is
   seamless at fifty percent translation.
   ============================================================ */

export function Marquee({
  children,
  speed = 34,
  reverse = false,
  className,
}: {
  children: ReactNode
  speed?: number
  reverse?: boolean
  className?: string
}) {
  return (
    <div className={cn('mask-fade-x relative flex overflow-hidden', className)}>
      <div
        className="flex shrink-0 items-center gap-10 pr-10"
        style={{
          animation: 'nexus-ticker ' + speed + 's linear infinite' + (reverse ? ' reverse' : ''),
        }}
      >
        <div className="flex shrink-0 items-center gap-10 pr-10">{children}</div>
        <div className="flex shrink-0 items-center gap-10 pr-10" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  )
}
