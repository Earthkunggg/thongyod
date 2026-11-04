// Bill split v2 (DECISIONS #53): jot what everyone orders while eating (price optional),
// then settle later: fill missing prices, pick who paid the shop, see who transfers to whom.
// Pure logic: no React, no DOM. Money in satang.

import { randomId } from '@/lib/id'
import { applyTreats, splitEqual } from './logic'

export const MAX_PEOPLE = 20
export const MAX_ENTRIES = 200
export const MAX_NAME_LENGTH = 20
export const MAX_ITEM_LENGTH = 40
export const MAX_TITLE_LENGTH = 40
export const MAX_QTY = 99

export type Person = { id: string; name: string; treated: boolean }

export type Entry = {
  id: string
  /** What was ordered, as typed. Same name (ignoring case/spaces) = same price. */
  name: string
  qty: number
  /** Person ids sharing it. Empty = everyone. */
  eaters: string[]
  /** Who paid for this entry. null = whoever paid the shop (bill.payerId). */
  payerId: string | null
}

export type Bill = {
  id: string
  title: string
  createdAt: string
  people: Person[]
  entries: Entry[]
  /** Unit price per item key (satang). */
  prices: Record<string, number>
  /** Who paid the shop. */
  payerId: string
  /** Transfers ticked as done, by Transfer.key. */
  settled: string[]
}

export function itemKey(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase()
}

/** Short random id (lib/id). Works on plain http too. */
export const newId = randomId

export function newBill(title: string, me: string, now: Date = new Date()): Bill {
  const meId = newId()
  return { id: newId(), title: title.slice(0, MAX_TITLE_LENGTH), createdAt: now.toISOString(), people: [{ id: meId, name: me, treated: false }], entries: [], prices: {}, payerId: meId, settled: [] }
}

// ---------- people ----------

export function addPerson(bill: Bill, name: string): Bill {
  const clean = name.trim().slice(0, MAX_NAME_LENGTH)
  if (!clean || bill.people.length >= MAX_PEOPLE) return bill
  return { ...bill, people: [...bill.people, { id: newId(), name: clean, treated: false }] }
}

export function renamePerson(bill: Bill, id: string, name: string): Bill {
  return { ...bill, people: bill.people.map((p) => (p.id === id ? { ...p, name: name.slice(0, MAX_NAME_LENGTH) } : p)) }
}

/** Treating everyone is not allowed: someone has to pay. */
export function canTreat(bill: Bill, id: string): boolean {
  const person = bill.people.find((p) => p.id === id)
  if (!person) return false
  if (person.treated) return true
  return bill.people.filter((p) => !p.treated).length > 1
}

export function toggleTreated(bill: Bill, id: string): Bill {
  if (!canTreat(bill, id)) return bill
  return { ...bill, people: bill.people.map((p) => (p.id === id ? { ...p, treated: !p.treated } : p)) }
}

/** Entries that only this person had; they go away with the person. */
export function soloEntries(bill: Bill, id: string): Entry[] {
  return bill.entries.filter((e) => e.eaters.length === 1 && e.eaters[0] === id)
}

export function removePerson(bill: Bill, id: string): Bill {
  if (bill.people.length <= 1 || !bill.people.some((p) => p.id === id)) return bill
  const people = bill.people.filter((p) => p.id !== id)
  const solo = new Set(soloEntries(bill, id).map((e) => e.id))
  const entries = bill.entries
    .filter((e) => !solo.has(e.id))
    .map((e) => ({ ...e, eaters: e.eaters.filter((x) => x !== id), payerId: e.payerId === id ? null : e.payerId }))
  return { ...bill, people, entries, payerId: bill.payerId === id ? people[0].id : bill.payerId }
}

// ---------- entries ----------

export type JotInput = { name: string; price: number | null; eaters: string[] }

/** Adds an order. The same item for the same people just adds 1 to the quantity. */
export function jot(bill: Bill, input: JotInput): Bill {
  const name = input.name.trim().replace(/\s+/g, ' ').slice(0, MAX_ITEM_LENGTH)
  if (!name) return bill
  const key = itemKey(name)
  const eaters = sortIds(bill, input.eaters)
  const prices = input.price === null ? bill.prices : { ...bill.prices, [key]: input.price }
  const same = bill.entries.find((e) => itemKey(e.name) === key && e.payerId === null && sameIds(e.eaters, eaters))
  if (same) return { ...bill, prices, entries: bill.entries.map((e) => (e.id === same.id ? { ...e, qty: Math.min(MAX_QTY, e.qty + 1) } : e)) }
  if (bill.entries.length >= MAX_ENTRIES) return bill
  return { ...bill, prices, entries: [...bill.entries, { id: newId(), name, qty: 1, eaters, payerId: null }] }
}

