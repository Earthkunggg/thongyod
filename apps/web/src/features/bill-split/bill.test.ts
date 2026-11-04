import { describe, expect, it } from 'vitest'
import {
  addPerson,
  billStatus,
  bumpEntry,
  isBill,
  jot,
  minimalTransfers,
  newBill,
  priceGroups,
  recentNames,
  removePerson,
  setPrice,
  settle,
  toggleSettled,
  toggleTreated,
  type Bill,
} from './bill'

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

/** Bill with fixed ids: a (ฉัน, paid the shop), b, c, d. */
function table(): Bill {
  return {
    id: 'bill',
    title: 'ชาบู',
    createdAt: '2026-11-04T12:00:00.000Z',
    people: ['a', 'b', 'c', 'd'].map((id) => ({ id, name: id, treated: false })),
    entries: [],
    prices: {},
    payerId: 'a',
    settled: [],
  }
}

describe('jot', () => {
  it('adds an entry, and the same item for the same people only adds quantity', () => {
    let b = jot(table(), { name: ' เบียร์ ', price: null, eaters: ['c', 'b'] })
    b = jot(b, { name: 'เบียร์', price: null, eaters: ['b', 'c'] })
    expect(b.entries).toHaveLength(1)
    expect(b.entries[0].qty).toBe(2)
    expect(b.entries[0].eaters).toEqual(['b', 'c'])
    b = jot(b, { name: 'เบียร์', price: null, eaters: ['d'] })
    expect(b.entries).toHaveLength(2)
  })
  it('ignores blank names and remembers a price per item name', () => {
    let b = jot(table(), { name: '  ', price: 100, eaters: [] })
    expect(b.entries).toHaveLength(0)
    b = jot(b, { name: 'Coke', price: 2500, eaters: [] })
    expect(b.prices).toEqual({ coke: 2500 })
  })
  it('+1 / -1, and 0 removes the entry', () => {
    let b = jot(table(), { name: 'น้ำ', price: null, eaters: [] })
    const id = b.entries[0].id
    b = bumpEntry(b, id, 1)
    expect(b.entries[0].qty).toBe(2)
    b = bumpEntry(bumpEntry(b, id, -1), id, -1)
    expect(b.entries).toHaveLength(0)
  })
})

