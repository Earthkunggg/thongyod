import { describe, expect, it } from 'vitest'
import { addMonths, dayKey, defaultDay, gridRange, groupByDay, monthGrid, monthKey, parseDayKey, parseMonthKey } from './month'

describe('monthGrid', () => {
  it('starts on Monday, ends on Sunday and covers every day of the month', () => {
    for (const [y, m] of [[2026, 10], [2026, 1], [2027, 1], [2026, 5], [2024, 1]] as const) {
      const month = new Date(y, m, 1)
      const days = monthGrid(month)
      expect(days.length % 7).toBe(0)
      expect([35, 42, 28]).toContain(days.length)
      expect(days[0].getDay()).toBe(1)
      expect(days[days.length - 1].getDay()).toBe(0)
      const inMonth = days.filter((d) => d.getMonth() === m)
      expect(inMonth).toHaveLength(new Date(y, m + 1, 0).getDate())
      expect(inMonth[0].getDate()).toBe(1)
    }
  })
  it('November 2026 starts on a Sunday, so the grid has 6 leading days and 6 rows', () => {
    const days = monthGrid(new Date(2026, 10, 1))
    expect(dayKey(days[0])).toBe('2026-10-26')
    expect(days).toHaveLength(42)
    expect(dayKey(days[41])).toBe('2026-12-06')
  })
  it('February 2027 (starts Monday, 28 days) fits exactly in 4 rows', () => {
    const days = monthGrid(new Date(2027, 1, 1))
    expect(days).toHaveLength(28)
    expect(dayKey(days[0])).toBe('2027-02-01')
  })
})

describe('gridRange', () => {
  it('covers the whole grid, end exclusive, within the 93-day API limit', () => {
    const { from, to } = gridRange(new Date(2026, 10, 1))
    expect(new Date(from).getTime()).toBe(new Date(2026, 9, 26).getTime())
    expect(new Date(to).getTime()).toBe(new Date(2026, 11, 7).getTime())
    expect((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000).toBeLessThanOrEqual(93)
  })
})

describe('keys', () => {
  it('formats and parses month and day keys', () => {
    expect(monthKey(new Date(2026, 0, 9))).toBe('2026-01')
    expect(dayKey(new Date(2026, 0, 9))).toBe('2026-01-09')
    expect(parseMonthKey('2026-12')?.getMonth()).toBe(11)
    expect(parseMonthKey('2026-13')).toBeNull()
    expect(parseMonthKey('nope')).toBeNull()
    expect(parseMonthKey(null)).toBeNull()
    expect(parseDayKey('2026-02-28')?.getDate()).toBe(28)
    expect(parseDayKey('2026-02-30')).toBeNull()
    expect(parseDayKey('2026-2-3')).toBeNull()
  })
  it('moves months across year ends', () => {
    expect(monthKey(addMonths(new Date(2026, 11, 1), 1))).toBe('2027-01')
    expect(monthKey(addMonths(new Date(2026, 0, 1), -1))).toBe('2025-12')
    expect(monthKey(addMonths(new Date(2026, 0, 31), 1))).toBe('2026-02')
  })
})

describe('groupByDay', () => {
  it('groups by local day and keeps order', () => {
    const a = { id: 'a', startsAt: new Date(2026, 10, 5, 9).toISOString() }
    const b = { id: 'b', startsAt: new Date(2026, 10, 5, 23, 59).toISOString() }
    const c = { id: 'c', startsAt: new Date(2026, 10, 6, 0, 0).toISOString() }
    const groups = groupByDay([a, b, c])
    expect(groups.get('2026-11-05')?.map((x) => x.id)).toEqual(['a', 'b'])
    expect(groups.get('2026-11-06')?.map((x) => x.id)).toEqual(['c'])
  })
})

describe('defaultDay', () => {
  const today = new Date(2026, 10, 5, 14, 30)
  it('is today in the current month', () => {
    expect(dayKey(defaultDay(new Date(2026, 10, 1), today, ['2026-11-01']))).toBe('2026-11-05')
  })
  it('is the first day with a meetup in another month, ignoring other months', () => {
    expect(dayKey(defaultDay(new Date(2026, 11, 1), today, ['2026-11-30', '2026-12-09', '2026-12-03']))).toBe('2026-12-03')
  })
  it('falls back to the 1st', () => {
    expect(dayKey(defaultDay(new Date(2027, 0, 1), today, []))).toBe('2027-01-01')
  })
})
