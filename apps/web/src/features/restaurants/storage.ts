// My pinned restaurants, kept on this device (first version: private only; Gang/Public pins need the backend, spec §8.7).
import { useSyncExternalStore } from 'react'
import { randomId } from '@/lib/id'
import { BUDGETS, CATEGORIES, NAME_MAX, NOTE_MAX, RESTAURANTS_MAX, type Budget, type Category, type Restaurant } from './logic'

const KEY = 'thongyod-restaurants'
const listeners = new Set<() => void>()

function clean(value: unknown): Restaurant | null {
  const r = value as Restaurant
  if (typeof r?.id !== 'string' || typeof r.name !== 'string' || !CATEGORIES.includes(r.category)) return null
  const name = r.name.trim().slice(0, NAME_MAX)
  if (!name) return null
  return {
    id: r.id,
    name,
    category: r.category,
    budget: BUDGETS.includes(r.budget as Budget) ? (r.budget as Budget) : null,
    note: typeof r.note === 'string' ? r.note.slice(0, NOTE_MAX) : '',
    visits: Number.isInteger(r.visits) && r.visits > 0 ? r.visits : 0,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date(0).toISOString(),
  }
}

function read(): Restaurant[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.map(clean).filter((r): r is Restaurant => r !== null).slice(0, RESTAURANTS_MAX) : []
  } catch {
    return []
  }
}

let list = read()

function write(next: Restaurant[]) {
  list = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Storage blocked: lasts until the page closes.
  }
  listeners.forEach((l) => l())
}

export function useRestaurants(): Restaurant[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => list,
  )
}

export function upsertRestaurant(input: { id?: string; name: string; category: Category; budget: Budget | null; note: string }): void {
  const existing = input.id ? list.find((r) => r.id === input.id) : undefined
  const next = clean({ visits: 0, createdAt: new Date().toISOString(), ...existing, ...input, id: input.id ?? randomId() })
  if (!next) return
  write(existing ? list.map((r) => (r.id === next.id ? next : r)) : [next, ...list].slice(0, RESTAURANTS_MAX))
}

export function removeRestaurant(id: string): Restaurant | undefined {
  const removed = list.find((r) => r.id === id)
  write(list.filter((r) => r.id !== id))
  return removed
}

/** Put a removed restaurant back (undo). */
export function restoreRestaurant(r: Restaurant): void {
  if (!list.some((x) => x.id === r.id)) write([r, ...list])
}

export function markVisited(id: string): void {
  write(list.map((r) => (r.id === id ? { ...r, visits: r.visits + 1 } : r)))
}
