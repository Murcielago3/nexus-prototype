import createGlobe from 'cobe'
import { useEffect, useRef, useState } from 'react'
import { NETWORK_CITIES } from '@/data/city'
import { cn } from '@/lib/utils'

/**
 * Interactive globe. Drag to spin, releases back into a slow idle
 * rotation. Markers are the host city network, sized by weight.
 */
export function Globe({
  className,
  size = 640,
  autoRotate = true,
}: {
  className?: string
  size?: number
  autoRotate?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointerInteracting = useRef<number | null>(null)
  const pointerMovement = useRef(0)
  const phiRef = useRef(4.1)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let width = canvas.offsetWidth || size
    const theta = 0.22
    let raf = 0

    const onResize = () => {
      width = canvas.offsetWidth || size
    }
    window.addEventListener('resize', onResize)

    const globe = createGlobe(canvas, {
      devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      width: width * 2,
      height: width * 2,
      phi: phiRef.current,
      theta,
      // light globe: a paper coloured sphere with the landmass dotted in ember
      dark: 0,
      diffuse: 0.42,
      mapSamples: 17000,
      mapBrightness: 1.25,
      baseColor: [0.996, 0.965, 0.933],
      markerColor: [0.91, 0.365, 0.063],
      glowColor: [0.965, 0.855, 0.733],
      opacity: 0.92,
      markers: NETWORK_CITIES.map((c) => ({
        location: [c.lat, c.lng] as [number, number],
        size: 0.026 + c.weight * 0.062,
      })),
    })

    // cobe v2 dropped onRender, so the idle spin is driven from here
    const frame = () => {
      if (autoRotate && pointerInteracting.current === null) {
        phiRef.current += 0.0026
      }
      globe.update({
        phi: phiRef.current + pointerMovement.current,
        theta,
        width: width * 2,
        height: width * 2,
      })
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    // fade the canvas in once the first frame has painted
    const fade = setTimeout(() => {
      canvas.style.opacity = '1'
    }, 90)

    return () => {
      cancelAnimationFrame(raf)
      globe.destroy()
      clearTimeout(fade)
      window.removeEventListener('resize', onResize)
    }
  }, [size, autoRotate])

  return (
    <div className={cn('relative select-none', className)} style={{ aspectRatio: '1' }}>
      {/* orbital rings and reticle, purely decorative */}
      <svg
        viewBox="0 0 100 100"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id="ring-a" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-ember-500)" stopOpacity="0.42" />
            <stop offset="55%" stopColor="var(--color-ember-400)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="var(--color-ember-500)" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48.4" fill="none" stroke="url(#ring-a)" strokeWidth="0.22" />
        <circle
          cx="50"
          cy="50"
          r="44.2"
          fill="none"
          stroke="var(--color-line-strong)"
          strokeWidth="0.18"
          strokeDasharray="1.4 2.6"
        />
        <g style={{ transformOrigin: '50px 50px', animation: 'nexus-sweep 44s linear infinite' }}>
          <circle
            cx="50"
            cy="50"
            r="48.4"
            fill="none"
            stroke="var(--color-ember-400)"
            strokeWidth="0.5"
            strokeDasharray="7 296"
            strokeLinecap="round"
          />
        </g>
        <g style={{ transformOrigin: '50px 50px', animation: 'nexus-sweep 70s linear infinite reverse' }}>
          <circle
            cx="50"
            cy="50"
            r="44.2"
            fill="none"
            stroke="var(--color-ember-500)"
            strokeWidth="0.35"
            strokeDasharray="3 274"
            strokeLinecap="round"
          />
        </g>
        {/* crosshair ticks */}
        {[0, 90, 180, 270].map((deg) => (
          <line
            key={deg}
            x1="50"
            y1="1.2"
            x2="50"
            y2="4.4"
            stroke="var(--color-ember-500)"
            strokeWidth="0.35"
            style={{ transformOrigin: '50px 50px', transform: 'rotate(' + deg + 'deg)' }}
          />
        ))}
      </svg>

      <canvas
        ref={canvasRef}
        onPointerDown={(e) => {
          pointerInteracting.current = e.clientX - pointerMovement.current
          setDragging(true)
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerUp={() => {
          pointerInteracting.current = null
          setDragging(false)
        }}
        onPointerOut={() => {
          pointerInteracting.current = null
          setDragging(false)
        }}
        onPointerMove={(e) => {
          if (pointerInteracting.current !== null) {
            const delta = e.clientX - pointerInteracting.current
            pointerMovement.current = delta * 0.006
          }
        }}
        className="absolute inset-[6%] h-[88%] w-[88%] opacity-0 transition-opacity duration-1000"
        style={{
          contain: 'layout paint size',
          cursor: dragging ? 'grabbing' : 'grab',
        }}
      />
    </div>
  )
}
