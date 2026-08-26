import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import {
  Check,
  Gauge,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Send,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import { CityPlate } from '@/components/warroom/CityPlate'
import { ForecastChart } from '@/components/warroom/ForecastChart'
import { useSim } from '@/hooks/SimProvider'
import { SPEEDS } from '@/hooks/useSimClock'
import { EVENTS, HOST_CITY, ZONE_BY_ID, wallClock } from '@/data/city'
import { getForecast, SCENARIO_MARKS } from '@/data/mock'
import { BANDS } from '@/data/types'
import type { Intervention, ZonePressure } from '@/data/types'
import { cn, compact, inr } from '@/lib/utils'

/* ───────────────────────────── small parts ───────────────────────────── */

function Panel({
  title,
  right,
  children,
  className,
  bodyClass,
}: {
  title: string
  right?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClass?: string
}) {
  return (
    <section className={cn('panel flex min-h-0 flex-col', className)}>
      <header className="flex shrink-0 items-center justify-between border-b border-line px-4 py-2.5">
        <h2 className="tele text-ember-500">{title}</h2>
        {right}
      </header>
      <div className={cn('min-h-0 flex-1', bodyClass)}>{children}</div>
    </section>
  )
}

function Stat({
  label,
  value,
  sub,
  icon: Icon,
  tone = 'default',
}: {
  label: string
  value: string
  sub?: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  tone?: 'default' | 'hot'
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <Icon
        className={cn('h-4 w-4 shrink-0', tone === 'hot' ? 'text-ember-500' : 'text-ink/45')}
        strokeWidth={1.6}
      />
      <div className="min-w-0">
        <div className="tele text-ink/40">{label}</div>
        <div className={cn('num text-[0.95rem] font-bold leading-tight', tone === 'hot' ? 'text-ember-700' : 'text-ink')}>
          {value}
          {sub && <span className="ml-1.5 text-[0.62rem] font-normal text-ink/42">{sub}</span>}
        </div>
      </div>
    </div>
  )
}

function BandChip({ band, score }: { band: keyof typeof BANDS; score?: number }) {
  const meta = BANDS[band]
  return (
    <span
      className="tele inline-flex items-center gap-1.5 border px-1.5 py-0.5"
      style={{ color: meta.color, borderColor: meta.color + '55' }}
    >
      {(band === 'warning' || band === 'critical') && (
        <span
          className="h-1 w-1 rounded-full"
          style={{ background: meta.color, animation: 'nexus-blink 1s steps(1,end) infinite' }}
        />
      )}
      {score === undefined ? meta.label : score.toFixed(0)}
    </span>
  )
}

/* ─────────────────────────── pressure ranking ────────────────────────── */

function PressureRow({
  p,
  selected,
  onSelect,
}: {
  p: ZonePressure
  selected: boolean
  onSelect: () => void
}) {
  const zone = ZONE_BY_ID[p.zoneId]
  const meta = BANDS[p.band]
  const fill = Math.min(p.score, 100)
  const delta = Math.round(p.rateOfChange15m * 10) / 10
  const rising = delta >= 0.5
  const falling = delta <= -0.5

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group relative w-full border-b border-line px-4 py-2.5 text-left transition-colors',
        selected ? 'bg-raised' : 'hover:bg-raised',
      )}
    >
      {selected && <span className="absolute inset-y-0 left-0 w-0.5 bg-ember-500" />}
      <div className="flex items-baseline justify-between gap-2">
        <span className="num text-[0.68rem] tracking-[0.14em] text-ink/48">{zone.code}</span>
        <span className="num text-[0.62rem] tabular-nums text-ink/38">
          {compact(p.occupancy)}/{compact(p.capacity)}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="truncate text-[0.78rem] font-medium tracking-wide text-ink/85">
          {zone.name}
        </span>
        <span className="num shrink-0 text-[0.9rem] font-bold" style={{ color: meta.color }}>
          {p.score.toFixed(0)}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="relative h-1 flex-1 bg-line">
          <motion.div
            className="absolute inset-y-0 left-0"
            style={{ background: meta.color }}
            animate={{ width: fill + '%' }}
            transition={{ duration: 0.5 }}
          />
          {[70, 85, 95].map((t) => (
            <span key={t} className="absolute inset-y-[-2px] w-px bg-paper/90" style={{ left: t + '%' }} />
          ))}
        </div>
        <span
          className={cn(
            'num flex w-12 shrink-0 items-center justify-end gap-0.5 text-[0.6rem]',
            rising ? 'text-ember-500' : falling ? 'text-ink/45' : 'text-ink/35',
          )}
        >
          {rising && <TrendingUp className="h-2.5 w-2.5" strokeWidth={2.4} />}
          {falling && <TrendingDown className="h-2.5 w-2.5" strokeWidth={2.4} />}
          {(delta > 0 ? '+' : delta < 0 ? '-' : '') + Math.abs(delta).toFixed(1)}
        </span>
      </div>
    </button>
  )
}

