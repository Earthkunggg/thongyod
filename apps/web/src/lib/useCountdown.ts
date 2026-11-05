import { useEffect, useRef, useState } from 'react'

/**
 * Whole seconds left of a timer that can pause. Counts from wall-clock time, so a phone that sleeps
 * or a slow tab still ends on time. Calls `onEnd` once at 0.
 */
export function useCountdown(totalSeconds: number, running: boolean, onEnd?: () => void) {
  const [left, setLeft] = useState(totalSeconds)
  /** Bumped by reset() so the timer restarts even if it had ended. */
  const [generation, setGeneration] = useState(0)
  const endAt = useRef<number | null>(null)
  const leftRef = useRef(totalSeconds)
  const ended = useRef(false)
  const endHandler = useRef(onEnd)

  useEffect(() => {
    endHandler.current = onEnd
  })

  useEffect(() => {
    if (!running || ended.current) {
      endAt.current = null
      return
    }
    endAt.current = Date.now() + leftRef.current * 1000
    const id = window.setInterval(() => {
      const next = Math.max(0, Math.ceil(((endAt.current ?? Date.now()) - Date.now()) / 1000))
      leftRef.current = next
      setLeft(next)
      if (next === 0 && !ended.current) {
        ended.current = true
        window.clearInterval(id)
        endHandler.current?.()
      }
    }, 250)
    return () => window.clearInterval(id)
  }, [running, generation])

  /** Start again from `seconds` (default the total). */
  function reset(seconds = totalSeconds) {
    ended.current = false
    leftRef.current = seconds
    setLeft(seconds)
    setGeneration((g) => g + 1)
  }

  return { left, reset }
}
