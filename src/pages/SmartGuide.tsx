import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import {
  ArrowRight,
  BedDouble,
  Clock,
  MapPin,
  Navigation,
  Signal,
  Sparkles,
  TrainFront,
  Wifi,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Mark } from '@/components/Nav'
import { CountUp, MaskText } from '@/components/bits/Text'
import { useSim } from '@/hooks/SimProvider'
import { ZONE_BY_ID, wallClock } from '@/data/city'
import { BANDS } from '@/data/types'
import type { GuideRecommendation } from '@/data/types'
import { cn, inr } from '@/lib/utils'

const SHELL = 'mx-auto w-full max-w-[1440px] px-6 sm:px-10'

/* ──────────────────────────── phone internals ─────────────────────────── */

function StatusBar({ time }: { time: string }) {
  return (
    <div className="flex items-center justify-between px-6 pb-2 pt-4">
      <span className="num text-[0.72rem] font-bold text-ink/80">{time}</span>
      <div className="flex items-center gap-1.5 text-ink/55">
        <Signal className="h-3 w-3" strokeWidth={2.4} />
        <Wifi className="h-3 w-3" strokeWidth={2.4} />
        <span className="ml-0.5 h-2.5 w-5 rounded-[2px] border border-ink/40 p-[1.5px]">
          <span className="block h-full w-2/3 bg-ember-500" />
        </span>
      </div>
    </div>
  )
}

/** The single recommendation shown inside the device. */
function PhonePick({ rec }: { rec: GuideRecommendation }) {
  const load = rec.pressure.occupancy / rec.pressure.capacity
  return (
    <article className="border border-line bg-paper p-5">
      <div className="tele mb-3 text-ember-500">BEST MOVE RIGHT NOW</div>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="display text-[1.35rem] text-ink">{rec.zone.name}</h3>
          <div className="num mt-1.5 text-[0.66rem] tracking-[0.16em] text-ink/40">
            {rec.zone.code} · {rec.zone.sector}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="display text-[1.5rem] leading-none text-ember-700">{inr(rec.rateInr)}</div>
          <div className="tele mt-1.5 text-ink/40">PER NIGHT</div>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="tele text-ink/45">CURRENT CROWDING</span>
          <span className="num text-[0.72rem] font-bold" style={{ color: BANDS[rec.pressure.band].color }}>
            {(load * 100).toFixed(0)}%
          </span>
        </div>
        <div className="h-2 bg-line">
          <motion.div
            className="h-full"
            style={{ background: BANDS[rec.pressure.band].color }}
            animate={{ width: Math.min(load * 100, 100) + '%' }}
            transition={{ duration: 0.6 }}
          />
        </div>
      </div>

      <p className="mt-5 border-l-2 border-ember-500 pl-4 text-[0.78rem] leading-relaxed text-ink/62">
        {rec.reason}
      </p>

      <div className="mt-5 grid grid-cols-3 gap-4 border-t border-line pt-4">
        <div>
          <Clock className="mb-2 h-3.5 w-3.5 text-ink/35" strokeWidth={1.8} />
          <div className="num text-[0.88rem] font-bold text-ink">{rec.travelMinutes}m</div>
          <div className="tele mt-0.5 text-ink/35">TRAVEL</div>
        </div>
        <div>
          <BedDouble className="mb-2 h-3.5 w-3.5 text-ink/35" strokeWidth={1.8} />
          <div className="num text-[0.88rem] font-bold text-ember-700">{rec.savingsPct}%</div>
          <div className="tele mt-0.5 text-ink/35">OFF PEAK</div>
        </div>
        <div>
          <TrainFront className="mb-2 h-3.5 w-3.5 text-ink/35" strokeWidth={1.8} />
          <div className="num text-[0.88rem] font-bold text-ink">
            {(rec.zone.transportConnectivity * 10).toFixed(1)}
          </div>
          <div className="tele mt-0.5 text-ink/35">TRANSIT</div>
        </div>
      </div>

      {rec.incentiveInr > 0 && (
        <div className="mt-5 flex items-start gap-3 border border-ember-500/45 bg-raised px-4 py-3.5">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-ember-500" strokeWidth={1.8} />
          <p className="text-[0.76rem] leading-relaxed text-ink/70">
            <span className="font-bold text-ember-700">{inr(rec.incentiveInr)} back</span> if you check
            in after 22:00. Travelling off peak keeps the interchange clear for everyone.
          </p>
        </div>
      )}

      <button
        type="button"
        className="mt-5 flex w-full items-center justify-center gap-3 bg-ember-500 py-3.5 text-paper transition-colors hover:bg-ember-700"
      >
        <Navigation className="h-3.5 w-3.5" strokeWidth={2.2} />
        <span className="tele font-bold">TAKE ME THERE</span>
      </button>
    </article>
  )
}

