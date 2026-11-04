// Pure helpers for the month calendar (tested in month.test.ts). No i18n/DOM imports so tests run in Node.
// Weeks start on Monday, like the Home week strip. All dates are in the device's time zone.

/** "2026-11" (month key used in the URL). */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/** "2026-11-05" (day key used in the URL and to group meetups). */
export function dayKey(date: Date): string {
  return `${monthKey(date)}-${String(date.getDate()).padStart(2, '0')}`
}

/** "2026-11" → 1 Nov 2026 00:00, or null if the text is not a valid month. */
export function parseMonthKey(value: string | null): Date | null {
  const match = value ? /^(\d{4})-(\d{2})$/.exec(value) : null
  if (!match) return null
  const month = Number(match[2])
  if (month < 1 || month > 12) return null
  return new Date(Number(match[1]), month - 1, 1)
}

/** "2026-11-05" → 5 Nov 2026 00:00, or null if invalid (e.g. 2026-02-30). */
export function parseDayKey(value: string | null): Date | null {
  const match = value ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return dayKey(date) === value ? date : null
}

/** First day of the month that contains `date`. */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/** First day of the month `delta` months away (setMonth on the 1st never overflows). */
export function addMonths(month: Date, delta: number): Date {
  return new Date(month.getFullYear(), month.getMonth() + delta, 1)
}

/**
 * The days shown for a month: whole Monday–Sunday weeks that cover it (5 or 6 rows, 35 or 42 days).
 * Days outside the month are included so the grid is always full; the UI greys them out.
 */
export function monthGrid(month: Date): Date[] {
  const first = startOfMonth(month)
  const lead = (first.getDay() + 6) % 7 // days since Monday
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  const cells = Math.ceil((lead + daysInMonth) / 7) * 7
  return Array.from({ length: cells }, (_, i) => new Date(first.getFullYear(), first.getMonth(), 1 - lead + i))
}

/** One API request for the whole grid (ISO; from inclusive, to exclusive). At most 42 days, under the 93-day limit (#40). */
export function gridRange(month: Date): { from: string; to: string } {
  const days = monthGrid(month)
  const last = days[days.length - 1]
  const end = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1)
  return { from: days[0].toISOString(), to: end.toISOString() }
}

/** Groups items by local day key, keeping their order inside each day. */
export function groupByDay<T extends { startsAt: string }>(items: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const key = dayKey(new Date(item.startsAt))
    const list = groups.get(key)
    if (list) list.push(item)
    else groups.set(key, [item])
  }
  return groups
}

/**
 * Which day to select when a month opens: today if it is in that month,
 * otherwise the first day with a meetup, otherwise the 1st.
 */
export function defaultDay(month: Date, today: Date, daysWithItems: Iterable<string>): Date {
  if (monthKey(today) === monthKey(month)) return new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const prefix = monthKey(month)
  const first = [...daysWithItems].filter((key) => key.startsWith(prefix)).sort()[0]
  return parseDayKey(first ?? null) ?? startOfMonth(month)
}
