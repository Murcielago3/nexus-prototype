import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import {
  ArrowRight,
  BedDouble,
  Clock,
  IndianRupee,
  MapPin,
  Navigation,
  Signal,
  Sparkles,
  TrainFront,
  Wifi,
} from 'lucide-react'
import { Mark } from '@/components/Nav'
import { Aurora } from '@/components/bits/Surfaces'
import { CountUp } from '@/components/bits/Text'
import { useSim } from '@/hooks/SimProvider'
import { ZONE_BY_ID, wallClock } from '@/data/city'
import { BANDS } from '@/data/types'
import type { GuideRecommendation } from '@/data/types'
import { cn, inr } from '@/lib/utils'

/* ──────────────────────────── phone chrome ───────────────────────────── */

function StatusBar({ time }: { time: string }) {
  return (
    <div className="flex items-center justify-between px-6 pb-1 pt-3">
      <span className="num text-[0.7rem] font-bold text-ink/85">{time}</span>
      <div className="flex items-center gap-1.5 text-ink/70">
        <Signal className="h-3 w-3" strokeWidth={2.4} />
        <Wifi className="h-3 w-3" strokeWidth={2.4} />
        <span className="ml-0.5 h-2.5 w-5 rounded-[2px] border border-ink/40 p-[1.5px]">
          <span className="block h-full w-2/3 bg-ember-400" />
        </span>
      </div>
    </div>
  )
}

/* ───────────────────────── recommendation card ───────────────────────── */

function PrimaryCard({ rec, rank }: { rec: GuideRecommendation; rank: number }) {
  const load = rec.pressure.occupancy / rec.pressure.capacity
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: rank * 0.07, ease: [0.16, 1, 0.3, 1] }}
      className="panel relative overflow-hidden p-5"
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl"
        style={{ background: BANDS[rec.pressure.band].color, opacity: 0.14 }}
      />

      <div className="relative">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="tele mb-1.5 text-ember-500">
              {rank === 0 ? 'BEST MOVE RIGHT NOW' : 'ALTERNATIVE ' + String(rank)}
            </div>
            <h3 className="display text-[1.4rem] leading-tight text-ink">{rec.zone.name}</h3>
            <div className="num mt-1 text-[0.62rem] tracking-[0.16em] text-ink/42">
              {rec.zone.code} · {rec.zone.sector}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="display text-[1.6rem] leading-none text-ember-700">{inr(rec.rateInr)}</div>
            <div className="tele mt-1 text-ink/42">PER NIGHT</div>
          </div>
        </div>

        {/* capacity read out, this is the honest bit */}
        <div className="mb-4 mt-4">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="tele text-ink/45">CURRENT CROWDING</span>
            <span className="num text-[0.68rem] font-bold" style={{ color: BANDS[rec.pressure.band].color }}>
              {(load * 100).toFixed(0)}%
            </span>
          </div>
          <div className="h-1.5 bg-line">
            <motion.div
              className="h-full"
              style={{ background: BANDS[rec.pressure.band].color }}
              animate={{ width: Math.min(load * 100, 100) + '%' }}
              transition={{ duration: 0.6 }}
            />
          </div>
        </div>

        <p className="mb-4 border-l-2 border-ember-700 pl-3 text-[0.8rem] leading-relaxed text-ink/58">
          {rec.reason}
        </p>

        <div className="mb-4 grid grid-cols-3 gap-3 border-y border-line py-3">
          <div>
            <Clock className="mb-1.5 h-3.5 w-3.5 text-ink/45" strokeWidth={1.8} />
            <div className="num text-[0.85rem] font-bold text-ink">{rec.travelMinutes} min</div>
            <div className="tele text-ink/38">TRAVEL</div>
          </div>
          <div>
            <IndianRupee className="mb-1.5 h-3.5 w-3.5 text-ink/45" strokeWidth={1.8} />
            <div className="num text-[0.85rem] font-bold text-ember-700">{rec.savingsPct}%</div>
            <div className="tele text-ink/38">BELOW PEAK</div>
          </div>
          <div>
            <TrainFront className="mb-1.5 h-3.5 w-3.5 text-ink/45" strokeWidth={1.8} />
            <div className="num text-[0.85rem] font-bold text-ink">
              {(rec.zone.transportConnectivity * 10).toFixed(1)}
            </div>
            <div className="tele text-ink/38">TRANSIT</div>
          </div>
        </div>

        {rec.incentiveInr > 0 && (
          <div className="mb-4 flex items-center gap-2.5 border border-ember-500/40 bg-raised px-3 py-2.5">
            <Sparkles className="h-4 w-4 shrink-0 text-ember-700" strokeWidth={1.8} />
            <p className="text-[0.75rem] leading-snug text-ink/70">
              <span className="font-bold text-ember-700">{inr(rec.incentiveInr)} back</span> if you check
              in after 22:00. Travelling off peak keeps the interchange clear for everyone.
            </p>
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-1.5">
          {rec.tags.map((t) => (
            <span key={t} className="tele border border-line px-2 py-1 text-ink/45">
              {t}
            </span>
          ))}
        </div>

        <button
          type="button"
          className={cn(
            'group flex w-full items-center justify-center gap-2.5 border py-3 transition-colors',
            rank === 0
              ? 'border-ember-500 bg-ember-500 text-paper hover:bg-ember-400'
              : 'border-line text-ink/70 hover:border-ember-500 hover:text-ink',
          )}
        >
          <Navigation className="h-3.5 w-3.5" strokeWidth={2.2} />
          <span className="tele font-bold">{rank === 0 ? 'TAKE ME THERE' : 'SEE ROUTE'}</span>
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </motion.article>
  )
}

