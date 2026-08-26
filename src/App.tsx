import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Nav } from '@/components/Nav'
import { SmoothScroll } from '@/components/SmoothScroll'
import { SimProvider } from '@/hooks/SimProvider'

const Overture = lazy(() => import('@/pages/Overture'))
const WarRoom = lazy(() => import('@/pages/WarRoom'))
const SmartGuide = lazy(() => import('@/pages/SmartGuide'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

function Booting() {
  return (
    <div className="grid min-h-screen place-items-center bg-paper">
      <div className="flex flex-col items-center gap-5">
        <span className="relative grid h-12 w-12 place-items-center">
          <span className="absolute inset-0 rounded-full border border-line" />
          <span
            className="absolute inset-0 rounded-full border border-transparent border-t-ember-500"
            style={{ animation: 'nexus-sweep 0.9s linear infinite' }}
          />
          <span className="h-1.5 w-1.5 rounded-full bg-ember-400" />
        </span>
        <span className="tele text-ink/42">ESTABLISHING LINK</span>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <SimProvider>
      <ScrollToTop />
      <SmoothScroll />
      <Nav />
      <main className="min-h-screen">
        <Suspense fallback={<Booting />}>
          <Routes>
            <Route path="/" element={<Overture />} />
            <Route path="/war-room" element={<WarRoom />} />
            <Route path="/guide" element={<SmartGuide />} />
            <Route path="*" element={<Overture />} />
          </Routes>
        </Suspense>
      </main>
      </SimProvider>
    </BrowserRouter>
  )
}