/** +1 / −1 on an entry; reaching 0 removes it. */
export function bumpEntry(bill: Bill, id: string, delta: number): Bill {
  const entries = bill.entries
    .map((e) => (e.id === id ? { ...e, qty: Math.min(MAX_QTY, e.qty + delta) } : e))
    .filter((e) => e.qty > 0)
  return { ...bill, entries }
}

export function updateEntry(bill: Bill, id: string, patch: Partial<Omit<Entry, 'id'>>): Bill {
  return {
    ...bill,
    entries: bill.entries.map((e) =>
      e.id === id
        ? {
            ...e,
            ...patch,
            name: (patch.name ?? e.name).slice(0, MAX_ITEM_LENGTH),
            qty: Math.max(1, Math.min(MAX_QTY, patch.qty ?? e.qty)),
            eaters: patch.eaters ? sortIds(bill, patch.eaters) : e.eaters,
          }
        : e,
    ),
  }
}

export function removeEntry(bill: Bill, id: string): Bill {
  return { ...bill, entries: bill.entries.filter((e) => e.id !== id) }
}

export function setPrice(bill: Bill, key: string, price: number | null): Bill {
  const prices = { ...bill.prices }
  if (price === null) delete prices[key]
  else prices[key] = price
  return { ...bill, prices }
}

export function priceOf(bill: Bill, entry: Entry): number | null {
  return bill.prices[itemKey(entry.name)] ?? null
}

export type PriceGroup = { key: string; name: string; qty: number; price: number | null }

/** One row per menu item (for "เติมราคา"), in the order they were first jotted (stable while typing prices). */
export function priceGroups(bill: Bill): PriceGroup[] {
  const groups = new Map<string, PriceGroup>()
  for (const e of bill.entries) {
    const key = itemKey(e.name)
    const g = groups.get(key)
    if (g) g.qty += e.qty
    else groups.set(key, { key, name: e.name, qty: e.qty, price: bill.prices[key] ?? null })
  }
  return [...groups.values()]
}

/** Names used in this bill, newest first, for one-tap re-ordering. */
export function recentNames(bill: Bill, limit = 8): string[] {
  const seen = new Set<string>()
  const names: string[] = []
  for (let i = bill.entries.length - 1; i >= 0 && names.length < limit; i--) {
    const key = itemKey(bill.entries[i].name)
    if (!seen.has(key)) {
      seen.add(key)
      names.push(bill.entries[i].name)
    }
  }
  return names
}

// ---------- settlement ----------

export type Transfer = { from: string; to: string; amount: number; key: string }

export type Settlement = {
  /** Sum of all priced entries. */
  total: number
  /** What each person consumed (after treats). */
  consumed: Record<string, number>
  paid: Record<string, number>
  transfers: Transfer[]
  /** Rounding: transfers are rounded up to whole baht; this is the sum of what receivers get on top. */
  extra: number
  /** Menu items still without a price (not counted yet). */
  unpriced: number
  /** What each person had, per item name, in satang (before treats). */
  portions: Record<string, { name: string; amount: number }[]>
}

