import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { tourScrollTo } from '@/components/SmoothScroll'
import { cn } from '@/lib/utils'
import { CHAPTERS, STEPS } from './steps'
import { useTour } from './TourProvider'

const CARD_W = 400
const GAP = 20
const EDGE = 20

interface Rect { top: number; left: number; width: number; height: number }

/**
 * Tracks the on screen box of the current target.
 *
 * The element may not exist the instant a step becomes current: the route can
 * still be navigating, the page chunk can still be loading, and the War Room
 * queue only renders an alert once the clock has been seeked. So this polls
 * for a short window rather than measuring once and giving up.
 */
function useTargetRect(target: string | undefined, stepId: string, padding: number) {
  const [rect, setRect] = useState<Rect | null>(null)

  useEffect(() => {
    if (!target) {
      setRect(null)
      return
    }

    let scrolled = false
    setRect(null)

    const measure = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`)
      if (!el) return
      if (!scrolled) {
        scrolled = true
        tourScrollTo(el, -190)
      }
      const r = el.getBoundingClientRect()
      if (r.width > 0 || r.height > 0) {
        setRect({
          top: r.top - padding,
          left: r.left - padding,
          width: r.width + padding * 2,
          height: r.height + padding * 2,
        })
      }
    }

    // Measure once straight away, then keep following on a timer rather than
    // requestAnimationFrame. rAF stops entirely in a tab that is not
    // compositing, and a tour that silently loses its spotlight there is far
    // worse than tracking at 10Hz. The spring on the mask smooths the gaps.
    measure()
    const id = setInterval(measure, 100)
    window.addEventListener('resize', measure)
    return () => {
      clearInterval(id)
      window.removeEventListener('resize', measure)
    }
  }, [target, stepId, padding])

  return rect
}

function choosePlacement(
  rect: Rect | null,
  preferred: string | undefined,
  cardH: number,
): { placement: 'top' | 'bottom' | 'left' | 'right' | 'center'; x: number; y: number } {
  const vw = window.innerWidth
  const vh = window.innerHeight

  if (!rect) {
    return { placement: 'center', x: (vw - CARD_W) / 2, y: Math.max((vh - cardH) / 2, EDGE) }
  }

  const fits = {
    right: vw - (rect.left + rect.width) - GAP >= CARD_W + EDGE,
    left: rect.left - GAP >= CARD_W + EDGE,
    bottom: vh - (rect.top + rect.height) - GAP >= cardH + EDGE,
    top: rect.top - GAP >= cardH + EDGE,
  }

  const order: Array<'right' | 'left' | 'bottom' | 'top'> =
    preferred && preferred !== 'auto'
      ? ([preferred, 'right', 'bottom', 'left', 'top'].filter(
          (v, i, a) => a.indexOf(v) === i,
        ) as Array<'right' | 'left' | 'bottom' | 'top'>)
      : ['right', 'bottom', 'left', 'top']

  const placement = order.find((p) => fits[p])

  const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

  switch (placement) {
    case 'right':
      return {
        placement: 'right',
        x: rect.left + rect.width + GAP,
        y: clamp(rect.top + rect.height / 2 - cardH / 2, EDGE, vh - cardH - EDGE),
      }
    case 'left':
      return {
        placement: 'left',
        x: rect.left - CARD_W - GAP,
        y: clamp(rect.top + rect.height / 2 - cardH / 2, EDGE, vh - cardH - EDGE),
      }
    case 'bottom':
      return {
        placement: 'bottom',
        x: clamp(rect.left + rect.width / 2 - CARD_W / 2, EDGE, vw - CARD_W - EDGE),
        y: rect.top + rect.height + GAP,
      }
    case 'top':
      return {
        placement: 'top',
        x: clamp(rect.left + rect.width / 2 - CARD_W / 2, EDGE, vw - CARD_W - EDGE),
        y: rect.top - cardH - GAP,
      }
    default:
      // nothing fits beside it, so sit the card in the corner furthest away
      return {
        placement: 'center',
        x: rect.left > vw / 2 ? EDGE : vw - CARD_W - EDGE,
        y: clamp(vh - cardH - EDGE * 2, EDGE, vh - cardH - EDGE),
      }
  }
}

/** Corner ticks, the same reticle motif the console uses. */
function Reticle({ rect }: { rect: Rect }) {
  const corners = [
    { x: 0, y: 0, rx: 0 },
    { x: rect.width, y: 0, rx: 90 },
    { x: rect.width, y: rect.height, rx: 180 },
    { x: 0, y: rect.height, rx: 270 },
  ]
  return (
    <>
      {corners.map((c, i) => (
        <motion.span
          key={i}
          className="absolute"
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.12 + i * 0.05, duration: 0.4, ease: [0.22, 1, 0.28, 1] }}
          style={{
            left: c.x,
            top: c.y,
            width: 14,
            height: 14,
            transform: `translate(-50%, -50%) rotate(${c.rx}deg)`,
            borderTop: '2px solid var(--color-ember-500)',
            borderLeft: '2px solid var(--color-ember-500)',
          }}
        />
      ))}
    </>
  )
}

export function TourOverlay() {
  const tour = useTour()
  const { step, active, index, total } = tour
  const cardRef = useRef<HTMLDivElement>(null)
  const [cardH, setCardH] = useState(280)

  const rect = useTargetRect(step?.target, step?.id ?? '', step?.padding ?? 10)

  useLayoutEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight)
  }, [step, rect])

  const [pos, setPos] = useState(() => choosePlacement(null, undefined, 280))

  useEffect(() => {
    setPos(choosePlacement(rect, step?.placement, cardH))
  }, [rect, step, cardH])

  const onResize = useCallback(() => {
    setPos(choosePlacement(rect, step?.placement, cardH))
  }, [rect, step, cardH])

  useEffect(() => {
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [onResize])

  const showing = active && !!step
  const chapterIndex = step ? CHAPTERS.indexOf(step.chapter as (typeof CHAPTERS)[number]) : 0
  const chapterSteps = step ? STEPS.filter((s) => s.chapter === step.chapter) : []
  const posInChapter = step ? chapterSteps.findIndex((s) => s.id === step.id) : 0
  const isLast = index === total - 1

  // the guard lives inside AnimatePresence, not before it, or closing the
  // tour would unmount everything instantly with no fade
  return (
    <AnimatePresence>
      {showing && step && (
      <motion.div
        key="tour"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        className="pointer-events-none fixed inset-0 z-[95]"
      >
        {/* dim everything but the target */}
        <svg className="absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            <mask id="tour-spotlight">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {rect && (
                <motion.rect
                  initial={false}
                  animate={{ x: rect.left, y: rect.top, width: rect.width, height: rect.height }}
                  transition={{ type: 'spring', stiffness: 260, damping: 32, mass: 0.7 }}
                  rx="3"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(26, 5, 0, 0.62)"
            mask="url(#tour-spotlight)"
          />
        </svg>

        {/* click anywhere to advance */}
        <button
          type="button"
          aria-label="Next step"
          onClick={tour.next}
          className="pointer-events-auto absolute inset-0 cursor-pointer"
        />

        {/* the marker on the target */}
        {rect && (
          <motion.div
            className="pointer-events-none absolute"
            initial={false}
            animate={{ x: rect.left, y: rect.top, width: rect.width, height: rect.height }}
            transition={{ type: 'spring', stiffness: 260, damping: 32, mass: 0.7 }}
            style={{ top: 0, left: 0 }}
          >
            <span className="absolute inset-0 border-2 border-ember-500" />
            <span
              className="absolute inset-0 border-2 border-ember-400"
              style={{ animation: 'tour-halo 2s ease-out infinite' }}
            />
            <Reticle rect={rect} />
          </motion.div>
        )}

        <style>
          {'@keyframes tour-halo{0%{opacity:.9;transform:scale(1)}70%,100%{opacity:0;transform:scale(1.06)}}'}
        </style>

        {/* the callout */}
        <motion.div
          ref={cardRef}
          key={step.id}
          className="panel pointer-events-auto absolute shadow-[0_30px_80px_-24px_rgba(74,13,2,0.5)]"
          style={{ width: CARD_W, maxWidth: 'calc(100vw - 40px)' }}
          initial={{ opacity: 0, scale: 0.97, x: pos.x, y: pos.y + 10 }}
          animate={{ opacity: 1, scale: 1, x: pos.x, y: pos.y }}
          transition={{
            x: { type: 'spring', stiffness: 260, damping: 32 },
            y: { type: 'spring', stiffness: 260, damping: 32 },
            opacity: { duration: 0.3 },
            scale: { duration: 0.3 },
          }}
        >
          {/* chapter and progress */}
          <div className="flex items-center justify-between border-b border-line px-6 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="num text-[0.62rem] font-bold tracking-[0.2em] text-ember-700">
                0{chapterIndex + 1}
              </span>
              <span className="tele text-ink/70">{step.chapter}</span>
            </div>
            <button
              type="button"
              onClick={tour.stop}
              className="tele flex items-center gap-1.5 text-ink/62 transition-colors hover:text-ember-700"
            >
              SKIP <X className="h-3 w-3" strokeWidth={2.5} />
            </button>
          </div>

          <div className="px-6 pb-5 pt-5">
            <h2 className="display text-[1.45rem] leading-tight text-ink">{step.title}</h2>
            <p className="mt-3.5 text-[0.84rem] leading-relaxed text-ink/84">{step.body}</p>

            {step.points && (
              <ul className="mt-4 space-y-2 border-l-2 border-ember-500 pl-4">
                {step.points.map((pt) => (
                  <li key={pt} className="text-[0.78rem] leading-relaxed text-ink/76">
                    {pt}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* dots for this chapter */}
          <div className="flex items-center gap-1.5 px-6 pb-4">
            {chapterSteps.map((s, i) => (
              <span
                key={s.id}
                className={cn(
                  'h-1 flex-1 transition-colors',
                  i <= posInChapter ? 'bg-ember-500' : 'bg-line',
                )}
              />
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-line px-6 py-3.5">
            <span className="num text-[0.66rem] text-ink/62">
              {String(index + 1).padStart(2, '0')} / {total}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={tour.prev}
                disabled={index === 0}
                className="grid h-9 w-9 place-items-center border border-line text-ink/70 transition-colors hover:border-ember-500 hover:text-ink disabled:pointer-events-none disabled:opacity-35"
                aria-label="Previous step"
              >
                <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
              </button>
              <button
                type="button"
                onClick={tour.next}
                className="flex items-center gap-2.5 bg-ember-700 px-5 py-2.5 text-paper transition-colors hover:bg-ember-900"
              >
                <span className="tele font-bold">{isLast ? 'FINISH' : 'NEXT'}</span>
                {!isLast && <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  )
}
