import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Compass, Crosshair, Gauge, Radio, Route, ShieldAlert } from 'lucide-react'
import { Globe } from '@/components/Globe'
import {
  CountUp,
  DecryptedText,
  MaskLine,
  MaskText,
  ScrollReveal,
  ShinyText,
} from '@/components/bits/Text'
import { Aurora, Magnet, Parallax, ReticleCard, TiltCard } from '@/components/bits/Surfaces'
import { EVENTS, HOST_CITY, ZONES } from '@/data/city'
import { SCENARIO_MARKS } from '@/data/mock'
import { cn } from '@/lib/utils'

/* ───────────────────────── shared section furniture ───────────────────── */

function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="h-px w-8 bg-ember-500/70" />
      <span className="tele text-ember-700">{children}</span>
    </div>
  )
}

function SectionHead({ title, lede }: { title: string; lede?: string }) {
  return (
    <div className="mb-16 max-w-3xl">
      <motion.span
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.28, 1] }}
        className="mb-7 block h-px w-14 origin-left bg-ember-500"
      />
      <MaskText
        as="h2"
        text={title}
        className="display text-balance text-[clamp(2rem,4.8vw,3.7rem)] text-ink"
      />
      {lede && (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.9, delay: 0.28, ease: [0.22, 1, 0.28, 1] }}
          className="mt-7 max-w-2xl text-pretty font-luxe text-[1.4rem] leading-relaxed text-ink/80"
        >
          {lede}
        </motion.p>
      )}
    </div>
  )
}

/* ───────────────────────────────── hero ───────────────────────────────── */

function Hero() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })

  const globeY = useTransform(scrollYProgress, [0, 1], ['0%', '22%'])
  const globeScale = useTransform(scrollYProgress, [0, 1], [1, 1.1])
  const copyY = useTransform(scrollYProgress, [0, 1], ['0%', '-26%'])
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <section ref={ref} className="relative min-h-[100svh] overflow-hidden">
      <Aurora intensity={0.9} />

      <div className="relative mx-auto grid min-h-[100svh] max-w-[1500px] items-center gap-14 px-5 pb-16 pt-28 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.88fr)] lg:gap-16 lg:pt-24">
        {/* copy */}
        <motion.div style={{ y: copyY, opacity: fade }} className="relative z-10 max-w-[36rem]">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.28, 1] }}
          >
            <Eyebrow>Intelligent event orchestration</Eyebrow>
          </motion.div>

          {/* lines rise in sequence from behind a clipping edge, one block
              each, which carries more weight than characters arriving apart */}
          <h1 data-tour="hero-headline" className="display mt-8 text-[clamp(2.6rem,6.6vw,5.4rem)] text-ink">
            <MaskLine delay={0.2}>SEE THE CITY</MaskLine>
            <MaskLine delay={0.32}>BEFORE IT</MaskLine>
            <MaskLine delay={0.44}>
              <ShinyText>BREAKS.</ShinyText>
            </MaskLine>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 1.0, ease: [0.22, 1, 0.28, 1] }}
            className="mt-9 max-w-lg text-pretty font-luxe text-[1.24rem] italic leading-snug text-ink/86"
          >
            From reactive firefighting to proactive orchestration.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 1.14, ease: [0.22, 1, 0.28, 1] }}
            className="mt-6 max-w-md text-pretty text-[0.87rem] leading-relaxed text-ink/70"
          >
            A million visitors arrive in seventy two hours. Hotels, transit and venues each
            see one tenth of the picture. NEXUS holds all of it at once, and calls the
            bottleneck before it forms.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 1.3, ease: [0.22, 1, 0.28, 1] }}
            className="mt-11 flex flex-wrap items-center gap-3"
          >
            <Magnet>
              <Link
                to="/war-room"
                className="group inline-flex items-center gap-3 bg-ember-700 px-7 py-3.5 text-paper transition-colors hover:bg-ember-900"
              >
                <span className="tele font-bold">ENTER THE WAR ROOM</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Magnet>
            <Magnet>
              <Link
                to="/guide"
                className="group inline-flex items-center gap-3 border border-line-strong px-7 py-3.5 text-ink/88 transition-colors hover:border-ember-500 hover:text-ink"
              >
                <span className="tele">OPEN SMART GUIDE</span>
                <Compass className="h-3.5 w-3.5 transition-transform group-hover:rotate-45" />
              </Link>
            </Magnet>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.1, delay: 1.52, ease: [0.22, 1, 0.28, 1] }}
            className="mt-12 flex items-center gap-3 border-t border-line pt-5"
          >
            <span className="tele text-ink/62">LIVE OPERATION</span>
            <span className="num text-[0.68rem] tracking-[0.14em] text-ink/78">
              {HOST_CITY.name} · {HOST_CITY.eventName}
            </span>
          </motion.div>
        </motion.div>

        {/* globe: a background wash on small screens, a real column on desktop */}
        <motion.div
          style={{ y: globeY, scale: globeScale, opacity: fade }}
          className="pointer-events-none absolute inset-y-0 right-[-30%] z-0 my-auto h-fit w-[125vw] opacity-[0.18] lg:pointer-events-auto lg:static lg:w-auto lg:opacity-100"
        >
          <Globe className="mx-auto w-full max-w-[560px]" />
        </motion.div>
      </div>

    </section>
  )
}

