import { describe, expect, it } from 'vitest'
import { tickTimes, MAX_OPTIONS, canSpin, indexAtPointer, normalizeOptions, spin, spinTarget, SPIN_TURNS } from './logic'

describe('normalizeOptions', () => {
  it('trims, drops empty, cuts long text and caps the count', () => {
    expect(normalizeOptions(['  ข้าวมันไก่ ', '', '   ', 'ก'.repeat(30)])).toEqual(['ข้าวมันไก่', 'ก'.repeat(20)])
    expect(normalizeOptions(Array.from({ length: 20 }, (_, i) => `x${i}`))).toHaveLength(MAX_OPTIONS)
  })
  it('needs at least 2 options to spin', () => {
    expect(canSpin(['a'])).toBe(false)
    expect(canSpin(['a', ' '])).toBe(false)
    expect(canSpin(['a', 'b'])).toBe(true)
  })
})

describe('spinTarget', () => {
  it('lands the chosen slice under the pointer for every count, index and start', () => {
    for (const count of [2, 3, 5, 7, 12]) {
      for (let index = 0; index < count; index++) {
        for (const current of [0, 45, 361, 1234.5, -90]) {
          for (const offset of [-0.35, 0, 0.35]) {
            const target = spinTarget(current, index, count, offset)
            expect(indexAtPointer(target, count)).toBe(index)
            expect(target - current).toBeGreaterThanOrEqual(SPIN_TURNS * 360)
            expect(target - current).toBeLessThan((SPIN_TURNS + 1) * 360)
          }
        }
      }
    }
  })
  it('rejects bad input', () => {
    expect(() => spinTarget(0, 3, 3)).toThrow()
    expect(() => spinTarget(0, 0, 0)).toThrow()
  })
})

describe('spin', () => {
  it('uses the random source for the winner and stops on it', () => {
    const result = spin(100, 4, (max) => (max === 4 ? 2 : 500))
    expect(result.index).toBe(2)
    expect(indexAtPointer(result.rotation, 4)).toBe(2)
  })
  it('gives every option a chance', () => {
    const seen = new Set<number>()
    for (let i = 0; i < 400; i++) seen.add(spin(0, 5).index)
    expect(seen.size).toBe(5)
  })
})

describe('tickTimes', () => {
  it('is increasing, inside the spin, and slows down at the end (ease-out)', () => {
    const times = tickTimes(30, 1200)
    expect(times).toHaveLength(30)
    for (let i = 1; i < times.length; i++) expect(times[i]).toBeGreaterThanOrEqual(times[i - 1])
    expect(times[times.length - 1]).toBeLessThanOrEqual(1200)
    const firstGap = times[1] - times[0]
    const lastGap = times[times.length - 1] - times[times.length - 2]
    expect(lastGap).toBeGreaterThan(firstGap)
  })
  it('thins long spins and handles empty input', () => {
    expect(tickTimes(200, 1200).length).toBeLessThanOrEqual(40)
    expect(tickTimes(0, 1200)).toEqual([])
    expect(tickTimes(10, 0)).toEqual([])
  })
})
