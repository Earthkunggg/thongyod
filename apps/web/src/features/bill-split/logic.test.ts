import { describe, expect, it } from 'vitest'
import { applyTreats, computeSplit, parseBaht, roundUpToBaht, shareItems, splitEqual, unassignedItems } from './logic'

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const item = (price: number, eaters: number[] = []) => ({ name: '', price, eaters })

describe('parseBaht', () => {
  it('reads baht text as satang', () => {
    expect(parseBaht('120')).toBe(12000)
    expect(parseBaht('120.5')).toBe(12050)
    expect(parseBaht('1,250.75')).toBe(125075)
    expect(parseBaht(' 0.01 ')).toBe(1)
  })
  it('rejects bad text', () => {
    for (const bad of ['', 'abc', '-5', '1.234', '1e3', '12345678']) expect(parseBaht(bad)).toBe(null)
  })
})

describe('splitEqual', () => {
  it('adds up exactly and differs by at most 1 satang', () => {
    for (const amount of [0, 1, 99, 100, 10001, 117700, 33333]) {
      for (const n of [1, 2, 3, 7, 12]) {
        const parts = splitEqual(amount, n)
        expect(sum(parts)).toBe(amount)
        expect(Math.max(...parts) - Math.min(...parts) <= 1).toBe(true)
      }
    }
  })
  it('gives the extra satang starting at `start`', () => {
    expect(splitEqual(10, 3, 0)).toEqual([4, 3, 3])
    expect(splitEqual(10, 3, 2)).toEqual([3, 3, 4])
  })
  it('rejects bad input', () => {
    expect(() => splitEqual(1.5, 2)).toThrow()
    expect(() => splitEqual(-1, 2)).toThrow()
    expect(() => splitEqual(100, 0)).toThrow()
  })
})

describe('shareItems', () => {
  it('shares each item among its eaters; no eaters = everyone', () => {
    // A ate 200, B ate 100, shared 300 by all three → A 300, B 200, C 100
    expect(shareItems([item(20000, [0]), item(10000, [1]), item(30000)], 3)).toEqual([30000, 20000, 10000])
  })
  it('always adds up to the sum of the items', () => {
    const items = [item(12345, [0, 2]), item(999, [1]), item(50001), item(7, [0, 1, 2, 3]), item(0, [3])]
    const food = shareItems(items, 4)
    expect(sum(food)).toBe(12345 + 999 + 50001 + 7)
    expect(food.every((x) => x >= 0)).toBe(true)
  })
  it('ignores duplicate eaters and rejects unknown ones', () => {
    expect(shareItems([item(100, [1, 1])], 2)).toEqual([0, 100])
    expect(() => shareItems([item(100, [5])], 2)).toThrow()
  })
  it('lists items nobody picked', () => {
    expect(unassignedItems([item(1, [0]), item(2), item(3)])).toEqual([1, 2])
  })
})

describe('applyTreats (เลี้ยง)', () => {
  it('moves the treated share to everyone else', () => {
    expect(applyTreats([300, 300, 300], [0])).toEqual([0, 450, 450])
    expect(applyTreats([100, 200, 301], [1])).toEqual([200, 0, 401])
  })
  it('keeps the total', () => {
    const r = applyTreats([12345, 6789, 1, 999], [0, 3])
    expect(sum(r)).toBe(12345 + 6789 + 1 + 999)
  })
  it('needs at least one payer', () => {
    expect(() => applyTreats([100, 100], [0, 1])).toThrow()
  })
})

describe('roundUpToBaht', () => {
  it('rounds every share up and reports the extra', () => {
    expect(roundUpToBaht([39234, 39233, 39233])).toEqual({ amounts: [39300, 39300, 39300], extra: 200 })
    expect(roundUpToBaht([10000, 0])).toEqual({ amounts: [10000, 0], extra: 0 })
  })
})

describe('computeSplit', () => {
  it('equal mode: 1,000 ฿ for 3 people → 334 each, payer gets 2 ฿ extra', () => {
    const r = computeSplit({ mode: 'equal', people: 3, total: 100000 })
    expect(r.amounts).toEqual([33400, 33400, 33400])
    expect(r.extra).toBe(200)
    expect(r.total).toBe(100000)
  })
  it('items mode with a birthday treat', () => {
    const r = computeSplit({ mode: 'items', people: 3, items: [item(30000, [0]), item(30000)], treated: [0] })
    // food: A 400, B 100, C 100 → A treated → B 300, C 300
    expect(r.exact).toEqual([0, 30000, 30000])
    expect(r.amounts).toEqual([0, 30000, 30000])
  })
  it('never collects less than the bill', () => {
    for (let t = 0; t < 500; t++) {
      const people = 2 + (t % 10)
      const items = Array.from({ length: 1 + (t % 7) }, (_, k) => item((t * 7919 + k * 104729) % 300000, k % 2 ? [k % people] : []))
      const r = computeSplit({ mode: 'items', people, items, treated: t % 3 === 0 ? [t % people] : [] })
      expect(sum(r.exact)).toBe(r.total)
      expect(sum(r.amounts)).toBe(r.total + r.extra)
      expect(r.extra >= 0 && r.extra < people * 100).toBe(true)
    }
  })
})
