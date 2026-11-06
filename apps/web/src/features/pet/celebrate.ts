// The pet dances once when all of today's missions are done (DECISIONS #80).
// daily.markDone() calls requestCelebration(); the pet shows it now if it is on screen, or the next time it appears.
import { bangkokDayKey } from '@/features/fortune/logic'

export const CELEBRATE_EVENT = 'thongyod:pet-celebrate'
const DUE = 'thongyod-pet-celebrate'
const SHOWN = 'thongyod-pet-celebrated'

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function requestCelebration(now: Date = new Date()): void {
  try {
    localStorage.setItem(DUE, bangkokDayKey(now))
  } catch {
    // Storage blocked: the pet still celebrates if it is on screen.
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CELEBRATE_EVENT))
}

/** A celebration for today that has not been shown yet. */
export function celebrationDue(now: Date = new Date()): boolean {
  const day = bangkokDayKey(now)
  return read(DUE) === day && read(SHOWN) !== day
}

export function markCelebrated(now: Date = new Date()): void {
  try {
    localStorage.setItem(SHOWN, bangkokDayKey(now))
  } catch {
    // ignore
  }
}
