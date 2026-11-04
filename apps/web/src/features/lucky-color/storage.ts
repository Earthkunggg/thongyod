// Birth weekday for personal lucky colors. Private: kept only on this device, never shown to others (spec §15).
import { TAKSA_ORDER, type TaksaDay } from './taksa'

const KEY = 'thongyod-birth-day'

export function loadBirthDay(): TaksaDay | null {
  try {
    const v = localStorage.getItem(KEY)
    return TAKSA_ORDER.includes(v as TaksaDay) ? (v as TaksaDay) : null
  } catch {
    return null
  }
}

export function saveBirthDay(day: TaksaDay | null): void {
  try {
    if (day) localStorage.setItem(KEY, day)
    else localStorage.removeItem(KEY)
  } catch {
    // Storage blocked: works for this visit.
  }
}
