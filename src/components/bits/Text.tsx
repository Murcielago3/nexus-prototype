import { motion, useInView } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/* ============================================================
   SplitText
   Per character reveal with a stagger. Used for the big display
   headlines so they land one letter at a time.
   ============================================================ */

export function SplitText({
  text,
  className,
  delay = 0,
  stagger = 0.028,
  as: As = 'span',
}: {
  text: string
  className?: string
  delay?: number
  stagger?: number
  as?: 'span' | 'h1' | 'h2' | 'h3'
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const words = text.split(' ')
  let index = 0

  return (
    <As ref={ref as never} className={cn('inline-block', className)}>
      {words.map((word, w) => (
        <span key={w} className="inline-block whitespace-nowrap">
          {word.split('').map((char) => {
            const i = index++
            return (
              <motion.span
                key={i}
                className="inline-block will-change-transform"
                initial={{ opacity: 0, y: '0.45em', rotateX: -55 }}
                animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : undefined}
                transition={{
                  duration: 0.75,
                  delay: delay + i * stagger,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {char}
              </motion.span>
            )
          })}
          {w < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </As>
  )
}

/* ============================================================
   DecryptedText
   Scrambles through glyphs before settling. Gives the console a
   decoding feel without being noisy.
   ============================================================ */

const GLYPHS = '▚▞█▓▒░#@$%&/\\<>[]{}=+*ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export function DecryptedText({
  text,
  className,
  speed = 34,
  revealDelay = 0,
  trigger = 'view',
}: {
  text: string
  className?: string
  speed?: number
  revealDelay?: number
  trigger?: 'view' | 'hover' | 'mount'
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const [output, setOutput] = useState(trigger === 'mount' ? text : '')
  const [run, setRun] = useState(trigger === 'mount')

  useEffect(() => {
    if (trigger === 'view' && inView) {
      const t = setTimeout(() => setRun(true), revealDelay)
      return () => clearTimeout(t)
    }
  }, [inView, trigger, revealDelay])

  useEffect(() => {
    if (!run) return
    let frame = 0
    const total = text.length * 3
    const id = setInterval(() => {
      frame++
      const settled = Math.floor(frame / 3)
      setOutput(
        text
          .split('')
          .map((ch, i) => {
            if (ch === ' ') return ' '
            if (i < settled) return ch
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
          })
          .join(''),
      )
      if (frame >= total) {
        clearInterval(id)
        setOutput(text)
      }
    }, speed)
    return () => clearInterval(id)
  }, [run, text, speed])

  return (
    <span
      ref={ref}
      className={cn('inline-block', className)}
      onMouseEnter={trigger === 'hover' ? () => setRun(true) : undefined}
    >
      {output || text.replace(/\S/g, ' ')}
    </span>
  )
}

/* ============================================================
   ShinyText
   A slow sheen crossing the glyphs. Reserved for the tagline and
   primary calls to action.
   ============================================================ */

export function ShinyText({
  children,
  className,
  duration = 4.5,
}: {
  children: React.ReactNode
  className?: string
  duration?: number
}) {
  return (
    <span
      className={cn('relative inline-block bg-clip-text text-transparent', className)}
      style={{
        backgroundImage:
          'linear-gradient(110deg, var(--color-ink) 18%, var(--color-ember-700) 40%, var(--color-ember-500) 50%, var(--color-ember-700) 60%, var(--color-ink) 82%)',
        backgroundSize: '260% 100%',
        animation: 'shiny ' + duration + 's linear infinite',
      }}
    >
      <style>{'@keyframes shiny{0%{background-position:180% 0}100%{background-position:-80% 0}}'}</style>
      {children}
    </span>
  )
}

/* ============================================================
   CountUp
   Eases a number into place when it scrolls into view.
   ============================================================ */

export function CountUp({
  to,
  from = 0,
  duration = 1.9,
  decimals = 0,
  suffix = '',
  prefix = '',
  separator = true,
  className,
}: {
  to: number
  from?: number
  duration?: number
  decimals?: number
  suffix?: string
  prefix?: string
  separator?: boolean
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const [value, setValue] = useState(from)

  useEffect(() => {
    if (!inView) return
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - t, 4)
      setValue(from + (to - from) * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, to, from, duration])

  const text = separator
    ? value.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : value.toFixed(decimals)

  return (
    <span ref={ref} className={cn('num', className)}>
      {prefix}
      {text}
      {suffix}
    </span>
  )
}

/* ============================================================
   ScrollReveal
   Word by word opacity driven by scroll position. Used for the
   manifesto blocks on the landing page.
   ============================================================ */

export function ScrollReveal({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      const p = 1 - (rect.top - vh * 0.25) / (vh * 0.55)
      setProgress(Math.min(Math.max(p, 0), 1))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const words = children.split(' ')

  return (
    <p ref={ref} className={className}>
      {words.map((word, i) => {
        const threshold = i / words.length
        const local = Math.min(Math.max((progress - threshold * 0.85) * 6, 0), 1)
        return (
          <span
            key={i}
            style={{
              opacity: 0.14 + local * 0.86,
              filter: 'blur(' + (1 - local) * 3 + 'px)',
              transition: 'opacity 120ms linear, filter 120ms linear',
            }}
          >
            {word}{' '}
          </span>
        )
      })}
    </p>
  )
}

/* ============================================================
   GlitchText
   Two offset colour channels that jitter. Used sparingly, only on
   critical state labels.
   ============================================================ */

export function GlitchText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn('relative inline-block', className)} data-text={text}>
      <style>
        {'@keyframes gl-a{0%,100%{clip-path:inset(0 0 82% 0);transform:translate(0)}' +
          '20%{clip-path:inset(22% 0 55% 0);transform:translate(-2px,1px)}' +
          '40%{clip-path:inset(58% 0 18% 0);transform:translate(2px,-1px)}' +
          '60%{clip-path:inset(8% 0 74% 0);transform:translate(-1px,0)}' +
          '80%{clip-path:inset(70% 0 6% 0);transform:translate(1px,1px)}}'}
      </style>
      <span className="relative z-10">{text}</span>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 text-ember-500"
        style={{ animation: 'gl-a 2.6s steps(2,end) infinite' }}
      >
        {text}
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 text-ink/45"
        style={{ animation: 'gl-a 3.4s steps(2,end) infinite reverse' }}
      >
        {text}
      </span>
    </span>
  )
}
