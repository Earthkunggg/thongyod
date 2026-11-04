import { useMemo } from 'react'
import { useMeetupsInRange } from '@/api/meetups'
import { addDays, startOfDay, startOfWeek } from '@/lib/date'
import { isLocked } from './derive'

/** How far ahead "รอคุณตอบ" looks. */
export const WAITING_DAYS_AHEAD = 14

/** One range for Home: this week (week strip + agenda) and the next 2 weeks ("รอคุณตอบ"). Same all day, so the cache is shared. */
export function homeRange(now: Date): { from: string; to: string } {
  const from = startOfWeek(now)
  const to = new Date(Math.max(addDays(from, 7).getTime(), addDays(startOfDay(now), WAITING_DAYS_AHEAD + 1).getTime()))
  return { from: from.toISOString(), to: to.toISOString() }
}

/** Invites I have not answered yet, soonest first (Home deck, /invites, tab badge). Shares Home's cached request. */
export function useWaitingMeetups() {
  const now = useMemo(() => new Date(), [])
  const range = useMemo(() => homeRange(now), [now])
  const query = useMeetupsInRange(range.from, range.to)
  const items = (query.data ?? []).filter((m) => !m.myState.hidden && m.myResponse === null && !isLocked(m, now))
  return { items, query, now }
}

/** Number of invites waiting (for the red number on the Home tab). */
export function useWaitingCount(): number {
  return useWaitingMeetups().items.length
}
