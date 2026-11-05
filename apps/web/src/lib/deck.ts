// Game content without repeats: things seen on this phone (this visit AND earlier visits) come last,
// so a word only repeats after the whole pool has been seen (Earth: repeated words get boring).
import { secureRandomInt, shuffle } from './random'

const PREFIX = 'thongyod-seen-'
/** Remember at most this many seen items per game (old ones are forgotten first). */
export const SEEN_LIMIT = 1500

/** Fresh items first (shuffled), then seen ones (shuffled, oldest-seen first would be nicer but order is fair anyway). */
export function freshFirst<T>(items: readonly T[], keyOf: (item: T) => string, seen: ReadonlySet<string>, random: (max: number) => number = secureRandomInt): T[] {
  const byKey = new Map<string, T>()
  for (const item of items) {
    const key = keyOf(item).trim()
    if (key && !byKey.has(key)) byKey.set(key, item)
  }
  const fresh: T[] = []
  const old: T[] = []
  for (const [key, item] of byKey) (seen.has(key) ? old : fresh).push(item)
  return [...shuffle(fresh, random), ...shuffle(old, random)]
}

/** Add keys to a seen list, keeping the newest `limit`. When everything in the pool was seen, start over. */
export function addSeen(seen: readonly string[], keys: readonly string[], limit: number = SEEN_LIMIT): string[] {
  const set = new Set(seen)
  for (const k of keys) {
    set.delete(k)
    set.add(k)
  }
  const all = [...set]
  return all.slice(Math.max(0, all.length - limit))
}

export function loadSeen(game: string): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(PREFIX + game) ?? '[]')
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

export function saveSeen(game: string, seen: readonly string[]): void {
  try {
    localStorage.setItem(PREFIX + game, JSON.stringify(seen))
  } catch {
    // Storage full or blocked: repeats are possible, nothing breaks.
  }
}

/**
 * A deck for one game on this phone: `order(items)` gives the play order, `markSeen(keys)` records what was shown.
 * When the whole pool was seen, the seen list for that pool is cleared so the next order is a fresh shuffle.
 */
export function gameDeck(game: string) {
  return {
    order<T>(items: readonly T[], keyOf: (item: T) => string, random?: (max: number) => number): T[] {
      const seenList = loadSeen(game)
      const seen = new Set(seenList)
      const keys = items.map(keyOf)
      if (keys.length && keys.every((k) => seen.has(k))) {
        const pool = new Set(keys)
        saveSeen(game, seenList.filter((k) => !pool.has(k)))
        return freshFirst(items, keyOf, new Set(), random)
      }
      return freshFirst(items, keyOf, seen, random)
    },
    markSeen(keys: readonly string[]) {
      if (keys.length) saveSeen(game, addSeen(loadSeen(game), keys))
    },
  }
}
