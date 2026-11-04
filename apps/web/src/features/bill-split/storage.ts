// Bills are kept on this device (history). One small store so every page sees the same list.
import { useSyncExternalStore } from 'react'
import { isBill, type Bill } from './bill'

const KEY = 'thongyod-bills'
const LEGACY_KEY = 'thongyod-bill' // first version (single draft), no longer used
const MAX_BILLS = 100

let bills: Bill[] = load()
const listeners = new Set<() => void>()

function load(): Bill[] {
  try {
    localStorage.removeItem(LEGACY_KEY)
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isBill) : []
  } catch {
    return []
  }
}

function commit(next: Bill[]) {
  bills = next.slice(0, MAX_BILLS)
  try {
    localStorage.setItem(KEY, JSON.stringify(bills))
  } catch {
    // Storage blocked or full: keep working in memory for this visit.
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** All bills, newest first. */
export function useBills(): Bill[] {
  return useSyncExternalStore(subscribe, () => bills)
}

export function useBill(id: string | undefined): Bill | undefined {
  const all = useBills()
  return all.find((b) => b.id === id)
}

export function addBill(bill: Bill) {
  commit([bill, ...bills])
}

export function updateBill(id: string, change: (bill: Bill) => Bill) {
  commit(bills.map((b) => (b.id === id ? change(b) : b)))
}

export function deleteBill(id: string) {
  commit(bills.filter((b) => b.id !== id))
}
