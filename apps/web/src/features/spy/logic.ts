// สายลับ (spyfall / undercover style). Pure logic, tested in logic.test.ts.
import { secureRandomInt, shuffle } from '@/lib/random'

export type SpyMode = 'places' | 'pairs'
export const MIN_PLAYERS = 3
export const MAX_PLAYERS = 12
export const MINUTES = [3, 5, 8] as const
export type SpyMinutes = (typeof MINUTES)[number]

/** Most spies that still leave a fair game: 1 up to 5 players, 2 up to 8, then 3. */
export function maxSpies(players: number): number {
  return players <= 5 ? 1 : players <= 8 ? 2 : 3
}

export type SpyRound = {
  /** Player index (0-based) → is a spy. */
  spies: boolean[]
  /** What agents see (the place, or word A). */
  secret: string
  /** What spies see in pairs mode (word B); null in places mode. */
  spyWord: string | null
  /** Who asks the first question (0-based). */
  first: number
}

/**
 * Deal one round. Spies are chosen with the fair random source; in pairs mode the two words are
 * swapped half the time so the spy's word is not always the "second" one.
 */
export function dealSpy(
  { players, spies, mode, item }: { players: number; spies: number; mode: SpyMode; item: string | readonly [string, string] },
  random: (max: number) => number = secureRandomInt,
): SpyRound {
  const count = Math.max(1, Math.min(spies, maxSpies(players)))
  const order = shuffle(
    Array.from({ length: players }, (_, i) => i),
    random,
  )
  const spySet = new Set(order.slice(0, count))
  let secret: string
  let spyWord: string | null = null
  if (mode === 'pairs' && Array.isArray(item)) {
    const swap = random(2) === 1
    secret = swap ? item[1] : item[0]
    spyWord = swap ? item[0] : item[1]
  } else {
    secret = typeof item === 'string' ? item : item[0]
  }
  return { spies: Array.from({ length: players }, (_, i) => spySet.has(i)), secret, spyWord, first: random(players) }
}

export const clampPlayers = (n: number) => Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, Math.round(n) || MIN_PLAYERS))
