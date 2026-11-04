import { describe, expect, it } from 'vitest'
import { streakOf, type DailyLog } from './daily'

const at = (iso: string) => new Date(iso)

describe('streakOf', () => {
  const log: DailyLog = { '2026-11-01': ['pet'], '2026-11-02': ['tool'], '2026-11-03': ['fortune', 'pet'] }
  it('counts days in a row ending today', () => {
    expect(streakOf({ ...log, '2026-11-04': ['pet'] }, at('2026-11-04T05:00:00Z'))).toBe(4)
  })
  it('does not break before today is done (counts from yesterday)', () => {
    expect(streakOf(log, at('2026-11-04T05:00:00Z'))).toBe(3)
  })
  it('restarts quietly after a missed day', () => {
    expect(streakOf(log, at('2026-11-06T05:00:00Z'))).toBe(0)
    expect(streakOf({ ...log, '2026-11-06': ['pet'] }, at('2026-11-06T05:00:00Z'))).toBe(1)
  })
  it('uses the Bangkok day', () => {
    // 2026-11-03 23:30 Bangkok = 16:30Z
    expect(streakOf({ '2026-11-03': ['pet'] }, at('2026-11-03T16:30:00Z'))).toBe(1)
  })
})
