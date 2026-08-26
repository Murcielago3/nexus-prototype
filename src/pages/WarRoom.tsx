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
import type { Intervention, PressureBand, ZonePressure } from '@/data/types'
import { cn, compact, inr } from '@/lib/utils'

const SHELL = 'mx-auto w-full max-w-[1440px] px-6 sm:px-10'

/* ──────────────────────────── building blocks ─────────────────────────── */

function Panel({
  title,
  right,
  children,
  className,
  padded = true,
}: {
  title: string
  right?: React.ReactNode
  children: React.ReactNode
  className?: string
  padded?: boolean
}) {
  return (
    <section className={cn('panel flex flex-col', className)}>
      <header className="flex min-h-[3.5rem] shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
        <h2 className="tele text-ember-700">{title}</h2>
        {right}
      </header>
      <div className={cn('flex-1', padded && 'p-6')}>{children}</div>
    </section>
  )
}

function BandDot({ band }: { band: PressureBand }) {
  return <span className="inline-block h-2 w-2 shrink-0" style={{ background: BANDS[band].color }} />
}

function BandTag({ band }: { band: PressureBand }) {
  const meta = BANDS[band]
  return (
    <span
      className="tele inline-flex items-center gap-1.5 border px-2 py-1"
      style={{ color: meta.text, borderColor: meta.color + '77' }}
    >
      {(band === 'warning' || band === 'critical') && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: meta.color, animation: 'nexus-blink 1.1s steps(1,end) infinite' }}
        />
      )}
      {meta.label}
    </span>
  )
}

