// Bill split money helpers. Pure logic: no React, no DOM.
// All money is in satang (integer, 1 baht = 100 satang) so sums are always exact.

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

function assertMoney(amount: number) {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new Error(`amount must be a non-negative integer (satang), got ${amount}`)
}

function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i)
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m
}