/* ─────────────────────── full width option cards ──────────────────────── */

function OptionCard({ rec, rank }: { rec: GuideRecommendation; rank: number }) {
  const load = rec.pressure.occupancy / rec.pressure.capacity
  return (
    <motion.article
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.75, delay: rank * 0.08, ease: [0.22, 1, 0.28, 1] }}
      className="panel flex flex-col p-7"
    >
      <div className="mb-5 flex items-center justify-between">
        <span className="tele text-ink/40">{rank === 0 ? 'TOP PICK' : 'OPTION ' + (rank + 1)}</span>
        <span
          className="tele border px-2 py-1"
          style={{
            color: BANDS[rec.pressure.band].color,
            borderColor: BANDS[rec.pressure.band].color + '55',
          }}
        >
          {(load * 100).toFixed(0)}% FULL
        </span>
      </div>

      <h3 className="display text-[1.5rem] text-ink">{rec.zone.name}</h3>
      <div className="num mt-2 text-[0.66rem] tracking-[0.16em] text-ink/40">
        {rec.zone.code} · {rec.zone.sector}
      </div>

      <div className="mt-6 flex items-baseline gap-3">
        <span className="display text-[2rem] leading-none text-ember-700">{inr(rec.rateInr)}</span>
        <span className="tele text-ink/40">PER NIGHT</span>
      </div>

      <div className="mt-5 h-2 bg-line">
        <motion.div
          className="h-full"
          style={{ background: BANDS[rec.pressure.band].color }}
          animate={{ width: Math.min(load * 100, 100) + '%' }}
          transition={{ duration: 0.6 }}
        />
      </div>

      <p className="mt-6 flex-1 text-[0.8rem] leading-relaxed text-ink/58">{rec.reason}</p>

      <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
        <span className="tele border border-line px-2.5 py-1.5 text-ink/50">
          {rec.travelMinutes} MIN AWAY
        </span>
        {rec.savingsPct >= 5 && (
          <span className="tele border border-line px-2.5 py-1.5 text-ink/50">
            {rec.savingsPct}% OFF PEAK
          </span>
        )}
        {rec.incentiveInr > 0 && (
          <span className="tele border border-ember-500/45 px-2.5 py-1.5 text-ember-700">
            {inr(rec.incentiveInr)} CREDIT
          </span>
        )}
      </div>
    </motion.article>
  )
}

/* ──────────────────────────────── page ───────────────────────────────── */

