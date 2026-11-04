// Today's fortune stick + a short history, kept on this device (one draw per day).
import { addToHistory, isStickNo, type Draw } from './logic'

const KEY = 'thongyod-fortune'
const HISTORY_KEY = 'thongyod-fortune-history'

export function loadDraw(): Draw | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const d = JSON.parse(raw) as Draw
    return typeof d?.day === 'string' && isStickNo(d.stick) ? d : null
  } catch {
    return null
  }
}

/** Past draws, newest first (includes today's once drawn). Older devices only had today's draw: it is included. */
export function loadHistory(): Draw[] {
  let list: Draw[] = []
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')
    if (Array.isArray(parsed)) list = parsed.filter((d): d is Draw => typeof d?.day === 'string' && isStickNo(d?.stick))
  } catch {
    list = []
  }
  const today = loadDraw()
  return today ? addToHistory(list, today) : list
}

export function saveDraw(draw: Draw): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(draw))
    localStorage.setItem(HISTORY_KEY, JSON.stringify(addToHistory(loadHistory(), draw)))
  } catch {
    // Storage blocked: the fortune still shows, it just is not kept for the day.
  }
}
