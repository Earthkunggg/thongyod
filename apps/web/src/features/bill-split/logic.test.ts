import { describe, expect, it } from 'vitest'
import { applyTreats, parseBaht, splitEqual } from './logic'

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

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