export default function SmartGuide() {
  const sim = useSim()
  const recs = sim.recommendations
  const [expanded, setExpanded] = useState(false)

  // the visitor is standing in whatever zone is currently worst
  const here = useMemo(
    () => [...sim.snapshot.pressures].sort((a, b) => b.score - a.score)[0],
    [sim.snapshot],
  )
  const hereZone = ZONE_BY_ID[here.zoneId]
  const hereLoad = here.occupancy / here.capacity
  const top = recs[0]
  const topLoad = top ? top.pressure.occupancy / top.pressure.capacity : 0

  const liveNudge = sim.dispatched[0]

  const chain = [
    {
      k: 'THE ENGINE OBSERVES',
      v: hereZone.name + ' is at ' + (hereLoad * 100).toFixed(0) + ' percent and still climbing.',
    },
    {
      k: 'IT FINDS HEADROOM',
      v: top
        ? top.zone.name + ' is sitting at ' + (topLoad * 100).toFixed(0) + ' percent, ' +
          top.travelMinutes + ' minutes away.'
        : 'No relief zone currently clears the threshold.',
    },
    {
      k: 'PRICE FOLLOWS DEMAND',
      v: top
        ? 'The rate there falls to ' + inr(top.rateInr) + ', ' + top.savingsPct + ' percent under the peak.'
        : 'Rates hold at the peak while every zone stays loaded.',
    },
    {
      k: 'THE VISITOR DECIDES',
      v: 'One sentence, with the number that produced it attached. No instruction, no lecture.',
    },
  ]

  return (
    <div className="min-h-screen bg-paper pt-14 font-tele">
      {/* ───────── the device beside the argument ───────── */}
      <section
        className={cn(
          SHELL,
          'grid gap-14 py-14 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-20 lg:py-20',
        )}
      >
        <div className="mx-auto w-full max-w-[420px]">
          <div className="overflow-hidden rounded-[2.25rem] border border-line bg-surface shadow-[0_30px_90px_-40px_rgba(74,13,2,0.35)]">
            <StatusBar time={wallClock(sim.rounded)} />

            <header className="flex items-center justify-between border-b border-line px-6 pb-4 pt-2">
              <Mark />
              <span className="tele text-ink/40">SMART GUIDE</span>
            </header>

            <div className="max-h-[70vh] overflow-y-auto px-6 pb-8 pt-6">
              <AnimatePresence>
                {liveNudge && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mb-6 bg-ember-700 p-5 text-paper">
                      <div className="mb-2.5 flex items-center gap-2">
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-paper"
                          style={{ animation: 'nexus-blink 1s steps(1,end) infinite' }}
                        />
                        <span className="tele font-bold">LIVE ADVISORY</span>
                        <span className="num ml-auto text-[0.62rem] font-bold">
                          {wallClock(liveNudge.createdAt)}
                        </span>
                      </div>
                      <p className="text-[0.8rem] leading-relaxed">{liveNudge.attendeeMessage}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mb-7 flex items-start gap-3.5 border border-line bg-paper p-5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ember-500" strokeWidth={1.8} />
                <div className="min-w-0">
                  <div className="tele mb-1.5 text-ink/40">YOU ARE HERE</div>
                  <div className="num text-[0.92rem] font-bold text-ink">{hereZone.name}</div>
                  <p className="mt-2 text-[0.76rem] leading-relaxed text-ink/50">
                    Running at{' '}
                    <span className="font-bold" style={{ color: BANDS[here.band].color }}>
                      {(hereLoad * 100).toFixed(0)}% capacity
                    </span>
                    . Rooms are priced at the peak and the interchange is backing up.
                  </p>
                </div>
              </div>

              <h1 className="display mb-3 text-[1.5rem] text-ink">WHERE SHOULD YOU GO RIGHT NOW?</h1>
              <p className="mb-7 font-luxe text-[0.98rem] italic leading-snug text-ink/50">
                Ranked by what the city can actually absorb tonight.
              </p>

              {top && <PhonePick rec={top} />}

              {recs.length > 1 && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="tele mt-5 w-full border border-line py-3 text-ink/50 transition-colors hover:border-ember-500 hover:text-ink"
                >
                  {expanded ? 'SHOW FEWER' : 'SHOW ' + (recs.length - 1) + ' MORE OPTIONS'}
                </button>
              )}

              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-5 space-y-3">
                      {recs.slice(1).map((r) => (
                        <div
                          key={r.zone.id}
                          className="flex items-center justify-between gap-3 border border-line bg-paper px-4 py-3.5"
                        >
                          <div className="min-w-0">
                            <div className="num truncate text-[0.8rem] font-bold text-ink">
                              {r.zone.name}
                            </div>
                            <div className="tele mt-1 text-ink/40">
                              {r.travelMinutes} MIN ·{' '}
                              {((r.pressure.occupancy / r.pressure.capacity) * 100).toFixed(0)}% FULL
                            </div>
                          </div>
                          <span className="num shrink-0 text-[0.86rem] font-bold text-ember-700">
                            {inr(r.rateInr)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="mt-8 border-t border-line pt-6 text-[0.74rem] leading-relaxed text-ink/40">
                Prices move with real demand, not with what you searched for. When a district
                empties out, its rate drops and NEXUS shows you why.
              </p>
            </div>

            <nav className="grid grid-cols-3 border-t border-line">
              {[
                { icon: Navigation, label: 'GUIDE', active: true },
                { icon: BedDouble, label: 'STAY', active: false },
                { icon: TrainFront, label: 'TRAVEL', active: false },
              ].map((t) => (
                <button
                  key={t.label}
                  type="button"
                  className={cn(
                    'flex flex-col items-center gap-2 py-4 transition-colors',
                    t.active ? 'text-ember-700' : 'text-ink/35 hover:text-ink/60',
                  )}
                >
                  <t.icon className="h-4 w-4" strokeWidth={1.8} />
                  <span className="tele">{t.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <motion.span
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.28, 1] }}
            className="mb-8 block h-px w-14 origin-left bg-ember-500"
          />

          <MaskText
            as="h2"
            text="A RECOMMENDATION NOBODY ARGUES WITH."
            className="display text-balance text-[clamp(2rem,4.6vw,3.6rem)] text-ink"
          />

          <p className="mt-8 max-w-xl text-pretty font-luxe text-[1.22rem] leading-relaxed text-ink/62">
            Crowd control fails the moment people feel pushed. So the Smart Guide never hides
            its reasoning.
          </p>

          <p className="mt-6 max-w-lg text-pretty text-[1.05rem] leading-relaxed text-ink/50">
            Every card leads with the number that produced it. A cheaper room is not a
            downgrade, it is a district running at twenty seven percent. Say that plainly and
            an instruction becomes an obvious choice.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-px bg-line">
            {[
              { k: 'ACCEPTANCE', v: 71, suffix: '%' },
              { k: 'AVG SAVING', v: 2400, prefix: '₹' },
              { k: 'RESPONSE', v: 4, suffix: ' MIN' },
            ].map((s) => (
              <div key={s.k} className="bg-paper px-5 py-6">
                <div className="tele mb-3 text-ink/40">{s.k}</div>
                <div className="display text-[1.75rem] text-ember-700">
                  <CountUp to={s.v} prefix={s.prefix} suffix={s.suffix} />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-7 font-luxe text-[0.98rem] italic leading-relaxed text-ink/42">
            Figures are from the demo scenario, not a live deployment.
          </p>
        </div>
      </section>

      {/* ───────── how a number becomes a sentence ───────── */}
      <section className="border-y border-line bg-surface">
        <div className={cn(SHELL, 'py-20')}>
          <MaskText
            as="h2"
            text="HOW A NUMBER BECOMES A SENTENCE."
            className="display mb-14 text-balance text-[clamp(1.8rem,4vw,3rem)] text-ink"
          />

          <div className="grid gap-px bg-line md:grid-cols-2 xl:grid-cols-4">
            {chain.map((c, i) => (
              <motion.div
                key={c.k}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.75, delay: i * 0.1, ease: [0.22, 1, 0.28, 1] }}
                className="flex flex-col bg-surface p-8"
              >
                <span className="num mb-6 text-[0.7rem] tracking-[0.2em] text-ember-500">0{i + 1}</span>
                <div className="tele mb-4 text-ink/40">{c.k}</div>
                <p className="text-[0.92rem] leading-relaxed text-ink/70">{c.v}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── every option, with room ───────── */}
      <section className={cn(SHELL, 'py-20')}>
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <MaskText
            as="h2"
            text="TONIGHT'S OPTIONS IN FULL."
            className="display text-[clamp(1.8rem,4vw,3rem)] text-ink"
          />
          <span className="tele text-ink/40">LIVE AT {wallClock(sim.rounded)}</span>
        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          {recs.map((r, i) => (
            <OptionCard key={r.zone.id} rec={r} rank={i} />
          ))}
        </div>

        <div className="mt-14 flex flex-wrap items-center gap-6 border-t border-line pt-10">
          <p className="max-w-xl font-luxe text-[1.08rem] italic leading-relaxed text-ink/50">
            Every rate on this page is the pressure engine talking. Nothing here is a
            promotion.
          </p>
          <Link
            to="/war-room"
            className="group ml-auto inline-flex items-center gap-3 border border-line px-7 py-3.5 text-ink/70 transition-colors hover:border-ember-500 hover:text-ink"
          >
            <span className="tele">SEE THE OTHER SIDE</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </div>
  )
}