function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  hot,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  hot?: boolean
}) {
  return (
    <div className="flex items-start gap-3.5">
      <Icon className={cn('mt-1 h-5 w-5 shrink-0', hot ? 'text-ember-700' : 'text-ink/62')} strokeWidth={1.5} />
      <div>
        <div className="tele mb-1.5 text-ink/62">{label}</div>
        <div className={cn('num text-[1.4rem] font-bold leading-none', hot ? 'text-ember-700' : 'text-ink')}>
          {value}
          {sub && <span className="ml-1.5 text-[0.7rem] font-normal text-ink/62">{sub}</span>}
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────────── zone table ─────────────────────────────── */

function ZoneRow({
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
  const delta = Math.round(p.rateOfChange15m * 10) / 10
  const load = p.occupancy / p.capacity

  return (
    <tr
      onClick={onSelect}
      className={cn(
        'cursor-pointer border-b border-line transition-colors last:border-b-0',
        selected ? 'bg-raised' : 'hover:bg-raised/55',
      )}
    >
      <td className="py-4 pl-6 pr-3">
        <div className="flex items-center gap-3">
          <BandDot band={p.band} />
          <span className="num text-[0.72rem] font-bold tracking-[0.12em] text-ink/78">{zone.code}</span>
        </div>
      </td>
      <td className="px-3 py-4">
        <span className="num text-[0.8rem] font-medium text-ink">{zone.name}</span>
      </td>
      <td className="hidden px-3 py-4 lg:table-cell">
        <span className="tele text-ink/62">{zone.sector}</span>
      </td>
      <td className="hidden px-3 py-4 text-right md:table-cell">
        <span className="num text-[0.74rem] text-ink/82">{p.occupancy.toLocaleString('en-IN')}</span>
        <span className="num text-[0.68rem] text-ink/62"> / {compact(p.capacity)}</span>
      </td>
      <td className="w-[22%] px-3 py-4">
        <div className="relative h-2 bg-line">
          <motion.div
            className="absolute inset-y-0 left-0"
            style={{ background: meta.color }}
            animate={{ width: Math.min(p.score, 100) + '%' }}
            transition={{ duration: 0.5 }}
          />
          {[70, 85, 95].map((t) => (
            <span key={t} className="absolute inset-y-[-3px] w-px bg-paper" style={{ left: t + '%' }} />
          ))}
        </div>
      </td>
      <td className="px-3 py-4 text-right">
        <span className="num text-[1rem] font-bold" style={{ color: meta.text }}>
          {p.score.toFixed(0)}
        </span>
      </td>
      <td className="px-3 py-4 text-right">
        <span
          className={cn(
            'num inline-flex items-center justify-end gap-1 text-[0.72rem]',
            delta >= 0.5 ? 'text-ember-700' : delta <= -0.5 ? 'text-ink/70' : 'text-ink/62',
          )}
        >
          {delta >= 0.5 && <TrendingUp className="h-3 w-3" strokeWidth={2.4} />}
          {delta <= -0.5 && <TrendingDown className="h-3 w-3" strokeWidth={2.4} />}
          {(delta > 0 ? '+' : delta < 0 ? '-' : '') + Math.abs(delta).toFixed(1)}
        </span>
      </td>
      <td className="hidden py-4 pl-3 pr-6 text-right sm:table-cell">
        <span className="num text-[0.72rem] text-ink/62">{(load * 100).toFixed(0)}%</span>
      </td>
    </tr>
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
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.28, 1] }}
      className="border border-line bg-paper p-6"
    >
      <button
        type="button"
        onClick={onFocus}
        className="mb-5 flex w-full items-start justify-between gap-4 text-left"
      >
        <span>
          <span className="num block text-[0.72rem] font-bold tracking-[0.14em]" style={{ color: meta.text }}>
            {zone.code}
          </span>
          <span className="num mt-1 block text-[0.9rem] font-medium text-ink">{zone.name}</span>
        </span>
        <BandTag band={iv.band} />
      </button>

      {/* the reasoning trail, never collapsed */}
      <ol className="mb-6 space-y-2.5 border-l border-line pl-4">
        {iv.chain.map((c, i) => (
          <li
            key={i}
            className={cn(
              'relative text-[0.76rem] leading-relaxed',
              i === iv.chain.length - 1 ? 'font-bold text-ember-700' : 'text-ink/74',
            )}
          >
            <span
              className="absolute -left-[17px] top-2 h-1.5 w-1.5 rounded-full"
              style={{ background: i === iv.chain.length - 1 ? meta.color : 'var(--color-line-strong)' }}
            />
            {c}
          </li>
        ))}
      </ol>

      <div className="mb-6">
        <div className="tele mb-3 text-ink/62">RELIEF TARGETS</div>
        <div className="space-y-2.5">
          {iv.targets.map((t) => {
            const tz = ZONE_BY_ID[t.zoneId]
            return (
              <div key={t.zoneId} className="flex items-center gap-3 text-[0.74rem]">
                <span className="num w-11 shrink-0 font-bold text-ink/74">{tz.code}</span>
                <span className="truncate text-ink/82">{tz.name}</span>
                <span className="relative ml-auto h-1.5 w-14 shrink-0 bg-line">
                  <span
                    className="absolute inset-y-0 left-0 bg-ember-400"
                    style={{ width: Math.min(t.score * 100, 100) + '%' }}
                  />
                </span>
                <span className="num w-14 shrink-0 text-right font-bold text-ember-700">
                  {t.divert.toLocaleString('en-IN')}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <p className="mb-5 border-l-2 border-ember-500 bg-raised px-4 py-3.5 text-[0.76rem] leading-relaxed text-ink/84">
        {iv.attendeeMessage}
      </p>

      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-line py-3.5">
        <span className="tele text-ink/62">NUDGE</span>
        <span className="num text-[0.82rem] font-bold text-ember-700">{inr(iv.incentive.amountInr)}</span>
        <span className="text-[0.72rem] text-ink/62">{iv.incentive.window}</span>
        <span className="tele ml-auto text-ink/62">BUDGET {inr(iv.incentive.budgetInr)}</span>
      </div>

      <button
        type="button"
        disabled={sending}
        onClick={() => {
          setSending(true)
          setTimeout(onDispatch, 320)
        }}
        className={cn(
          'group flex w-full items-center justify-center gap-3 py-3.5 transition-colors',
          sending ? 'bg-ember-700 text-paper' : 'bg-ember-700 text-paper hover:bg-ember-900',
        )}
      >
        {sending ? (
          <>
            <Radio className="h-4 w-4" strokeWidth={2.2} />
            <span className="tele font-bold">TRANSMITTING</span>
          </>
        ) : (
          <>
            <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.2} />
            <span className="tele font-bold">DISPATCH INTERVENTION</span>
          </>
        )}
      </button>
    </motion.article>
  )
}

/* ──────────────────────────────── page ───────────────────────────────── */

export default function WarRoom() {
  const sim = useSim()
  const [selected, setSelected] = useState('z01')
  const [pinned, setPinned] = useState(false)

  const pressure = sim.snapshot.pressures.find((p) => p.zoneId === selected)!
  const forecast = useMemo(() => getForecast(selected, sim.rounded), [selected, sim.rounded])
  const zone = ZONE_BY_ID[selected]

  const ranked = useMemo(
    () => [...sim.snapshot.pressures].sort((a, b) => b.score - a.score),
    [sim.snapshot],
  )

  // keep the operator looking at whatever is worst until they pick something
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
      {/* ───────── command bar ───────── */}
      <header className="sticky top-14 z-40 border-b border-line bg-paper/95 backdrop-blur">
        <div className={cn(SHELL, 'py-6')}>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="tele mb-2 text-ink/62">OPERATION</div>
              <h1 className="display text-[1.55rem] leading-none text-ink">{HOST_CITY.eventName}</h1>
              <div className="tele mt-3 flex flex-wrap items-center gap-2 text-ink/62">
                <span>ON FIELD</span>
                <span className="text-ink/84">
                  {liveEvent ? liveEvent.name : nextEvent ? 'NEXT ' + nextEvent.name : 'NO FIXTURE'}
                </span>
                {liveEvent && (
                  <span className="border border-ember-500/50 px-2 py-0.5 text-ember-700">
                    OUT {wallClock(liveEvent.endsAt)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-8">
              <div>
                <div className="tele mb-2 text-ink/62">LOCAL TIME</div>
                <div className="num text-[2.1rem] font-bold leading-none tabular-nums text-ember-700">
                  {wallClock(sim.rounded)}
                </div>
              </div>

              <div className="flex items-center gap-2 pb-1">
                <button
                  type="button"
                  onClick={() => sim.setPlaying(!sim.playing)}
                  className="grid h-10 w-10 place-items-center border border-ember-700 text-ember-700 transition-colors hover:bg-ember-700 hover:text-paper"
                  aria-label={sim.playing ? 'Pause' : 'Play'}
                >
                  {sim.playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={sim.reset}
                  className="grid h-10 w-10 place-items-center border border-line text-ink/70 transition-colors hover:border-ember-500 hover:text-ink"
                  aria-label="Reset"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <div className="ml-1 flex">
                  {SPEEDS.map((s, i) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => sim.setSpeedIndex(i)}
                      className={cn(
                        'tele border px-3 py-2.5 transition-colors',
                        i === sim.speedIndex
                          ? 'border-ember-700 bg-ember-700 text-paper'
                          : 'border-line text-ink/62 hover:text-ink',
                        i > 0 && '-ml-px',
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* the numbers get their own line rather than fighting the title */}
          <div className="mt-7 grid gap-7 border-t border-line pt-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="VISITORS TRACKED" value={compact(sim.snapshot.totals.visitors)} icon={Users} />
            <StatTile
              label="MEAN PRESSURE"
              value={sim.snapshot.totals.meanPressure.toFixed(1)}
              icon={Gauge}
              hot={sim.snapshot.totals.meanPressure >= 70}
            />
            <StatTile
              label="ZONES AT RISK"
              value={String(sim.snapshot.totals.zonesAtRisk)}
              sub={'/ ' + sim.snapshot.zones.length}
              icon={ShieldAlert}
              hot={sim.snapshot.totals.zonesAtRisk > 0}
            />
            <StatTile label="REROUTED" value={compact(sim.divertedTotal)} icon={Send} />
          </div>
        </div>
      </header>

      {/* ───────── scenario ───────── */}
      <div className="border-b border-line bg-surface">
        <div className={cn(SHELL, 'pb-16 pt-7')}>
          <div className="mb-8 flex items-center gap-3">
            <span className="tele text-ink/62">SCENARIO</span>
            <span className="num text-[0.7rem] text-ink/74">T PLUS {sim.rounded} MIN</span>
          </div>
          <div className="relative h-px bg-line">
            <div
              className="absolute inset-y-0 left-0 bg-ember-500"
              style={{ width: (sim.rounded / sim.maxClock) * 100 + '%' }}
            />
            {SCENARIO_MARKS.map((m) => {
              const reached = sim.rounded >= m.clock
              return (
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
                      'block h-2.5 w-2.5 rotate-45 border transition-colors',
                      reached
                        ? 'border-ember-500 bg-ember-500'
                        : 'border-line-strong bg-paper group-hover:bg-ember-400',
                    )}
                  />
                  <span
                    className={cn(
                      'tele absolute left-1/2 top-6 w-28 -translate-x-1/2 text-center leading-relaxed transition-colors',
                      reached ? 'text-ink/88' : 'text-ink/72',
                    )}
                  >
                    {m.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ───────── body ───────── */}
      <div className={cn(SHELL, 'space-y-8 py-10')}>
        <div className="grid gap-8 xl:grid-cols-[1.55fr_1fr]">
          <Panel
            title="ZONE PRESSURE PLATE"
            right={
              <div className="flex flex-wrap items-center gap-4">
                {(['nominal', 'watch', 'warning', 'critical'] as const).map((b) => (
                  <span key={b} className="flex items-center gap-2">
                    <BandDot band={b} />
                    <span className="tele text-ink/62">{BANDS[b].label}</span>
                  </span>
                ))}
              </div>
            }
            padded={false}
          >
            <CityPlate
              snapshot={sim.snapshot}
              selected={selected}
              onSelect={pick}
              className="aspect-[16/9] p-5"
            />
          </Panel>

          <Panel
            title="INTERVENTION QUEUE"
            right={
              <span className="tele flex items-center gap-2 text-ember-700">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-ember-500"
                  style={{ animation: 'nexus-blink 1.2s steps(1,end) infinite' }}
                />
                {sim.queue.length} OPEN
              </span>
            }
          >
            <div className="space-y-5">
              <AnimatePresence initial={false} mode="popLayout">
                {sim.queue.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4 px-6 py-20 text-center"
                  >
                    <Check className="h-7 w-7 text-ember-400" strokeWidth={1.4} />
                    <p className="tele text-ink/62">ALL ZONES BELOW WATCH LINE</p>
                    <p className="font-luxe text-[0.98rem] italic text-ink/62">
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
            </div>
          </Panel>
        </div>

        <Panel
          title={'FORECAST · ' + zone.code + ' ' + zone.name}
          right={
            <div className="flex items-center gap-4">
              <span className="tele text-ink/62">CONFIDENCE {(forecast.confidence * 100).toFixed(0)}%</span>
              <BandTag band={pressure.band} />
            </div>
          }
        >
          <div className="grid gap-10 lg:grid-cols-[1.7fr_1fr]">
            <div className="min-w-0">
              <ForecastChart forecast={forecast} clock={sim.rounded} />
            </div>

            <div className="space-y-8">
              <div>
                <div className="tele mb-4 text-ink/62">SCORE COMPOSITION</div>
                <div className="space-y-4">
                  {[
                    { k: 'OCCUPANCY', w: 0.5, v: pressure.components.occupancy },
                    { k: 'VELOCITY', w: 0.3, v: pressure.components.velocity },
                    { k: 'EVENT FLUX', w: 0.2, v: pressure.components.flux },
                  ].map((c) => (
                    <div key={c.k}>
                      <div className="mb-2 flex items-baseline justify-between">
                        <span className="tele text-ink/74">{c.k}</span>
                        <span className="num text-[0.7rem] text-ink/78">
                          {(c.v * 100).toFixed(0)} × {c.w}
                        </span>
                      </div>
                      <div className="h-2 bg-line">
                        <motion.div
                          className="h-full bg-ember-500"
                          animate={{ width: Math.min(c.v * 100, 100) + '%' }}
                          transition={{ duration: 0.45 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 border-t border-line pt-6">
                <div>
                  <div className="tele mb-2 text-ink/62">OCCUPANCY</div>
                  <div className="num text-[1.15rem] font-bold text-ink">
                    {pressure.occupancy.toLocaleString('en-IN')}
                  </div>
                  <div className="num mt-1 text-[0.66rem] text-ink/62">
                    of {pressure.capacity.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div className="tele mb-2 text-ink/62">SATURATION</div>
                  <div
                    className="num text-[1.15rem] font-bold"
                    style={{
                      color:
                        forecast.etaToSaturationMin !== null
                          ? BANDS.critical.text
                          : BANDS[pressure.band].text,
                    }}
                  >
                    {forecast.etaToSaturationMin !== null
                      ? 'T+' + forecast.etaToSaturationMin
                      : pressure.score >= 85
                        ? 'IN BAND'
                        : 'CLEAR'}
                  </div>
                  <div className="num mt-1 text-[0.66rem] text-ink/62">
                    peak {forecast.projectedPeak.toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="ALL ZONES" right={<span className="tele text-ink/62">SORTED BY PRESSURE</span>} padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse">
              <thead>
                <tr className="border-b border-line">
                  <th className="tele py-4 pl-6 pr-3 text-left font-medium text-ink/62">ZONE</th>
                  <th className="tele px-3 py-4 text-left font-medium text-ink/62">NAME</th>
                  <th className="tele hidden px-3 py-4 text-left font-medium text-ink/62 lg:table-cell">SECTOR</th>
                  <th className="tele hidden px-3 py-4 text-right font-medium text-ink/62 md:table-cell">
                    OCCUPANCY
                  </th>
                  <th className="tele px-3 py-4 text-left font-medium text-ink/62">PRESSURE</th>
                  <th className="tele px-3 py-4 text-right font-medium text-ink/62">SCORE</th>
                  <th className="tele px-3 py-4 text-right font-medium text-ink/62">Δ15M</th>
                  <th className="tele hidden py-4 pl-3 pr-6 text-right font-medium text-ink/62 sm:table-cell">
                    LOAD
                  </th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((p) => (
                  <ZoneRow key={p.zoneId} p={p} selected={p.zoneId === selected} onSelect={() => pick(p.zoneId)} />
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="grid gap-8 lg:grid-cols-2">
          <Panel
            title="DISPATCH LOG"
            right={
              <span className="tele text-ink/62">
                {sim.dispatched.length} SENT · {compact(sim.divertedTotal)} REROUTED
              </span>
            }
            padded={false}
          >
            {sim.dispatched.length === 0 ? (
              <p className="px-6 py-16 text-center font-luxe text-[0.98rem] italic text-ink/62">
                No interventions sent yet.
              </p>
            ) : (
              <div>
                {sim.dispatched.map((d) => (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-b border-line px-6 py-4 last:border-b-0"
                  >
                    <div className="mb-2 flex items-center gap-3">
                      <Check className="h-3.5 w-3.5 shrink-0 text-ember-700" strokeWidth={3} />
                      <span className="num text-[0.68rem] text-ink/62">{wallClock(d.createdAt)}</span>
                      <span className="num text-[0.74rem] font-bold text-ember-700">
                        {ZONE_BY_ID[d.zoneId].code}
                      </span>
                      <span className="tele ml-auto text-ink/62">-{d.projectedRelief.toFixed(1)} PTS</span>
                    </div>
                    <p className="text-[0.72rem] leading-relaxed text-ink/74">{d.opsAlert}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="TRANSIT LOAD" right={<span className="tele text-ink/62">TOP CORRIDORS</span>} padded={false}>
            <div>
              {[...sim.snapshot.links]
                .sort((a, b) => b.load - a.load)
                .slice(0, 8)
                .map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center gap-4 border-b border-line px-6 py-3.5 last:border-b-0"
                  >
                    <span className="num w-24 shrink-0 text-[0.7rem] text-ink/78">
                      {ZONE_BY_ID[l.from].code} {'>'} {ZONE_BY_ID[l.to].code}
                    </span>
                    <span className="tele w-12 shrink-0 text-ink/62">{l.mode}</span>
                    <div className="relative h-2 flex-1 bg-line">
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
                    <span className="num w-11 shrink-0 text-right text-[0.72rem] font-bold text-ink/84">
                      {(l.load * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
