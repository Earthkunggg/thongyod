// สายลับ setup shared by one-phone play and rooms (many phones).
import { SPY_PAIRS, SPY_PLACES } from '@/config/games/spy'
import { MINUTES, clampPlayers, maxSpies, type SpyMinutes, type SpyMode } from './logic'

export type SpySettings = { players: number; spies: number; mode: SpyMode; places: string[]; pairs: string[]; minutes: SpyMinutes }

export const SPY_DEFAULTS: SpySettings = { players: 5, spies: 1, mode: 'places', places: SPY_PLACES.map((p) => p.id), pairs: SPY_PAIRS.map((p) => p.id), minutes: 5 }

export function fixSpySettings(raw: Partial<SpySettings>): SpySettings {
  const players = clampPlayers(raw.players ?? SPY_DEFAULTS.players)
  const places = (raw.places ?? []).filter((id) => SPY_PLACES.some((p) => p.id === id))
  const pairs = (raw.pairs ?? []).filter((id) => SPY_PAIRS.some((p) => p.id === id))
  return {
    players,
    spies: Math.max(1, Math.min(raw.spies ?? 1, maxSpies(players))),
    mode: raw.mode === 'pairs' ? 'pairs' : 'places',
    places: places.length ? places : SPY_DEFAULTS.places,
    pairs: pairs.length ? pairs : SPY_DEFAULTS.pairs,
    minutes: MINUTES.includes(raw.minutes as SpyMinutes) ? (raw.minutes as SpyMinutes) : 5,
  }
}

/** Content for one round from the chosen packs (one-phone and the room server use the same pools). */
export function spyPool(mode: SpyMode, packs: readonly string[]) {
  return mode === 'places'
    ? SPY_PLACES.filter((p) => packs.includes(p.id)).flatMap((p) => p.items)
    : SPY_PAIRS.filter((p) => packs.includes(p.id)).flatMap((p) => p.items)
}
