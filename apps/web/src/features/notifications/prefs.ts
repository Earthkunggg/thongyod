// Notification preferences (spec §14). Pure logic, tested in prefs.test.ts.
// Kept on this device until the backend stores preferences; the server will enforce them.

export type NotifyCategory = 'meetups' | 'reminders' | 'bills' | 'birthdays' | 'saimu' | 'titles'
export const CATEGORIES: NotifyCategory[] = ['meetups', 'reminders', 'bills', 'birthdays', 'titles', 'saimu']
export const REMINDER_CHOICES = [30, 60, 120] as const
export type ReminderMinutes = (typeof REMINDER_CHOICES)[number]

export type NotifyPrefs = {
  on: Record<NotifyCategory, boolean>
  /** Minutes before a meetup for the one reminder. */
  reminderMinutes: ReminderMinutes
  /** "HH:mm" in the device time zone. No notifications between start and end (may cross midnight). */
  quietStart: string
  quietEnd: string
  /** ISO time; null = not paused. */
  pausedUntil: string | null
}

/** Spec §14 defaults: Saimu off, everything else on, quiet 22:00–08:00. */
export const DEFAULT_PREFS: NotifyPrefs = {
  on: { meetups: true, reminders: true, bills: true, birthdays: true, saimu: false, titles: true },
  reminderMinutes: 60,
  quietStart: '22:00',
  quietEnd: '08:00',
  pausedUntil: null,
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

/** Saved JSON → valid prefs. Anything missing or broken falls back to the default for that field. */
export function parsePrefs(raw: string | null): NotifyPrefs {
  let value: Partial<NotifyPrefs> = {}
  try {
    const parsed: unknown = JSON.parse(raw ?? '{}')
    if (parsed && typeof parsed === 'object') value = parsed as Partial<NotifyPrefs>
  } catch {
    value = {}
  }
  const on = { ...DEFAULT_PREFS.on }
  for (const c of CATEGORIES) if (typeof value.on?.[c] === 'boolean') on[c] = value.on[c]
  return {
    on,
    reminderMinutes: REMINDER_CHOICES.includes(value.reminderMinutes as ReminderMinutes) ? (value.reminderMinutes as ReminderMinutes) : DEFAULT_PREFS.reminderMinutes,
    quietStart: typeof value.quietStart === 'string' && TIME.test(value.quietStart) ? value.quietStart : DEFAULT_PREFS.quietStart,
    quietEnd: typeof value.quietEnd === 'string' && TIME.test(value.quietEnd) ? value.quietEnd : DEFAULT_PREFS.quietEnd,
    pausedUntil: typeof value.pausedUntil === 'string' && !Number.isNaN(Date.parse(value.pausedUntil)) ? value.pausedUntil : null,
  }
}

export type PauseChoice = 'off' | 'day' | 'week'

/** "Pause all" for 1 day / 1 week from now (spec §14). */
export function pauseUntil(choice: PauseChoice, now: Date): string | null {
  if (choice === 'off') return null
  return new Date(now.getTime() + (choice === 'day' ? 1 : 7) * 86_400_000).toISOString()
}

export function isPaused(prefs: NotifyPrefs, now: Date): boolean {
  return prefs.pausedUntil !== null && Date.parse(prefs.pausedUntil) > now.getTime()
}

/** True when `now` (device time) is inside quiet hours. Start = end means no quiet hours. */
export function inQuietHours(prefs: NotifyPrefs, now: Date): boolean {
  const minutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3))
  const start = minutes(prefs.quietStart)
  const end = minutes(prefs.quietEnd)
  const current = now.getHours() * 60 + now.getMinutes()
  if (start === end) return false
  return start < end ? current >= start && current < end : current >= start || current < end
}
