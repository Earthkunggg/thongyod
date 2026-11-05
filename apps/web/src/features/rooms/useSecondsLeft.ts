import { useEffect, useState } from 'react'

/** Whole seconds until `iso` (0 when past), updated every 250 ms. Server time decides the end on every phone. */
export function useSecondsLeft(iso: string | null): number {
  const calc = () => (iso ? Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 1000)) : 0)
  const [left, setLeft] = useState(calc)
  useEffect(() => {
    const tick = () => setLeft(iso ? Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 1000)) : 0)
    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [iso])
  return left
}
