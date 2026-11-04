import { describe, expect, it } from 'vitest'
import { checkCreateForm, combineDateTime, dateFor, suggestedDay, toDateInput } from './createForm'

const at = (h: number, m = 0) => new Date(2026, 10, 3, h, m)

describe('create meetup form', () => {
  it('suggests today before 17:00 and tomorrow after', () => {
    expect(suggestedDay(at(9))).toBe('today')
    expect(suggestedDay(at(17))).toBe('tomorrow')
  })
  it('turns day choices into dates', () => {
    expect(dateFor('today', '', at(9))).toBe('2026-11-03')
    expect(dateFor('tomorrow', '', at(23, 59))).toBe('2026-11-04')
    expect(dateFor('pick', '2026-12-31', at(9))).toBe('2026-12-31')
  })
  it('handles month and year ends', () => {
    expect(toDateInput(new Date(2026, 11, 31))).toBe('2026-12-31')
    expect(dateFor('tomorrow', '', new Date(2026, 11, 31, 20))).toBe('2027-01-01')
  })
  it('combines date and time in local time', () => {
    expect(combineDateTime('2026-11-03', '18:30')?.getHours()).toBe(18)
    expect(combineDateTime('', '18:30')).toBeNull()
    expect(combineDateTime('2026-11-03', '')).toBeNull()
  })
  it('validates the form', () => {
    const later = at(18)
    expect(checkCreateForm({ gangId: null, title: 'x', startsAt: later }, at(9))).toBe('no_gang')
    expect(checkCreateForm({ gangId: 'g1', title: '  ', startsAt: later }, at(9))).toBe('no_title')
    expect(checkCreateForm({ gangId: 'g1', title: 'ก'.repeat(61), startsAt: later }, at(9))).toBe('title_too_long')
    expect(checkCreateForm({ gangId: 'g1', title: 'กินข้าว', startsAt: null }, at(9))).toBe('no_time')
    expect(checkCreateForm({ gangId: 'g1', title: 'กินข้าว', startsAt: at(8) }, at(9))).toBe('in_past')
    expect(checkCreateForm({ gangId: 'g1', title: 'กินข้าว', startsAt: later }, at(9))).toBeNull()
  })
})
