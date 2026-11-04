// Pure helpers for the "ชวนนัด" form (tested in createForm.test.ts). No i18n/DOM imports so tests run in Node.

export const TITLE_MAX = 60
export const DEFAULT_TIME = '18:00'
/** After this hour, the form suggests tomorrow instead of today. */
const LATE_HOUR = 17

export type DayChoice = 'today' | 'tomorrow' | 'pick'

/** "2026-11-03" for <input type="date"> in the device's time zone. */
export function toDateInput(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function suggestedDay(now: Date): DayChoice {
  return now.getHours() >= LATE_HOUR ? 'tomorrow' : 'today'
}

/**
 * Starting day for the form. `requested` = "YYYY-MM-DD" from the calendar (?date=); ignored if invalid or in the past.
 * Today / tomorrow map to their buttons; later days open the date picker on that date.
 */
export function initialDay(requested: string | null, now: Date): { day: DayChoice; picked: string } {
  const today = toDateInput(now)
  const date = requested === null ? null : combineDateTime(requested, '00:00')
  // toDateInput(date) !== requested catches impossible dates such as 2026-02-30.
  if (requested === null || !date || toDateInput(date) !== requested || requested < today) return { day: suggestedDay(now), picked: today }
  if (requested === today) return { day: 'today', picked: today }
  if (requested === dateFor('tomorrow', today, now)) return { day: 'tomorrow', picked: today }
  return { day: 'pick', picked: requested }
}

/** The date for a day choice. `picked` is the value of the date input (used for 'pick'). */
export function dateFor(choice: DayChoice, picked: string, now: Date): string {
  if (choice === 'today') return toDateInput(now)
  // Calendar day after `now` (setDate handles month/year ends).
  if (choice === 'tomorrow') return toDateInput(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1))
  return picked
}

/** Local date "YYYY-MM-DD" + time "HH:mm" → Date in the device's time zone, or null if invalid. */
export function combineDateTime(date: string, time: string): Date | null {
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  const tm = /^(\d{2}):(\d{2})$/.exec(time)
  if (!dm || !tm) return null
  const result = new Date(Number(dm[1]), Number(dm[2]) - 1, Number(dm[3]), Number(tm[1]), Number(tm[2]))
  return Number.isNaN(result.getTime()) ? null : result
}

export type CreateProblem = 'no_gang' | 'no_title' | 'title_too_long' | 'no_time' | 'in_past' | null

export function checkCreateForm(input: { gangId: string | null; title: string; startsAt: Date | null }, now: Date): CreateProblem {
  if (!input.gangId) return 'no_gang'
  const title = input.title.trim()
  if (title === '') return 'no_title'
  if ([...title].length > TITLE_MAX) return 'title_too_long'
  if (!input.startsAt) return 'no_time'
  if (input.startsAt.getTime() <= now.getTime()) return 'in_past'
  return null
}
