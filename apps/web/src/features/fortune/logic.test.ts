import { describe, expect, it } from 'vitest'
import { STICK_COUNT, addToHistory, bangkokDayKey, createShakeDetector, drawForToday, isStickNo, levelOf, type Draw } from './logic'

describe('levels', () => {
  it('has a level for every stick, with the planned mix', () => {
    const count = { great: 0, good: 0, fair: 0, careful: 0 }
    for (let n = 1; n <= STICK_COUNT; n++) {
      if (!isStickNo(n)) throw new Error('bad stick')
      count[levelOf(n)]++
    }
    expect(STICK_COUNT).toBe(40)
    expect(count).toEqual({ great: 9, good: 15, fair: 9, careful: 7 })
  })

  it('keeps the levels of the first 28 sticks (saved history refers to them)', () => {
    const first = Array.from({ length: 28 }, (_, i) => levelOf(i + 1))
    expect(first.filter((l) => l === 'great')).toHaveLength(6)
    expect([levelOf(1), levelOf(4), levelOf(26), levelOf(28)]).toEqual(['great', 'careful', 'great', 'careful'])
  })

  it('every fortune is complete', async () => {
    const { FORTUNES } = await import('@/config/fortunes')
    for (const f of FORTUNES) {
      expect(f.poem.every((line) => line.trim().length > 0)).toBe(true)
      for (const field of [f.meaning, f.study, f.money, f.love, f.friends, f.lucky]) expect(field.trim().length).toBeGreaterThan(3)
    }
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
  it('draws a new stick (1–40) when nothing is saved', () => {
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

describe('addToHistory', () => {
  const d = (day: string, stick: number) => ({ day, stick }) as Draw
  it('keeps one entry per day, newest first', () => {
    const h = addToHistory([d('2026-11-03', 5), d('2026-11-01', 2)], d('2026-11-04', 9))
    expect(h.map((x) => x.day)).toEqual(['2026-11-04', '2026-11-03', '2026-11-01'])
    expect(addToHistory(h, d('2026-11-04', 9))).toHaveLength(3)
  })
  it('caps the length and drops broken entries', () => {
    const many = Array.from({ length: 70 }, (_, i) => d(`2026-08-${String((i % 28) + 1).padStart(2, '0')}-${i}`, 1))
    expect(addToHistory(many, d('2026-11-04', 1), 60)).toHaveLength(60)
    expect(addToHistory([d('2026-11-01', 99)], d('2026-11-02', 3))).toEqual([d('2026-11-02', 3)])
  })
})
