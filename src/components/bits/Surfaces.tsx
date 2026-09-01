import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'motion/react'
import type { Variants } from 'motion/react'
import { useEffect, useRef, type ReactNode } from 'react'
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
   ReticleCard
   Hover reads as a targeting system acquiring a zone, which is
   what the product actually does. Four hairlines trace the
   perimeter clockwise, corner ticks snap inward, and a single
   scan line sweeps the card once.

   This replaced a cursor tracked radial gradient. That effect is
   on roughly every site shipped in the last two years and it said
   nothing about NEXUS.

   The perimeter is four scaled divs rather than an SVG rect with
   pathLength, which is not reliably supported on rect across
   browsers. Transforms are, and they composite on the GPU.
   ============================================================ */

/** Tuple, not number[], or motion reads it as a keyframe list. */
const EASE = [0.22, 1, 0.28, 1] as const

const TRACE: Variants = {
  rest: { scaleX: 0, scaleY: 0 },
  hover: (i: number) => ({
    scaleX: 1,
    scaleY: 1,
    transition: { duration: 0.28, delay: i * 0.09, ease: EASE },
  }),
}

const TICK: Variants = {
  rest: { opacity: 0, scale: 0.5 },
  hover: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, delay: 0.18 + i * 0.05, ease: EASE },
  }),
}

export function ReticleCard({
  children,
  className,
  ...rest
}: {
  children: ReactNode
  className?: string
  /** Lets the guided tour anchor a spotlight to this card. */
  'data-tour'?: string
}) {
  return (
    <motion.div
      {...rest}
      initial="rest"
      whileHover="hover"
      animate="rest"
      whileFocus="hover"
      variants={{ rest: { y: 0 }, hover: { y: -3 } }}
      transition={{ duration: 0.35, ease: EASE }}
      className={cn('panel group relative overflow-hidden', className)}
    >
      {/* perimeter, drawn clockwise from the top left */}
      <motion.span custom={0} variants={TRACE} className="pointer-events-none absolute left-0 top-0 h-px w-full origin-left bg-ember-500" />
      <motion.span custom={1} variants={TRACE} className="pointer-events-none absolute right-0 top-0 h-full w-px origin-top bg-ember-500" />
      <motion.span custom={2} variants={TRACE} className="pointer-events-none absolute bottom-0 right-0 h-px w-full origin-right bg-ember-500" />
      <motion.span custom={3} variants={TRACE} className="pointer-events-none absolute bottom-0 left-0 h-full w-px origin-bottom bg-ember-500" />

      {/* corner ticks, the same reticle the console and the tour use */}
      {[
        { i: 0, cls: 'left-1.5 top-1.5 border-l border-t' },
        { i: 1, cls: 'right-1.5 top-1.5 border-r border-t' },
        { i: 2, cls: 'right-1.5 bottom-1.5 border-b border-r' },
        { i: 3, cls: 'bottom-1.5 left-1.5 border-b border-l' },
      ].map((c) => (
        <motion.span
          key={c.i}
          custom={c.i}
          variants={TICK}
          className={cn('pointer-events-none absolute h-2.5 w-2.5 border-ember-500', c.cls)}
        />
      ))}

      {/* one pass of the scan line */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-16"
        style={{
          background:
            'linear-gradient(180deg, transparent, color-mix(in oklab, var(--color-ember-500) 12%, transparent), transparent)',
        }}
        variants={{
          rest: { opacity: 0, y: '-100%' },
          hover: {
            opacity: [0, 1, 1, 0],
            y: ['-100%', '0%', '620%', '760%'],
            transition: { duration: 1.05, times: [0, 0.12, 0.86, 1], ease: 'linear' },
          },
        }}
      />

      <div className="relative">{children}</div>
    </motion.div>
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