/* ───────────────────────────── stats strip ───────────────────────────── */

function StatBar() {
  const stats = [
    { k: 'EXPECTED VISITORS', v: HOST_CITY.expectedVisitors, suffix: '' },
    { k: 'MONITORED ZONES', v: ZONES.length, suffix: '' },
    { k: 'BED CAPACITY', v: ZONES.reduce((s, z) => s + z.capacity, 0), suffix: '' },
    { k: 'FORECAST HORIZON', v: 120, suffix: ' MIN' },
  ]

  return (
    <section data-tour="statbar" className="border-y border-line bg-surface">
      <div className="mx-auto grid max-w-[1500px] grid-cols-2 divide-line md:grid-cols-4 md:divide-x">
        {stats.map((s) => (
          <div key={s.k} className="border-b border-line px-6 py-9 md:border-b-0">
            <div className="tele mb-3 text-ink/62">{s.k}</div>
            <div className="display text-[1.85rem] text-ink">
              <CountUp to={s.v} suffix={s.suffix} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ─────────────────────────────── manifesto ────────────────────────────── */

function Manifesto() {
  return (
    <section className="relative overflow-hidden py-32 sm:py-44">
      <Parallax speed={-0.12} className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[62vh] w-[62vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember-100/45 blur-[130px]" />
      </Parallax>

      <div data-tour="manifesto" className="relative mx-auto max-w-4xl px-5 text-center sm:px-8">
        <ScrollReveal className="mt-10 text-balance font-luxe text-[clamp(1.62rem,3.6vw,2.8rem)] leading-[1.36] text-ink">
          Everyone else builds a dashboard that tells you what already happened. A rear view
          mirror. NEXUS is a steering wheel. It watches pressure build across every hotel,
          every platform, every gate, and it names the failure that is still forty seven
          minutes away.
        </ScrollReveal>
        <div className="mt-14 flex items-center justify-center gap-4">
          <span className="h-px w-12 bg-line-strong" />
          <span className="tele text-ember-700">PREVENTION OVER RESPONSE</span>
          <span className="h-px w-12 bg-line-strong" />
        </div>
      </div>
    </section>
  )
}

/* ────────────────────────────── three organs ──────────────────────────── */

const ORGANS = [
  {
    no: '01',
    icon: Gauge,
    name: 'PRESSURE',
    sub: 'What is happening',
    body:
      'Every zone carries a single number from zero to one hundred, recomputed each minute from how full it is, how fast it is filling, and what the schedule is about to send its way.',
    detail: ['0.5 occupancy', '0.3 velocity', '0.2 scheduled flux'],
  },
  {
    no: '02',
    icon: Crosshair,
    name: 'FORESIGHT',
    sub: 'What is about to happen',
    body:
      'The score is projected two hours forward with the event calendar injected at the exact minute each crowd is released. The output is a time, not a vibe.',
    detail: ['120 min horizon', 'confidence band', 'per zone ETA'],
  },
  {
    no: '03',
    icon: Route,
    name: 'INTERVENTION',
    sub: 'What to do about it',
    body:
      'Crossing a threshold produces a ranked plan: which zones have headroom, how many people to move, which route absorbs them, and what the nudge costs per head.',
    detail: ['headroom', 'proximity', 'connectivity'],
  },
]

function Organs() {
  return (
    <section className="border-t border-line py-28 sm:py-36">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <SectionHead
          title="THREE ORGANS, ONE NERVOUS SYSTEM."
          lede="Nothing here is a black box. Each layer can be explained in a sentence and challenged on stage, which is exactly the point."
        />

        <div className="grid gap-px bg-line md:grid-cols-3">
          {ORGANS.map((o, i) => (
            <ReticleCard key={o.no} data-tour={["organ-pressure","organ-foresight","organ-intervention"][i]} className="border-0 p-9 sm:p-10">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.8, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="mb-9 flex items-start justify-between">
                  <o.icon className="h-6 w-6 text-ember-500" strokeWidth={1.4} />
                  <span className="num text-[0.68rem] tracking-[0.2em] text-ink/62">{o.no}</span>
                </div>

                <h3 className="display text-[1.7rem] text-ink">{o.name}</h3>
                <p className="mt-2 font-luxe text-[1.14rem] italic text-ember-700">{o.sub}</p>

                <p className="mt-6 text-[0.86rem] leading-relaxed text-ink/76">{o.body}</p>

                <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-6">
                  {o.detail.map((d) => (
                    <span key={d} className="tele text-ink/62">
                      {d}
                    </span>
                  ))}
                </div>
              </motion.div>
            </ReticleCard>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ────────────────────────── the prediction chain ──────────────────────── */

const CHAIN = [
  { k: 'OBSERVED', v: 'Z-01 Northgate Quarter at 67 percent' },
  { k: 'TREND', v: 'climbing 4.1 points across the last 15 minutes' },
  { k: 'SCHEDULE', v: 'Headline Fixture releases 15,200 into this zone at 21:20' },
  { k: 'PROJECTION', v: '94 percent by 23:04, confidence 0.86' },
  { k: 'VERDICT', v: 'saturation in 47 minutes' },
]

function Chain() {
  return (
    <section className="border-t border-line py-28 sm:py-36">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <SectionHead
              title="SHOW THE REASONING, NOT THE VERDICT."
              lede="A red zone tells an operator nothing they can act on. Every NEXUS alert carries the full chain that produced it, so the person on shift can agree with it, override it, or argue with it."
            />
            <p className="max-w-xl font-luxe text-[1.24rem] italic leading-relaxed text-ink/62">
              This is the difference between a model you trust at 2am and one you mute.
            </p>
          </div>

          <TiltCard max={4}>
            <ReticleCard data-tour="chain-panel" className="p-8 sm:p-10">
              <div className="mb-9 flex items-center justify-between border-b border-line pb-5">
                <span className="tele text-ember-700">PREDICTION CHAIN</span>
                <span className="num text-[0.62rem] tracking-[0.2em] text-ink/62">ALERT #4471</span>
              </div>

              <ol className="space-y-6">
                {CHAIN.map((c, i) => (
                  <motion.li
                    key={c.k}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.6, delay: i * 0.13 }}
                    className="flex gap-5"
                  >
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          'mt-1.5 h-2 w-2 shrink-0 rotate-45',
                          i === CHAIN.length - 1 ? 'bg-ember-500' : 'bg-line-strong',
                        )}
                      />
                      {i < CHAIN.length - 1 && <span className="mt-1 w-px flex-1 bg-line" />}
                    </div>
                    <div className="pb-1">
                      <div className="tele mb-1.5 text-ink/62">{c.k}</div>
                      <div
                        className={cn(
                          'font-luxe text-[1.2rem] leading-snug',
                          i === CHAIN.length - 1 ? 'text-ember-700' : 'text-ink/88',
                        )}
                      >
                        {i === CHAIN.length - 1 ? (
                          <DecryptedText text={c.v} className="num text-[0.92rem] font-bold tracking-wide" />
                        ) : (
                          c.v
                        )}
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ol>

              <div className="mt-9 flex items-center gap-3 border-t border-line pt-6">
                <ShieldAlert className="h-4 w-4 text-ember-500" strokeWidth={1.5} />
                <span className="tele text-ink/66">INTERVENTION WINDOW OPEN</span>
              </div>
            </ReticleCard>
          </TiltCard>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────── two interfaces ─────────────────────────── */

function Interfaces() {
  const faces = [
    {
      to: '/war-room',
      tag: 'FOR ORGANISERS AND CITY OPS',
      title: 'THE WAR ROOM',
      body:
        'A dense, deliberately unfriendly console. Live pressure plate, saturation countdowns, transit load, and a dispatch queue that puts an intervention into the field in one action.',
      points: ['live pressure plate', 'saturation countdown', 'dispatch queue'],
      cta: 'ENTER CONSOLE',
    },
    {
      to: '/guide',
      tag: 'FOR VISITORS',
      title: 'THE SMART GUIDE',
      body:
        'One question on screen: where should you go right now. Every answer shows its reason, because a recommendation people understand is a recommendation people follow.',
      points: ['live rerouting', 'reason first', 'off peak credit'],
      cta: 'OPEN GUIDE',
    },
  ]

  return (
    <section className="border-t border-line py-28 sm:py-36">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <SectionHead
          title="ONE SPINE. TWO VERY DIFFERENT ROOMS."
          lede="The operator and the visitor need opposite things from the same numbers. One needs density and control. The other needs a single clear instruction."
        />

        <div className="grid gap-px bg-line lg:grid-cols-2">
          {faces.map((f, i) => (
            <Link key={f.to} to={f.to} className="group block">
              <ReticleCard className="h-full border-0 p-9 sm:p-12">
                <motion.div
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.85, delay: i * 0.14, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="tele mb-8 text-ember-700">{f.tag}</div>
                  <h3 className="display text-[clamp(1.9rem,3.6vw,2.9rem)] text-ink">{f.title}</h3>
                  <p className="mt-6 max-w-lg text-[0.87rem] leading-relaxed text-ink/76">{f.body}</p>

                  <div className="mt-9 flex flex-wrap gap-2">
                    {f.points.map((p) => (
                      <span
                        key={p}
                        className="tele border border-line px-3 py-1.5 text-ink/66 transition-colors group-hover:border-ember-400 group-hover:text-ink/84"
                      >
                        {p}
                      </span>
                    ))}
                  </div>

                  <div className="mt-11 inline-flex items-center gap-3 text-ember-700">
                    <span className="tele font-bold">{f.cta}</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1.5" />
                  </div>
                </motion.div>
              </ReticleCard>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────────── scenario timeline ───────────────────────── */

function Timeline() {
  return (
    <section className="border-t border-line py-28 sm:py-36">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <SectionHead
          title="MATCHDAY 11. FORTY THOUSAND LEAVE AT ONCE."
          lede="The scripted scenario the console is built around. Every beat below is reproducible in the War Room."
        />

        <div className="relative">
          <div className="absolute left-0 right-0 top-[46px] hidden h-px bg-line lg:block" />
          <div className="grid gap-10 lg:grid-cols-6 lg:gap-4">
            {SCENARIO_MARKS.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.7, delay: i * 0.09 }}
                className="relative"
              >
                <div className="num mb-4 text-[0.66rem] tracking-[0.2em] text-ember-700">
                  T+{m.clock}
                </div>
                <div className="relative mb-6 h-3">
                  <span
                    className={cn(
                      'absolute left-0 top-0 h-3 w-3 rotate-45 border',
                      i === 3 || i === 4
                        ? 'border-ember-500 bg-ember-500'
                        : 'border-line-strong bg-paper',
                    )}
                  />
                </div>
                <h4 className={cn('display text-[1.02rem]', i === 4 ? 'text-ember-700' : 'text-ink')}>
                  {m.label}
                </h4>
                <p className="mt-3 text-[0.82rem] leading-relaxed text-ink/66">{m.note}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-20 grid gap-px bg-line sm:grid-cols-3">
          {[
            { k: 'PEAK AVERTED', v: 94, suffix: '%', sub: 'projected Z-01 saturation' },
            { k: 'VISITORS REROUTED', v: 8100, suffix: '', sub: 'across three relief zones' },
            { k: 'WARNING LEAD TIME', v: 47, suffix: ' MIN', sub: 'before the wall was hit' },
          ].map((s) => (
            <div key={s.k} className="bg-surface px-8 py-10">
              <div className="tele mb-4 text-ink/62">{s.k}</div>
              <div className="display text-[2.5rem] text-ember-700">
                <CountUp to={s.v} suffix={s.suffix} />
              </div>
              <div className="mt-2 font-luxe text-[1.12rem] italic text-ink/62">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────── closer ─────────────────────────────── */

function Closer() {
  return (
    <section className="relative overflow-hidden border-t border-line py-36">
      <Aurora intensity={0.55} />
      <div className="relative mx-auto max-w-4xl px-5 text-center sm:px-8">
        <h2>
          <MaskText
            text="THE CITY IS ALREADY TALKING."
            className="display block text-[clamp(2rem,5.4vw,4.2rem)] text-ink"
          />
        </h2>
        <p className="mx-auto mt-8 max-w-xl font-luxe text-[1.4rem] italic leading-relaxed text-ink/76">
          NEXUS is simply the first thing in the room that listens to all of it at once.
        </p>
        <div className="mt-12 flex justify-center">
          <Magnet>
            <Link
              to="/war-room"
              className="inline-flex items-center gap-3 bg-ember-700 px-8 py-4 text-paper transition-colors hover:bg-ember-900"
            >
              <Radio className="h-4 w-4" strokeWidth={2} />
              <span className="tele font-bold">GO LIVE</span>
            </Link>
          </Magnet>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-5 py-10 sm:flex-row sm:items-center sm:px-8">
        <div className="tele text-ink/62">
          NEXUS · INTELLIGENT EVENT ORCHESTRATION · PROTOTYPE BUILD
        </div>
        <div className="tele text-ink/62 sm:ml-auto">
          {EVENTS.length} FIXTURES · {ZONES.length} ZONES · DEMO DATA
        </div>
      </div>
    </footer>
  )
}

export default function Overture() {
  return (
    <div className="font-tele">
      <Hero />
      <StatBar />
      <Manifesto />
      <Organs />
      <Chain />
      <Interfaces />
      <Timeline />
      <Closer />
      <Footer />
    </div>
  )
}
