import { motion, useScroll, useTransform } from 'motion/react'
import { NavLink, useLocation } from 'react-router-dom'
import { HOST_CITY } from '@/data/city'
import { cn } from '@/lib/utils'

const LINKS = [
  { to: '/', label: 'OVERVIEW' },
  { to: '/war-room', label: 'WAR ROOM' },
  { to: '/guide', label: 'SMART GUIDE' },
]

export function Mark({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span className="relative grid h-7 w-7 place-items-center">
        <span className="absolute inset-0 rounded-full border border-ember-500/70" />
        <span
          className="absolute inset-[3px] rounded-full border border-ember-400"
          style={{ animation: 'nexus-pulse 3.2s ease-in-out infinite' }}
        />
        <span className="h-1.5 w-1.5 rounded-full bg-ember-500" />
      </span>
      <span className="display text-[1.05rem] tracking-[0.24em] text-ink">NEXUS</span>
    </span>
  )
}

export function Nav() {
  const { scrollY } = useScroll()
  const location = useLocation()
  const onLanding = location.pathname === '/'

  const bg = useTransform(
    scrollY,
    [0, 140],
    ['rgba(253,246,238,0)', 'rgba(253,246,238,0.92)'],
  )
  const border = useTransform(scrollY, [0, 140], ['rgba(236,213,187,0)', 'rgba(236,213,187,1)'])

  return (
    <motion.header
      style={onLanding ? { backgroundColor: bg, borderColor: border } : undefined}
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b backdrop-blur-md',
        !onLanding && 'border-line bg-paper/92',
      )}
    >
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-8 px-5 sm:px-8">
        <NavLink to="/" className="shrink-0">
          <Mark />
        </NavLink>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                cn(
                  'tele relative px-3 py-2 transition-colors',
                  isActive ? 'text-ember-500' : 'text-ink/55 hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {l.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-2 -bottom-px h-px bg-ember-500"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-5">
          <span className="tele hidden text-ink/42 lg:inline">
            {HOST_CITY.name} · {HOST_CITY.country}
          </span>
          <span className="flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full bg-ember-500"
              style={{ animation: 'nexus-blink 1.6s steps(1,end) infinite' }}
            />
            <span className="tele text-ember-500">LIVE</span>
          </span>
        </div>
      </div>
    </motion.header>
  )
}