/* ──────────────────────────────── page ───────────────────────────────── */

export default function SmartGuide() {
  const sim = useSim()
  const [showAll, setShowAll] = useState(false)

  // the visitor is standing in whatever zone is currently worst
  const here = useMemo(
    () => [...sim.snapshot.pressures].sort((a, b) => b.score - a.score)[0],
    [sim.snapshot],
  )
  const hereZone = ZONE_BY_ID[here.zoneId]
  const hereLoad = here.occupancy / here.capacity

  const recs = sim.recommendations
  const visible = showAll ? recs : recs.slice(0, 2)

  const liveNudge = sim.dispatched[0]

  return (
    <div className="relative min-h-screen overflow-hidden bg-paper pt-14 font-tele">
      <Aurora intensity={0.4} />

      <div className="relative mx-auto grid max-w-[1500px] gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:gap-16 lg:py-16">
        {/* ── the phone ── */}
        <div className="mx-auto w-full max-w-[400px]">
          <div className="relative overflow-hidden rounded-[2rem] border border-line bg-surface shadow-[0_30px_80px_-32px_rgba(74,13,2,0.28)]">
            <StatusBar time={wallClock(sim.rounded)} />

            <header className="flex items-center justify-between border-b border-line px-5 pb-3 pt-2">
              <Mark />
              <span className="tele text-ink/40">SMART GUIDE</span>
            </header>

            <div className="max-h-[74vh] overflow-y-auto px-5 pb-8 pt-5">
              {/* live nudge from the war room */}
              <AnimatePresence>
                {liveNudge && (
                  <motion.div
                    initial={{ opacity: 0, y: -14, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-5 overflow-hidden"
                  >
                    <div className="border border-ember-700 bg-ember-700 p-4 text-paper">
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-paper"
                          style={{ animation: 'nexus-blink 1s steps(1,end) infinite' }}
                        />
                        <span className="tele font-bold">LIVE ADVISORY</span>
                        <span className="num ml-auto text-[0.6rem] font-bold">
                          {wallClock(liveNudge.createdAt)}
                        </span>
                      </div>
                      <p className="text-[0.8rem] font-medium leading-snug">
                        {liveNudge.attendeeMessage}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* you are here */}
              <div className="mb-6 flex items-start gap-3 border border-line bg-surface p-4">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ember-500" strokeWidth={1.8} />
                <div className="min-w-0">
                  <div className="tele mb-1 text-ink/40">YOU ARE HERE</div>
                  <div className="text-[0.92rem] font-medium text-ink">{hereZone.name}</div>
                  <p className="mt-1.5 text-[0.75rem] leading-snug text-ink/48">
                    Running at{' '}
                    <span className="font-bold" style={{ color: BANDS[here.band].color }}>
                      {(hereLoad * 100).toFixed(0)}% capacity
                    </span>
                    . Rooms here are priced at the peak and the interchange is backing up.
                  </p>
                </div>
              </div>

              <h1 className="display mb-1 text-[1.55rem] leading-[1.05] text-ink">
                WHERE SHOULD YOU GO RIGHT NOW?
              </h1>
              <p className="mb-6 font-luxe text-[1.18rem] italic text-ink/48">
                Three options, ranked by what the city can actually absorb tonight.
              </p>

              <div className="space-y-4">
                {visible.map((r, i) => (
                  <PrimaryCard key={r.zone.id} rec={r} rank={i} />
                ))}
              </div>

              {recs.length > 2 && (
                <button
                  type="button"
                  onClick={() => setShowAll((v) => !v)}
                  className="tele mt-5 w-full border border-line py-2.5 text-ink/48 transition-colors hover:border-ember-500 hover:text-ink/80"
                >
                  {showAll ? 'SHOW FEWER' : 'SHOW ' + (recs.length - 2) + ' MORE OPTIONS'}
                </button>
              )}

              <p className="mt-7 border-t border-line pt-5 text-[0.72rem] leading-relaxed text-ink/40">
                Prices move with real demand, not with what you searched for. When a district
                empties out, its rate drops and NEXUS shows you why.
              </p>
            </div>

            {/* tab bar */}
            <nav className="grid grid-cols-3 border-t border-line bg-paper">
              {[
                { icon: Navigation, label: 'GUIDE', active: true },
                { icon: BedDouble, label: 'STAY', active: false },
                { icon: TrainFront, label: 'TRAVEL', active: false },
              ].map((t) => (
                <button
                  key={t.label}
                  type="button"
                  className={cn(
                    'flex flex-col items-center gap-1.5 py-3 transition-colors',
                    t.active ? 'text-ember-700' : 'text-ink/38 hover:text-ink/55',
                  )}
                >
                  <t.icon className="h-4 w-4" strokeWidth={1.8} />
                  <span className="tele">{t.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* ── the explainer beside it ── */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-ember-500/70" />
            <span className="tele text-ember-500">The visitor side</span>
          </div>

          <h2 className="display mt-6 text-[clamp(2rem,4.4vw,3.4rem)] leading-[0.92] text-ink">
            A RECOMMENDATION
            <br />
            NOBODY
            <br />
            <span className="text-ember-500">ARGUES WITH.</span>
          </h2>

          <p className="mt-7 max-w-lg text-pretty font-luxe text-[1.32rem] leading-relaxed text-ink/62">
            Crowd control fails when people feel pushed. So the Smart Guide never hides its
            reasoning. Every card leads with the number that produced it, which turns an
            instruction into an obvious choice.
          </p>

          <div className="mt-10 grid gap-px bg-line sm:grid-cols-2">
            {[
              {
                k: 'WHAT THE ENGINE KNOWS',
                v: hereZone.code + ' will cross 95 percent within the hour, and ' +
                  (recs[0]?.zone.code ?? 'the relief zone') + ' is sitting under 30.',
              },
              {
                k: 'WHAT THE VISITOR SEES',
                v: 'A cheaper room, a shorter queue, and a credit for arriving late. Same decision, no lecture.',
              },
            ].map((c) => (
              <div key={c.k} className="bg-paper p-6">
                <div className="tele mb-3 text-ink/45">{c.k}</div>
                <p className="text-[0.82rem] leading-relaxed text-ink/62">{c.v}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-3 gap-px bg-line">
            {[
              { k: 'ACCEPTANCE', v: 71, suffix: '%' },
              { k: 'AVG SAVING', v: 2400, prefix: '₹' },
              { k: 'RESPONSE', v: 4, suffix: ' MIN' },
            ].map((s) => (
              <div key={s.k} className="bg-paper px-5 py-6">
                <div className="tele mb-2.5 text-ink/45">{s.k}</div>
                <div className="display text-[1.7rem] text-ember-700">
                  <CountUp to={s.v} prefix={s.prefix} suffix={s.suffix} />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 font-luxe text-[1.24rem] italic leading-relaxed text-ink/42">
            Figures shown are from the demo scenario, not a live deployment.
          </p>
        </div>
      </div>
    </div>
  )
}