export function settle(bill: Bill): Settlement {
  const ids = bill.people.map((p) => p.id)
  const index = new Map(ids.map((id, i) => [id, i]))
  const consumedArr = ids.map(() => 0)
  const paid: Record<string, number> = Object.fromEntries(ids.map((id) => [id, 0]))
  const portions: Record<string, { name: string; amount: number }[]> = Object.fromEntries(ids.map((id) => [id, []]))
  const shopPayer = index.has(bill.payerId) ? bill.payerId : ids[0]
  let total = 0
  const unpricedKeys = new Set<string>()

  bill.entries.forEach((entry, k) => {
    const eaters = entry.eaters.filter((id) => index.has(id))
    const sharers = eaters.length > 0 ? sortIds(bill, eaters) : ids
    const price = priceOf(bill, entry)
    if (price === null) {
      unpricedKeys.add(itemKey(entry.name))
      return
    }
    const cost = price * entry.qty
    total += cost
    splitEqual(cost, sharers.length, k % sharers.length).forEach((part, j) => {
      consumedArr[index.get(sharers[j])!] += part
      const mine = portions[sharers[j]]
      const same = mine.find((p) => itemKey(p.name) === itemKey(entry.name))
      if (same) same.amount += part
      else mine.push({ name: entry.name, amount: part })
    })
    const payer = entry.payerId && index.has(entry.payerId) ? entry.payerId : shopPayer
    paid[payer] += cost
  })

  const treated = bill.people.flatMap((p, i) => (p.treated ? [i] : []))
  const afterTreats = treated.length > 0 && treated.length < ids.length ? applyTreats(consumedArr, treated) : consumedArr
  const consumed: Record<string, number> = Object.fromEntries(ids.map((id, i) => [id, afterTreats[i]]))
  const net = ids.map((id, i) => paid[id] - afterTreats[i])
  const transfers = minimalTransfers(ids, net)
  const extra = transfers.reduce((sum, t) => sum + t.amount, 0) - transfers.reduce((sum, t) => sum + t.exact, 0)
  return {
    total,
    consumed,
    paid,
    transfers: transfers.map(({ from, to, amount }) => ({ from, to, amount, key: `${from}>${to}:${amount}` })),
    extra,
    unpriced: unpricedKeys.size,
    portions,
  }
}

/**
 * Fewest transfers that settle everyone (greedy: biggest debtor pays biggest creditor).
 * Amounts are rounded UP to whole baht (user decision); `exact` keeps the satang value.
 */
export function minimalTransfers(ids: string[], net: number[]): { from: string; to: string; amount: number; exact: number }[] {
  const debtors = ids.map((id, i) => ({ id, i, left: -net[i] })).filter((d) => d.left > 0)
  const creditors = ids.map((id, i) => ({ id, i, left: net[i] })).filter((c) => c.left > 0)
  const byLeft = (a: { left: number; i: number }, b: { left: number; i: number }) => b.left - a.left || a.i - b.i
  const out: { from: string; to: string; amount: number; exact: number }[] = []
  while (debtors.length > 0 && creditors.length > 0) {
    debtors.sort(byLeft)
    creditors.sort(byLeft)
    const d = debtors[0]
    const c = creditors[0]
    const exact = Math.min(d.left, c.left)
    out.push({ from: d.id, to: c.id, exact, amount: Math.ceil(exact / 100) * 100 })
    d.left -= exact
    c.left -= exact
    if (d.left === 0) debtors.shift()
    if (c.left === 0) creditors.shift()
  }
  return out
}

export type BillStatus = 'jotting' | 'waiting' | 'cleared'

export function billStatus(bill: Bill, s: Settlement = settle(bill)): { status: BillStatus; waiting: number } {
  const waiting = s.transfers.filter((t) => !bill.settled.includes(t.key)).length
  if (bill.entries.length === 0 || s.unpriced > 0) return { status: 'jotting', waiting }
  if (waiting > 0) return { status: 'waiting', waiting }
  return { status: 'cleared', waiting: 0 }
}

export function toggleSettled(bill: Bill, key: string): Bill {
  return { ...bill, settled: bill.settled.includes(key) ? bill.settled.filter((k) => k !== key) : [...bill.settled, key] }
}

// ---------- storage shape check ----------

export function isBill(value: unknown): value is Bill {
  if (!value || typeof value !== 'object') return false
  const b = value as Bill
  const str = (x: unknown) => typeof x === 'string'
  if (!str(b.id) || !str(b.title) || !str(b.createdAt) || !str(b.payerId)) return false
  if (!Array.isArray(b.people) || b.people.length < 1 || !b.people.every((p) => str(p?.id) && str(p.name) && typeof p.treated === 'boolean')) return false
  if (!Array.isArray(b.settled) || !b.settled.every(str)) return false
  if (!b.prices || typeof b.prices !== 'object' || !Object.values(b.prices).every((v) => Number.isSafeInteger(v) && v >= 0)) return false
  return (
    Array.isArray(b.entries) &&
    b.entries.every(
      (e) => str(e?.id) && str(e.name) && Number.isInteger(e.qty) && e.qty >= 1 && Array.isArray(e.eaters) && e.eaters.every(str) && (e.payerId === null || str(e.payerId)),
    )
  )
}

function sortIds(bill: Bill, ids: string[]): string[] {
  const order = new Map(bill.people.map((p, i) => [p.id, i]))
  return [...new Set(ids)].filter((id) => order.has(id)).sort((a, b) => order.get(a)! - order.get(b)!)
}

function sameIds(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i])
}
