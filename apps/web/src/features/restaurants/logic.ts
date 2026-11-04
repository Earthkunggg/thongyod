// สุ่มร้าน (spec §8, M3 first version): only restaurants the user pinned themselves, no Google.
// Pure logic, tested. Rounds follow spec §8.4 exactly.
import { secureRandomInt } from '@/lib/random'

export const NAME_MAX = 40
export const NOTE_MAX = 80
export const RESTAURANTS_MAX = 300

export type Group = 'savory' | 'dessert' | 'drinks'
export const GROUPS: readonly Group[] = ['savory', 'dessert', 'drinks']

/** Spec §8.2 Thai types. */
export type Category = 'tamsang' | 'noodles' | 'chickenRice' | 'somtam' | 'mookata' | 'shabu' | 'grill' | 'cafe' | 'bakery' | 'dessert' | 'chill'
export const CATEGORY_GROUP: Record<Category, Group> = {
  tamsang: 'savory',
  noodles: 'savory',
  chickenRice: 'savory',
  somtam: 'savory',
  mookata: 'savory',
  shabu: 'savory',
  grill: 'savory',
  cafe: 'drinks',
  chill: 'drinks',
  bakery: 'dessert',
  dessert: 'dessert',
}
export const CATEGORIES = Object.keys(CATEGORY_GROUP) as Category[]

/** Budget per person (spec §8.2). null = price unknown. */
export type Budget = 'le60' | 'b61to150' | 'b151to300' | 'gt300'
export const BUDGETS: readonly Budget[] = ['le60', 'b61to150', 'b151to300', 'gt300']

export type Restaurant = {
  id: string
  name: string
  category: Category
  budget: Budget | null
  note: string
  /** Times I said "ไปร้านนี้" (for "ลองร้านใหม่"). */
  visits: number
  createdAt: string
}

export type Filters = { groups: Group[]; categories: Category[]; budgets: Budget[]; includeUnknownPrice: boolean; onlyNew: boolean }
export const NO_FILTERS: Filters = { groups: [], categories: [], budgets: [], includeUnknownPrice: true, onlyNew: false }

/** Empty list = no limit for that filter. */
export function applyFilters(list: readonly Restaurant[], f: Filters): Restaurant[] {
  return list.filter((r) => {
    if (f.groups.length > 0 && !f.groups.includes(CATEGORY_GROUP[r.category])) return false
    if (f.categories.length > 0 && !f.categories.includes(r.category)) return false
    if (f.budgets.length > 0) {
      if (r.budget === null ? !f.includeUnknownPrice : !f.budgets.includes(r.budget)) return false
    } else if (r.budget === null && !f.includeUnknownPrice) return false
    if (f.onlyNew && r.visits > 0) return false
    return true
  })
}

/** Same filters → same key. A new key = a new round (spec §8.4: changing filters starts a new round). */
export function filterKey(f: Filters): string {
  const sorted = (xs: readonly string[]) => [...xs].sort().join(',')
  return [sorted(f.groups), sorted(f.categories), sorted(f.budgets), f.includeUnknownPrice ? 'u1' : 'u0', f.onlyNew ? 'n1' : 'n0'].join('|')
}

/** One round: who was already shown (no repeats inside a round) and who was excluded. */
export type Round = { key: string; shown: string[]; excluded: string[] }

export const newRound = (key: string): Round => ({ key, shown: [], excluded: [] })

export type Draw = { kind: 'picked'; id: string; round: Round } | { kind: 'exhausted' } | { kind: 'empty' }

/**
 * Next pick of a round. Never repeats inside the round, never picks an excluded place.
 * empty = nothing matches the filters (the UI asks; it never widens filters by itself).
 * exhausted = every candidate was shown (the UI offers a new round or other filters).
 */
export function drawNext(candidates: readonly Restaurant[], round: Round, random: (max: number) => number = secureRandomInt): Draw {
  if (candidates.length === 0) return { kind: 'empty' }
  const left = candidates.filter((r) => !round.shown.includes(r.id) && !round.excluded.includes(r.id))
  if (left.length === 0) return { kind: 'exhausted' }
  const pick = left[random(left.length)]
  return { kind: 'picked', id: pick.id, round: { ...round, shown: [...round.shown, pick.id] } }
}

/** "ไม่เอาร้านนี้": out for this round and the rounds after it on this screen. */
export function exclude(round: Round, id: string): Round {
  return round.excluded.includes(id) ? round : { ...round, excluded: [...round.excluded, id] }
}

/** Start the same filters again: shown resets, excluded places stay out. */
export function restart(round: Round): Round {
  return { ...round, shown: [] }
}

/** Candidates still possible in this round (for the "เหลือ n ร้าน" line). */
export function remaining(candidates: readonly Restaurant[], round: Round): number {
  return candidates.filter((r) => !round.shown.includes(r.id) && !round.excluded.includes(r.id)).length
}
