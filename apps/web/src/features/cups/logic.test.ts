import { describe, expect, it } from 'vitest'
import { applySwap, cupCount, finalSlot, makeSwaps, stepMs, swapCount } from './logic'

describe('cups', () => {
  it('swaps two different slots', () => {
    for (const [a, b] of makeSwaps(3, 200)) {
      expect(a).not.toBe(b)
      expect(a >= 0 && a < 3 && b >= 0 && b < 3).toBe(true)
    }
  })

  it('tracks where a cup ends up', () => {
    expect(applySwap([0, 1, 2], [0, 2])).toEqual([2, 1, 0])
    expect(finalSlot(3, [[0, 2], [2, 1]], 0)).toBe(1)
  })

  it('gets harder by level', () => {
    expect(cupCount(1)).toBe(3)
    expect(cupCount(5)).toBe(4)
    expect(swapCount(3)).toBeGreaterThan(swapCount(1))
    expect(stepMs(50)).toBe(200)
  })
})
