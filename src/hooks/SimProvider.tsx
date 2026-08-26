import { createContext, useContext, type ReactNode } from 'react'
import { useSimClock } from './useSimClock'

type Sim = ReturnType<typeof useSimClock>

const SimContext = createContext<Sim | null>(null)

/**
 * One clock for the whole app so an intervention dispatched in the War Room
 * is visible in the Smart Guide the moment it goes out.
 */
export function SimProvider({ children }: { children: ReactNode }) {
  const sim = useSimClock()
  return <SimContext.Provider value={sim}>{children}</SimContext.Provider>
}

export function useSim(): Sim {
  const ctx = useContext(SimContext)
  if (!ctx) throw new Error('useSim must be used inside SimProvider')
  return ctx
}