describe('settle', () => {
  it('matches the agreed example: shabu for all + beers for two, A paid the shop', () => {
    let b = table()
    for (let i = 0; i < 4; i++) b = jot(b, { name: 'ชาบู', price: 29900, eaters: [] })
    for (let i = 0; i < 3; i++) b = jot(b, { name: 'เบียร์', price: null, eaters: ['b', 'c'] })
    expect(settle(b).unpriced).toBe(1)
    b = setPrice(b, 'เบียร์', 9000)
    const s = settle(b)
    expect(s.total).toBe(4 * 29900 + 3 * 9000)
    expect(s.consumed).toEqual({ a: 29900, b: 43400, c: 43400, d: 29900 })
    expect(s.transfers.map((t) => [t.from, t.to, t.amount])).toEqual([
      ['b', 'a', 43400],
      ['c', 'a', 43400],
      ['d', 'a', 29900],
    ])
    expect(s.extra).toBe(0)
  })
  it('handles several payers (a trip) with the fewest transfers', () => {
    let b = jot(table(), { name: 'หมูกระทะ', price: 120000, eaters: [] }) // a pays (shop payer)
    b = jot(b, { name: 'แท็กซี่', price: 24000, eaters: ['a', 'b', 'c'] })
    b = { ...b, entries: b.entries.map((e) => (e.name === 'แท็กซี่' ? { ...e, payerId: 'b' } : e)) }
    b = jot(b, { name: 'น้ำ', price: 18000, eaters: ['c', 'd'] })
    b = { ...b, entries: b.entries.map((e) => (e.name === 'น้ำ' ? { ...e, payerId: 'c' } : e)) }
    const s = settle(b)
    expect(s.paid).toEqual({ a: 120000, b: 24000, c: 18000, d: 0 })
    // a: 300+80 = 380 → +820 ; b: 380 → -140 ; c: 300+80+90 = 470 → -290 ; d: 390 → -390
    expect(s.transfers.map((t) => [t.from, t.to, t.amount])).toEqual([
      ['d', 'a', 39000],
      ['c', 'a', 29000],
      ['b', 'a', 14000],
    ])
  })
  it('treat the whole bill: that person pays nothing, the others share it', () => {
    let b = jot(table(), { name: 'ชุดหมู', price: 40000, eaters: [] })
    b = toggleTreated(b, 'd')
    const s = settle(b)
    expect(s.consumed.d).toBe(0)
    expect(sum(Object.values(s.consumed))).toBe(40000)
    expect(s.transfers.some((t) => t.from === 'd')).toBe(false)
  })
  it('never lets everyone be treated', () => {
    let b = table()
    for (const id of ['a', 'b', 'c', 'd']) b = toggleTreated(b, id)
    expect(b.people.filter((p) => p.treated)).toHaveLength(3)
  })
  it('rounds every transfer up to whole baht and reports the extra', () => {
    const b = jot({ ...table(), people: table().people.slice(0, 3) }, { name: 'บิล', price: 100000, eaters: [] })
    const s = settle(b) // 1000 / 3 = 333.34 / 333.33 / 333.33
    expect(s.transfers.map((t) => t.amount)).toEqual([33400, 33400])
    expect(s.extra).toBe(134)
  })
  it('always balances: transfers cover every debt, at most people − 1 transfers', () => {
    for (let t = 0; t < 300; t++) {
      const n = 2 + (t % 9)
      const ids = Array.from({ length: n }, (_, i) => `p${i}`)
      const net = ids.map((_, i) => ((t * 7919 + i * 104729) % 50000) - 25000)
      net[n - 1] -= sum(net) // make it sum to 0
      const tr = minimalTransfers(ids, net)
      expect(tr.length <= n - 1).toBe(true)
      const got = ids.map((id) => sum(tr.filter((x) => x.to === id).map((x) => x.exact)) - sum(tr.filter((x) => x.from === id).map((x) => x.exact)))
      expect(got).toEqual(net)
    }
  })
})

describe('people', () => {
  it('removing a person drops their solo entries and fixes payers', () => {
    let b = jot(table(), { name: 'เบียร์', price: 9000, eaters: ['b'] })
    b = jot(b, { name: 'ชาบู', price: 29900, eaters: ['a', 'b'] })
    b = { ...b, payerId: 'b' }
    const r = removePerson(b, 'b')
    expect(r.entries.map((e) => e.name)).toEqual(['ชาบู'])
    expect(r.entries[0].eaters).toEqual(['a'])
    expect(r.payerId).toBe('a')
  })
  it('adds trimmed names only', () => {
    expect(addPerson(table(), '  ').people).toHaveLength(4)
    expect(addPerson(table(), ' เอ ').people[4].name).toBe('เอ')
  })
})

describe('helpers', () => {
  it('groups prices by item in jot order and lists recent names', () => {
    let b = jot(table(), { name: 'ชาบู', price: 29900, eaters: [] })
    b = jot(b, { name: 'เบียร์', price: null, eaters: ['b'] })
    b = jot(b, { name: 'เบียร์', price: null, eaters: ['c'] })
    expect(priceGroups(b).map((g) => [g.name, g.qty, g.price])).toEqual([
      ['ชาบู', 1, 29900],
      ['เบียร์', 2, null],
    ])
    expect(recentNames(b)).toEqual(['เบียร์', 'ชาบู'])
  })
  it('status: jotting → waiting → cleared', () => {
    let b = jot(table(), { name: 'ชาบู', price: null, eaters: [] })
    expect(billStatus(b).status).toBe('jotting')
    b = setPrice(b, 'ชาบู', 40000)
    expect(billStatus(b)).toEqual({ status: 'waiting', waiting: 3 })
    for (const t of settle(b).transfers) b = toggleSettled(b, t.key)
    expect(billStatus(b).status).toBe('cleared')
  })
  it('validates stored bills', () => {
    expect(isBill(newBill('x', 'ฉัน'))).toBe(true)
    expect(isBill({ ...table(), people: [] })).toBe(false)
    expect(isBill({ ...table(), prices: { a: -1 } })).toBe(false)
  })
})
