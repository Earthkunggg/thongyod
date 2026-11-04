// Date helpers. Weeks start on Monday.
// Text and formats follow the current UI language (Thai shows Buddhist Era years, พ.ศ.).
import i18n, { intlLocale } from '@/i18n'

export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/** Monday 00:00 of the week that contains `date`. */
export function startOfWeek(date: Date): Date {
  const d = startOfDay(date)
  const daysSinceMonday = (d.getDay() + 6) % 7
  return addDays(d, -daysSinceMonday)
}

/** The 7 days (Mon-Sun) of the week that contains `date`. */
export function weekDays(date: Date): Date[] {
  const monday = startOfWeek(date)
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** "อ" / "Tu" */
export function weekdayShort(date: Date): string {
  return i18n.t('time.weekdaysShort').split(',')[date.getDay()]
}

/** "พฤศจิกายน 2569" / "November 2026" */
export function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat(intlLocale(), { month: 'long', year: 'numeric' }).format(date)
}

/** "วันอังคารที่ 3 พฤศจิกายน" / "Tuesday 3 November" (screen readers, headings) */
export function formatFullDay(date: Date): string {
  return new Intl.DateTimeFormat(intlLocale(), { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
}

/** "18:00" */
export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat(intlLocale(), { hour: '2-digit', minute: '2-digit' }).format(date)
}

/** "วันนี้" / "พรุ่งนี้" / "พฤ. 5 พ.ย." */
export function formatDayLabel(date: Date, now: Date = new Date()): string {
  if (isSameDay(date, now)) return i18n.t('time.today')
  if (isSameDay(date, addDays(now, 1))) return i18n.t('time.tomorrow')
  return new Intl.DateTimeFormat(intlLocale(), { weekday: 'short', day: 'numeric', month: 'short' }).format(date)
}

/** "วันนี้" / "พรุ่งนี้" / "24 พ.ย." — compact, for narrow columns. */
export function formatDayCompact(date: Date, now: Date = new Date()): string {
  if (isSameDay(date, now) || isSameDay(date, addDays(now, 1))) return formatDayLabel(date, now)
  return new Intl.DateTimeFormat(intlLocale(), { day: 'numeric', month: 'short' }).format(date)
}

/** "อีก 25 นาที" / "อีก 5 ชม." / "อีก 2 วัน". Returns null if `target` has passed. */
export function formatTimeUntil(target: Date, now: Date = new Date()): string | null {
  const minutes = Math.floor((target.getTime() - now.getTime()) / 60_000)
  if (minutes < 0) return null
  if (minutes < 60) return i18n.t('time.inMinutes', { count: Math.max(minutes, 1) })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return i18n.t('time.inHours', { count: hours })
  return i18n.t('time.inDays', { count: Math.floor(hours / 24) })
}

/** "20 นาที" / "2 ชม." / "3 วัน" ago, for feed items. */
export function formatTimeAgo(past: Date, now: Date = new Date()): string {
  const minutes = Math.max(0, Math.floor((now.getTime() - past.getTime()) / 60_000))
  if (minutes < 1) return i18n.t('time.justNow')
  if (minutes < 60) return i18n.t('time.minutesAgo', { count: minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return i18n.t('time.hoursAgo', { count: hours })
  return i18n.t('time.daysAgo', { count: Math.floor(hours / 24) })
}
