// ใบ้บนหัว settings and best scores, kept on this device.
import type { RoundSeconds } from './logic'

const KEY = 'thongyod-heads-up'

export type HeadsUpSaved = {
  pack: string
  seconds: RoundSeconds
  useTilt: boolean
  inverted: boolean
  sound: boolean
  /** pack id → best score. */
  best: Record<string, number>
}

export const DEFAULT_SAVED: HeadsUpSaved = { pack: 'food', seconds: 60, useTilt: true, inverted: false, sound: true, best: {} }

export function loadHeadsUp(): HeadsUpSaved {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<HeadsUpSaved>
    const best: Record<string, number> = {}
    for (const [k, n] of Object.entries(v.best ?? {})) if (Number.isInteger(n) && n >= 0) best[k] = n
    return {
      pack: typeof v.pack === 'string' ? v.pack : DEFAULT_SAVED.pack,
      seconds: v.seconds === 90 ? 90 : 60,
      useTilt: typeof v.useTilt === 'boolean' ? v.useTilt : DEFAULT_SAVED.useTilt,
      inverted: v.inverted === true,
      sound: typeof v.sound === 'boolean' ? v.sound : DEFAULT_SAVED.sound,
      best,
    }
  } catch {
    return DEFAULT_SAVED
  }
}

export function saveHeadsUp(value: HeadsUpSaved): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(value))
  } catch {
    // Storage blocked: settings last for this visit only.
  }
}
