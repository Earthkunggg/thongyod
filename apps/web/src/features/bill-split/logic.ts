// Quick bill split (single device). Pure logic: no React, no DOM.
// All money is in satang (integer, 1 baht = 100 satang) so sums are always exact.
// Decisions (DECISIONS #50): two modes (equal / by item), no service charge or VAT, everyone rounds UP to
// whole baht and the payer keeps the extra, "เลี้ยง" (treat) = that person pays nothing and the others share it.
// PromptPay QR: not built yet (later round).

export const MIN_PEOPLE = 2
export const MAX_PEOPLE = 20
export const MAX_ITEMS = 50
export const MAX_NAME_LENGTH = 20

export type Item = {
  name: string
  /** Price in satang. */
  price: number
  /** Indexes of the people who share this item. Empty = everyone. */
  eaters: number[]
}

export type SplitInput =
  | { mode: 'equal'; people: number; total: number; treated?: number[] }
  | { mode: 'items'; people: number; items: Item[]; treated?: number[] }

export type SplitResult = {
  /** The bill (sum of items, or the total typed in). */
  total: number
  /** Exact share of each person before rounding. */
  exact: number[]
  /** What each person pays, rounded up to whole baht. */
  amounts: number[]
  /** Rounding extra the payer receives on top of the bill. */
  extra: number
}

/** Baht text from the form → satang. Accepts "120", "120.5", "1,250.75". Returns null if invalid. */
export function parseBaht(text: string): number | null {
  const clean = text.replace(/,/g, '').trim()
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(clean)) return null
  const [whole, frac = ''] = clean.split('.')
  return Number(whole) * 100 + Number(frac.padEnd(2, '0'))
}

/**
 * Split an amount into `n` parts that differ by at most 1 satang and add up exactly.
 * Extra satang go to the parts starting at `start` (rotate it so the same person is not always charged more).
 */
export function splitEqual(amount: number, n: number, start = 0): number[] {
  assertMoney(amount)
  if (!Number.isInteger(n) || n < 1) throw new Error(`n must be a positive integer, got ${n}`)
  const base = Math.floor(amount / n)
  const extra = amount - base * n
  return Array.from({ length: n }, (_, i) => base + (mod(i - start, n) < extra ? 1 : 0))
}

/** What each person ate: every item is shared equally by its eaters. */
export function shareItems(items: Item[], people: number): number[] {
  assertPeople(people)
  const food = new Array<number>(people).fill(0)
  items.forEach((item, k) => {
    assertMoney(item.price)
    const eaters = item.eaters.length > 0 ? [...new Set(item.eaters)].sort((a, b) => a - b) : range(people)
    if (eaters.some((p) => !Number.isInteger(p) || p < 0 || p >= people)) throw new Error('eater out of range')
    // Rotate who gets the odd satang per item, so it spreads out.
    splitEqual(item.price, eaters.length, k % eaters.length).forEach((part, j) => {
      food[eaters[j]] += part
    })
  })
  return food
}

/** "เลี้ยง": treated people pay 0; their shares are split equally among everyone else. */
export function applyTreats(shares: number[], treated: number[]): number[] {
  const set = new Set(treated)
  if ([...set].some((p) => !Number.isInteger(p) || p < 0 || p >= shares.length)) throw new Error('treated out of range')
  const payers = range(shares.length).filter((i) => !set.has(i))
  if (payers.length === 0) throw new Error('someone has to pay')
  const moved = [...set].reduce((sum, i) => sum + shares[i], 0)
  const parts = splitEqual(moved, payers.length)
  const result = shares.map((s, i) => (set.has(i) ? 0 : s))
  payers.forEach((p, j) => {
    result[p] += parts[j]
  })
  return result
}

/** Everyone pays whole baht, rounded up. `extra` = what the payer receives on top. */
export function roundUpToBaht(shares: number[]): { amounts: number[]; extra: number } {
  const amounts = shares.map((a) => Math.ceil(a / 100) * 100)
  return { amounts, extra: sum(amounts) - sum(shares) }
}

export function computeSplit(input: SplitInput): SplitResult {
  assertPeople(input.people)
  const base = input.mode === 'equal' ? splitEqual(input.total, input.people) : shareItems(input.items, input.people)
  const total = input.mode === 'equal' ? input.total : sum(base)
  const exact = input.treated?.length ? applyTreats(base, input.treated) : base
  const { amounts, extra } = roundUpToBaht(exact)
  return { total, exact, amounts, extra }
}

/** Items no one picked yet are shared by everyone; this tells the UI which ones to highlight. */
export function unassignedItems(items: Item[]): number[] {
  return items.flatMap((item, i) => (item.eaters.length === 0 ? [i] : []))
}

function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0)
}

function assertMoney(amount: number) {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new Error(`amount must be a non-negative integer (satang), got ${amount}`)
}

function assertPeople(people: number) {
  if (!Number.isInteger(people) || people < 1 || people > MAX_PEOPLE) throw new Error(`people out of range: ${people}`)
}

function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i)
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m
}