/* ────────────────────────────── alert card ───────────────────────────── */

function AlertCard({
  iv,
  onDispatch,
  onFocus,
}: {
  iv: Intervention
  onDispatch: () => void
  onFocus: () => void
}) {
  const zone = ZONE_BY_ID[iv.zoneId]
  const meta = BANDS[iv.band]
  const [sending, setSending] = useState(false)

  return (
    <motion.article
      layout
      initial={{ opacity: 0, x: 24, height: 0 }}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      exit={{ opacity: 0, x: 24, height: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden border-b border-line"
    >
      <div className="px-4 py-4">
        <button type="button" onClick={onFocus} className="mb-3 flex w-full items-center justify-between gap-2 text-left">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rotate-45" style={{ background: meta.color }} />
            <span className="num text-[0.72rem] font-bold tracking-[0.12em]" style={{ color: meta.color }}>
              {zone.code}
            </span>
            <span className="truncate text-[0.78rem] text-ink/75">{zone.name}</span>
          </span>
          <BandChip band={iv.band} />
        </button>

        {/* prediction chain, always visible */}
        <ol className="mb-4 space-y-1.5 border-l border-line pl-3">
          {iv.chain.map((c, i) => (
            <li
              key={i}
              className={cn(
                'relative text-[0.72rem] leading-snug',
                i === iv.chain.length - 1 ? 'font-medium text-ember-700' : 'text-ink/48',
              )}
            >
              <span
                className="absolute -left-[13px] top-1.5 h-1 w-1 rounded-full"
                style={{ background: i === iv.chain.length - 1 ? meta.color : 'var(--color-ember-900)' }}
              />
              {c}
            </li>
          ))}
        </ol>

        {/* ranked relief targets */}
        <div className="mb-3 space-y-1">
          <div className="tele mb-1.5 text-ink/45">RELIEF TARGETS</div>
          {iv.targets.map((t) => {
            const tz = ZONE_BY_ID[t.zoneId]
            return (
              <div key={t.zoneId} className="flex items-center gap-2 text-[0.7rem]">
                <span className="num w-10 shrink-0 text-ink/50">{tz.code}</span>
                <span className="truncate text-ink/62">{tz.name}</span>
                <div className="ml-auto flex shrink-0 items-center gap-2">
                  <span className="relative h-1 w-10 bg-line">
                    <span
                      className="absolute inset-y-0 left-0 bg-ember-500"
                      style={{ width: Math.min(t.score * 100, 100) + '%' }}
                    />
                  </span>
                  <span className="num w-12 text-right font-bold text-ember-700">
                    {t.divert.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <p className="mb-3 border-l-2 border-ember-700 bg-raised py-2 pl-3 pr-2 text-[0.72rem] leading-relaxed text-ink/62">
          {iv.attendeeMessage}
        </p>

        <div className="mb-3 flex items-center gap-3">
          <span className="tele text-ink/40">NUDGE</span>
          <span className="num text-[0.72rem] font-bold text-ember-700">{inr(iv.incentive.amountInr)}</span>
          <span className="text-[0.68rem] text-ink/42">{iv.incentive.window}</span>
          <span className="tele ml-auto text-ink/35">
            BUDGET {inr(iv.incentive.budgetInr)}
          </span>
        </div>

        <button
          type="button"
          disabled={sending}
          onClick={() => {
            setSending(true)
            setTimeout(onDispatch, 320)
          }}
          className={cn(
            'group flex w-full items-center justify-center gap-2.5 border py-2.5 transition-colors',
            sending
              ? 'border-ember-700 bg-ember-700 text-paper'
              : 'border-ember-500 bg-ember-500 text-paper hover:bg-ember-700',
          )}
        >
          {sending ? (
            <>
              <Radio className="h-3.5 w-3.5" strokeWidth={2.2} />
              <span className="tele font-bold">TRANSMITTING</span>
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.2} />
              <span className="tele font-bold">DISPATCH INTERVENTION</span>
            </>
          )}
        </button>
      </div>
    </motion.article>
  )
}

/* ──────────────────────────────── page ───────────────────────────────── */

export default function WarRoom() {
  const sim = useSim()
  const [selected, setSelected] = useState('z01')
  const [lowerTab, setLowerTab] = useState<'log' | 'transit'>('log')

  const pressure = sim.snapshot.pressures.find((p) => p.zoneId === selected)!
  const forecast = useMemo(() => getForecast(selected, sim.rounded), [selected, sim.rounded])
  const zone = ZONE_BY_ID[selected]

  const ranked = useMemo(
    () => [...sim.snapshot.pressures].sort((a, b) => b.score - a.score),
    [sim.snapshot],
  )

  // keep the operator looking at whatever is worst unless they pick something
  const [pinned, setPinned] = useState(false)
  useEffect(() => {
    if (!pinned && ranked[0] && ranked[0].score >= 70) setSelected(ranked[0].zoneId)
  }, [ranked, pinned])

  const liveEvent = EVENTS.find((e) => sim.rounded >= e.startsAt && sim.rounded <= e.endsAt)
  const nextEvent = EVENTS.find((e) => e.endsAt > sim.rounded)

  const pick = (id: string) => {
    setSelected(id)
    setPinned(true)
  }

  return (
    <div className="min-h-screen bg-paper pt-14 font-tele">
      {/* ───────── console bar ───────── */}
      <div className="sticky top-14 z-40 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto max-w-[1800px]">
          <div className="flex flex-wrap items-stretch divide-x divide-line border-b border-line">
            <div className="flex items-center gap-4 px-5 py-3">
              <div>
                <div className="tele text-ink/45">OPERATION</div>
                <div className="display text-[1.05rem] leading-tight text-ink">
                  {HOST_CITY.eventName}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 px-5 py-3">
              <div>
                <div className="tele text-ink/45">LOCAL TIME</div>
                <div className="num text-[1.35rem] font-bold leading-tight text-ember-700 tabular-nums">
                  {wallClock(sim.rounded)}
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="tele text-ink/45">T PLUS</div>
                <div className="num text-[0.85rem] leading-tight text-ink/55">
                  {sim.rounded} MIN
                </div>
              </div>
            </div>

            {/* transport */}
            <div className="flex items-center gap-1.5 px-4 py-3">
              <button
                type="button"
                onClick={() => sim.setPlaying(!sim.playing)}
                className="grid h-8 w-8 place-items-center border border-ember-500 text-ember-500 transition-colors hover:bg-raised"
                aria-label={sim.playing ? 'Pause' : 'Play'}
              >
                {sim.playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={sim.reset}
                className="grid h-8 w-8 place-items-center border border-line text-ink/50 transition-colors hover:border-ember-500 hover:text-ink"
                aria-label="Reset"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <div className="ml-2 flex">
                {SPEEDS.map((s, i) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => sim.setSpeedIndex(i)}
                    className={cn(
                      'tele border px-2 py-1.5 transition-colors',
                      i === sim.speedIndex
                        ? 'border-ember-500 bg-ember-500 text-paper'
                        : 'border-line text-ink/45 hover:text-ink/80',
                      i > 0 && '-ml-px',
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <Stat
              label="VISITORS TRACKED"
              value={compact(sim.snapshot.totals.visitors)}
              icon={Users}
            />
            <Stat
              label="MEAN PRESSURE"
              value={sim.snapshot.totals.meanPressure.toFixed(1)}
              icon={Gauge}
              tone={sim.snapshot.totals.meanPressure >= 70 ? 'hot' : 'default'}
            />
            <Stat
              label="ZONES AT RISK"
              value={String(sim.snapshot.totals.zonesAtRisk)}
              sub={'/ ' + sim.snapshot.zones.length}
              icon={ShieldAlert}
              tone={sim.snapshot.totals.zonesAtRisk > 0 ? 'hot' : 'default'}
            />
            <div className="ml-auto hidden items-center gap-3 px-5 py-3 lg:flex">
              <span className="tele text-ink/45">ON FIELD</span>
              <span className="num text-[0.72rem] text-ink/70">
                {liveEvent ? liveEvent.name : nextEvent ? 'NEXT ' + nextEvent.name : 'NO FIXTURE'}
              </span>
              {liveEvent && (
                <span className="tele border border-ember-500/50 px-1.5 py-0.5 text-ember-700">
                  OUT {wallClock(liveEvent.endsAt)}
                </span>
              )}
            </div>
          </div>

          {/* scenario scrubber */}
          <div className="flex items-center gap-3 px-5 py-2">
            <span className="tele shrink-0 text-ink/45">SCENARIO</span>
            <div className="relative h-6 flex-1">
              <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line" />
              <div
                className="absolute top-1/2 h-px -translate-y-1/2 bg-ember-500"
                style={{ width: (sim.rounded / sim.maxClock) * 100 + '%' }}
              />
              {SCENARIO_MARKS.map((m) => (
                <button
                  key={m.label}
                  type="button"
                  title={m.note}
                  onClick={() => sim.seek(m.clock)}
                  className="group absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: (m.clock / sim.maxClock) * 100 + '%' }}
                >
                  <span
                    className={cn(
                      'block h-2 w-2 rotate-45 border transition-colors',
                      sim.rounded >= m.clock
                        ? 'border-ember-500 bg-ember-500'
                        : 'border-line-strong bg-paper group-hover:bg-ember-400',
                    )}
                  />
                  <span className="tele pointer-events-none absolute left-1/2 top-4 hidden -translate-x-1/2 whitespace-nowrap text-ink/48 group-hover:block">
                    {m.label}
                  </span>
                </button>
              ))}
              <div
                className="absolute top-1/2 h-4 w-px -translate-y-1/2 bg-ink"
                style={{ left: (sim.rounded / sim.maxClock) * 100 + '%' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ───────── main grid ───────── */}
      <div className="mx-auto max-w-[1800px] p-3">
        <div className="grid gap-3 xl:grid-cols-[290px_minmax(0,1fr)_390px]">
          {/* left: ranking */}
          <Panel
            title="PRESSURE RANKING"
            right={<span className="tele text-ink/38">SCORE · Δ15M</span>}
            bodyClass="overflow-y-auto max-h-[calc(100vh-13rem)]"
          >
            {ranked.map((p) => (
              <PressureRow key={p.zoneId} p={p} selected={p.zoneId === selected} onSelect={() => pick(p.zoneId)} />
            ))}
          </Panel>

          {/* center */}
          <div className="flex min-w-0 flex-col gap-3">
            <Panel
              title="ZONE PRESSURE PLATE"
              right={
                <div className="flex items-center gap-3">
                  {(['nominal', 'watch', 'warning', 'critical'] as const).map((b) => (
                    <span key={b} className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5" style={{ background: BANDS[b].color }} />
                      <span className="tele text-ink/40">{BANDS[b].label}</span>
                    </span>
                  ))}
                </div>
              }
              bodyClass="p-2"
            >
              <CityPlate snapshot={sim.snapshot} selected={selected} onSelect={pick} className="aspect-[16/10]" />
            </Panel>

            {/* selected zone detail */}
            <Panel
              title={'FORECAST · ' + zone.code + ' ' + zone.name}
              right={
                <div className="flex items-center gap-3">
                  <span className="tele text-ink/38">
                    CONF {(forecast.confidence * 100).toFixed(0)}%
                  </span>
                  <BandChip band={pressure.band} score={pressure.score} />
                </div>
              }
            >
              <div className="grid gap-4 p-4 lg:grid-cols-[1fr_240px]">
                <div className="min-w-0">
                  <ForecastChart forecast={forecast} clock={sim.rounded} />
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="tele mb-2 text-ink/45">SCORE COMPOSITION</div>
                    {[
                      { k: 'OCCUPANCY', w: 0.5, v: pressure.components.occupancy },
                      { k: 'VELOCITY', w: 0.3, v: pressure.components.velocity },
                      { k: 'EVENT FLUX', w: 0.2, v: pressure.components.flux },
                    ].map((c) => (
                      <div key={c.k} className="mb-2">
                        <div className="mb-1 flex items-baseline justify-between">
                          <span className="tele text-ink/48">{c.k}</span>
                          <span className="num text-[0.62rem] text-ink/60">
                            {(c.v * 100).toFixed(0)} × {c.w}
                          </span>
                        </div>
                        <div className="h-1.5 bg-line">
                          <motion.div
                            className="h-full bg-ember-500"
                            animate={{ width: Math.min(c.v * 100, 100) + '%' }}
                            transition={{ duration: 0.45 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3 border-t border-line pt-3">
                    <div>
                      <div className="tele text-ink/45">OCCUPANCY</div>
                      <div className="num text-[0.95rem] font-bold text-ink">
                        {pressure.occupancy.toLocaleString('en-IN')}
                      </div>
                      <div className="num text-[0.6rem] text-ink/42">
                        of {pressure.capacity.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div>
                      <div className="tele text-ink/45">SATURATION</div>
                      <div
                        className="num text-[0.95rem] font-bold"
                        style={{
                          color:
                            forecast.etaToSaturationMin !== null
                              ? BANDS.critical.color
                              : BANDS[pressure.band].color,
                        }}
                      >
                        {forecast.etaToSaturationMin !== null
                          ? 'T+' + forecast.etaToSaturationMin
                          : pressure.score >= 85
                            ? 'IN BAND'
                            : 'CLEAR'}
                      </div>
                      <div className="num text-[0.6rem] text-ink/42">
                        peak {forecast.projectedPeak.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Panel>
          </div>

          {/* right: alerts */}
          <div className="flex min-w-0 flex-col gap-3">
            <Panel
              title="INTERVENTION QUEUE"
              right={
                <span className="tele flex items-center gap-1.5 text-ember-700">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-ember-400"
                    style={{ animation: 'nexus-blink 1.2s steps(1,end) infinite' }}
                  />
                  {sim.queue.length} OPEN
                </span>
              }
              bodyClass="overflow-y-auto max-h-[calc(100vh-22rem)]"
            >
              <AnimatePresence initial={false} mode="popLayout">
                {sim.queue.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-3 px-6 py-16 text-center"
                  >
                    <Check className="h-6 w-6 text-ink/45" strokeWidth={1.4} />
                    <p className="tele text-ink/40">ALL ZONES BELOW WATCH LINE</p>
                    <p className="font-luxe text-[1.12rem] italic text-ink/38">
                      Nothing to act on. This is what success looks like.
                    </p>
                  </motion.div>
                ) : (
                  sim.queue.map((iv) => (
                    <AlertCard
                      key={iv.zoneId}
                      iv={iv}
                      onFocus={() => pick(iv.zoneId)}
                      onDispatch={() => sim.dispatch(iv)}
                    />
                  ))
                )}
              </AnimatePresence>
            </Panel>

            <Panel
              title={lowerTab === 'log' ? 'DISPATCH LOG' : 'TRANSIT LOAD'}
              right={
                <div className="flex items-center gap-px bg-line">
                  {(['log', 'transit'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setLowerTab(t)}
                      className={cn(
                        'tele px-2.5 py-1 transition-colors',
                        t === lowerTab
                          ? 'bg-ember-500 text-paper'
                          : 'bg-surface text-ink/45 hover:text-ink',
                      )}
                    >
                      {t === 'log' ? 'LOG ' + sim.dispatched.length : 'TRANSIT'}
                    </button>
                  ))}
                </div>
              }
            >
              {lowerTab === 'log' ? (
                <div className="max-h-64 overflow-y-auto">
                  {sim.dispatched.length === 0 ? (
                    <p className="px-4 py-8 text-center font-luxe text-[1.15rem] italic text-ink/35">
                      No interventions sent yet.
                    </p>
                  ) : (
                    <>
                      <div className="flex items-center justify-between border-b border-line bg-raised px-4 py-2">
                        <span className="tele text-ink/45">TOTAL REROUTED</span>
                        <span className="num text-[0.78rem] font-bold text-ember-700">
                          {compact(sim.divertedTotal)}
                        </span>
                      </div>
                      {sim.dispatched.map((d) => (
                        <motion.div
                          key={d.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border-b border-line px-4 py-2.5"
                        >
                          <div className="flex items-center gap-2">
                            <Check className="h-3 w-3 shrink-0 text-ember-500" strokeWidth={3} />
                            <span className="num text-[0.62rem] text-ink/45">
                              {wallClock(d.createdAt)}
                            </span>
                            <span className="num text-[0.68rem] font-bold text-ember-700">
                              {ZONE_BY_ID[d.zoneId].code}
                            </span>
                            <span className="tele ml-auto text-ink/38">
                              -{d.projectedRelief.toFixed(1)} PTS
                            </span>
                          </div>
                          <p className="mt-1 text-[0.68rem] leading-snug text-ink/48">{d.opsAlert}</p>
                        </motion.div>
                      ))}
                    </>
                  )}
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {[...sim.snapshot.links]
                    .sort((a, b) => b.load - a.load)
                    .slice(0, 8)
                    .map((l) => (
                      <div key={l.id} className="flex items-center gap-2 border-b border-line px-4 py-2">
                        <span className="num w-20 shrink-0 text-[0.62rem] text-ink/55">
                          {ZONE_BY_ID[l.from].code} {'>'} {ZONE_BY_ID[l.to].code}
                        </span>
                        <span className="tele w-10 shrink-0 text-ink/40">{l.mode}</span>
                        <div className="relative h-1.5 flex-1 bg-line">
                          <div
                            className="absolute inset-y-0 left-0"
                            style={{
                              width: l.load * 100 + '%',
                              background:
                                l.load > 0.85
                                  ? BANDS.critical.color
                                  : l.load > 0.7
                                    ? BANDS.warning.color
                                    : BANDS.watch.color,
                            }}
                          />
                        </div>
                        <span className="num w-9 shrink-0 text-right text-[0.62rem] font-bold text-ink/70">
                          {(l.load * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </Panel>
          </div>
        </div>
      </div>
    </div>
  )
}
