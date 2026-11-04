// Today's fortune stick, kept on this device (one draw per day).
import { isStickNo, type Draw } from './logic'

const KEY = 'thongyod-fortune'

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

export function saveDraw(draw: Draw): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(draw))
  } catch {
    // Storage blocked: the fortune still shows, it just is not kept for the day.
  }
}
