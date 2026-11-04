import { describe, expect, it } from 'vitest'
import { DEFAULT_PREFS, inQuietHours, isPaused, parsePrefs, pauseUntil } from './prefs'

describe('parsePrefs', () => {
  it('uses spec defaults for nothing or garbage', () => {
    expect(parsePrefs(null)).toEqual(DEFAULT_PREFS)
    expect(parsePrefs('not json')).toEqual(DEFAULT_PREFS)
    expect(DEFAULT_PREFS.on.saimu).toBe(false)
    expect(DEFAULT_PREFS.on.meetups).toBe(true)
  })
  it('keeps valid fields and repairs broken ones', () => {
    const p = parsePrefs(JSON.stringify({ on: { saimu: true, bills: 'yes' }, reminderMinutes: 45, quietStart: '23:30', quietEnd: '7:00', pausedUntil: 'soon' }))
    expect(p.on.saimu).toBe(true)
    expect(p.on.bills).toBe(true)
    expect(p.reminderMinutes).toBe(60)
    expect(p.quietStart).toBe('23:30')
    expect(p.quietEnd).toBe('08:00')
    expect(p.pausedUntil).toBeNull()
  })
})

describe('pause', () => {
  const now = new Date(2026, 10, 5, 10, 0)
  it('pauses for a day or a week, and expires', () => {
    const day = { ...DEFAULT_PREFS, pausedUntil: pauseUntil('day', now) }
    expect(isPaused(day, now)).toBe(true)
    expect(isPaused(day, new Date(now.getTime() + 86_400_001))).toBe(false)
    const week = { ...DEFAULT_PREFS, pausedUntil: pauseUntil('week', now) }
    expect(isPaused(week, new Date(now.getTime() + 6 * 86_400_000))).toBe(true)
    expect(pauseUntil('off', now)).toBeNull()
  })
})

describe('inQuietHours', () => {
  const at = (h: number, m = 0) => new Date(2026, 10, 5, h, m)
  it('handles quiet hours across midnight (22:00–08:00)', () => {
    expect(inQuietHours(DEFAULT_PREFS, at(23))).toBe(true)
    expect(inQuietHours(DEFAULT_PREFS, at(7, 59))).toBe(true)
    expect(inQuietHours(DEFAULT_PREFS, at(8))).toBe(false)
    expect(inQuietHours(DEFAULT_PREFS, at(21, 59))).toBe(false)
  })
  it('handles a same-day window and an empty one', () => {
    const p = { ...DEFAULT_PREFS, quietStart: '13:00', quietEnd: '14:00' }
    expect(inQuietHours(p, at(13, 30))).toBe(true)
    expect(inQuietHours(p, at(14))).toBe(false)
    expect(inQuietHours({ ...DEFAULT_PREFS, quietEnd: '22:00' }, at(23))).toBe(false)
  })
})
