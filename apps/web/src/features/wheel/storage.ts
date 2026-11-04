// Remembers the last wheel options on this device (a convenience; losing it is harmless).
import { normalizeOptions } from './logic'

const KEY = 'thongyod-wheel'

export function loadOptions(): string[] | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed) || !parsed.every((o) => typeof o === 'string')) return null
    return normalizeOptions(parsed)
  } catch {
    return null
  }
}

export function saveOptions(options: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(options))
  } catch {
    // Storage blocked (private mode): the wheel still works.
  }
}
