// Per-game setup remembered on this phone (players, packs, minutes …). Never required: bad or missing data = defaults.
import { useEffect, useState } from 'react'

const PREFIX = 'thongyod-game-'

export function loadGameSettings<T extends object>(game: string, defaults: T, fix: (raw: Partial<T>) => T = (raw) => ({ ...defaults, ...raw })): T {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(PREFIX + game) ?? 'null')
    return value && typeof value === 'object' ? fix(value as Partial<T>) : defaults
  } catch {
    return defaults
  }
}

/** useState that is saved for next time. `fix` cleans what was saved (removed packs, out-of-range numbers). */
export function useGameSettings<T extends object>(game: string, defaults: T, fix?: (raw: Partial<T>) => T) {
  const [value, setValue] = useState<T>(() => loadGameSettings(game, defaults, fix))
  useEffect(() => {
    try {
      localStorage.setItem(PREFIX + game, JSON.stringify(value))
    } catch {
      // Not remembered; fine.
    }
  }, [game, value])
  return [value, setValue] as const
}
