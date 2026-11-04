import { describe, expect, it } from 'vitest'
import { STICK_COUNT, bangkokDayKey, createShakeDetector, drawForToday, isStickNo, levelOf } from './logic'

describe('levels', () => {
  it('has a level for every stick, with the planned mix', () => {
    const count = { great: 0, good: 0, fair: 0, careful: 0 }
    for (let n = 1; n <= STICK_COUNT; n++) {
      if (!isStickNo(n)) throw new Error('bad stick')
      count[levelOf(n)]++
    }
    expect(count).toEqual({ great: 6, good: 10, fair: 7, careful: 5 })
  })
})

describe('bangkokDayKey', () => {
  it('uses the Thai calendar day', () => {
    expect(bangkokDayKey(new Date('2026-11-04T16:59:00Z'))).toBe('2026-11-04') // 23:59 in Bangkok
    expect(bangkokDayKey(new Date('2026-11-04T17:00:00Z'))).toBe('2026-11-05') // 00:00 in Bangkok
  })
})

describe('drawForToday', () => {
  const now = new Date('2026-11-04T05:00:00Z')
  it('draws a new stick (1–28) when nothing is saved', () => {
    const r = drawForToday(now, null, () => 11)
    expect(r).toEqual({ draw: { day: '2026-11-04', stick: 12 }, isNew: true })
  })
  it('keeps the same stick for the rest of the day', () => {
    const r = drawForToday(now, { day: '2026-11-04', stick: 7 }, () => 0)
    expect(r).toEqual({ draw: { day: '2026-11-04', stick: 7 }, isNew: false })
  })
  it('draws again the next day', () => {
    const r = drawForToday(now, { day: '2026-11-03', stick: 7 }, () => 27)
    expect(r.draw.stick).toBe(28)
    expect(r.isNew).toBe(true)
  })
  it('covers every stick', () => {
    const seen = new Set<number>()
    for (let i = 0; i < 2000; i++) seen.add(drawForToday(now, null).draw.stick)
    expect(seen.size).toBe(STICK_COUNT)
  })
})

describe('createShakeDetector', () => {
  it('ignores small movement', () => {
    const feed = createShakeDetector()
    let fired = false
    for (let t = 0; t < 2000; t += 50) fired ||= feed(0, 9.8 + Math.sin(t) * 2, 0, t)
    expect(fired).toBe(false)
  })
  it('fires on 3 strong jolts close together, then cools down', () => {
    const feed = createShakeDetector()
    const results: boolean[] = []
    let t = 0
    for (let i = 0; i < 8; i++) {
      results.push(feed(i % 2 ? 15 : -15, 9.8, 0, t))
      t += 100
    }
    expect(results.filter(Boolean)).toHaveLength(1)
    expect(results.indexOf(true)).toBe(3)
  })
  it('does not fire when jolts are too far apart', () => {
    const feed = createShakeDetector()
    let fired = false
    for (let i = 0; i < 6; i++) fired ||= feed(i % 2 ? 15 : -15, 9.8, 0, i * 1000)
    expect(fired).toBe(false)
  })
})
