import { describe, expect, it } from 'vitest'
import { BOMB_PACKS } from '@/config/games/bomb'
import { FUSE_RANGE, pickFuse, tickGap, tickTimes } from './logic'

describe('bomb', () => {
  it('fuse stays inside its range', () => {
    for (let i = 0; i < 200; i++) {
      const s = pickFuse('short')
      expect(s).toBeGreaterThanOrEqual(FUSE_RANGE.short[0])
      expect(s).toBeLessThanOrEqual(FUSE_RANGE.short[1])
    }
    expect(pickFuse('long', () => 0)).toBe(40)
  })

  it('ticks speed up toward the end', () => {
    expect(tickGap(0, 30000)).toBe(900)
    expect(tickGap(29000, 30000)).toBeLessThan(250)
    const t = tickTimes(20000)
    expect(t[0]).toBe(0)
    expect(t.at(-1)!).toBeLessThan(20000)
    expect(t[1] - t[0]).toBeGreaterThan(t.at(-1)! - t.at(-2)!)
  })

  it('has plenty of unique topics', () => {
    const all = BOMB_PACKS.flatMap((p) => p.topics)
    expect(all.length).toBeGreaterThanOrEqual(130)
    expect(new Set(all).size).toBe(all.length)
  })
})
