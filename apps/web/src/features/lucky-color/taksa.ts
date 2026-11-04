// สีมงคล from the traditional Thai ทักษา system (spec §13: traditional source, not a copied table).
// Pure logic, tested. "ดูเพื่อความบันเทิง" is always shown with the result.
import type { LuckyColorKey } from '@thongyod/shared'

/** The 8 ทักษา planets as days: Wednesday night is ราหู. */
export type TaksaDay = 'sun' | 'mon' | 'tue' | 'wed' | 'wedNight' | 'thu' | 'fri' | 'sat'

/** ทักษา order (อาทิตย์ → จันทร์ → อังคาร → พุธ → เสาร์ → พฤหัส → ราหู → ศุกร์), the order positions move in. */
export const TAKSA_ORDER: readonly TaksaDay[] = ['sun', 'mon', 'tue', 'wed', 'sat', 'thu', 'wedNight', 'fri']

/** Positions counted from the starting day. */
export type TaksaPosition = 'boriwan' | 'ayu' | 'det' | 'sri' | 'mula' | 'utsaha' | 'montri' | 'kalakini'
export const POSITIONS: readonly TaksaPosition[] = ['boriwan', 'ayu', 'det', 'sri', 'mula', 'utsaha', 'montri', 'kalakini']

/** Traditional color of each day/planet. */
export const DAY_COLOR: Record<TaksaDay, LuckyColorKey> = {
  sun: 'red',
  mon: 'yellow',
  tue: 'pink',
  wed: 'green',
  wedNight: 'black',
  thu: 'orange',
  fri: 'blue',
  sat: 'purple',
}

/** Day → planet in each position, starting from `start` (บริวาร = the start day itself). */
export function taksa(start: TaksaDay): Record<TaksaPosition, TaksaDay> {
  const i = TAKSA_ORDER.indexOf(start)
  return Object.fromEntries(POSITIONS.map((p, k) => [p, TAKSA_ORDER[(i + k) % TAKSA_ORDER.length]])) as Record<TaksaPosition, TaksaDay>
}

/** What each card on the screen uses (student wording in i18n). PROPOSAL, see DECISIONS #68. */
export const TOPICS = { study: 'det', money: 'sri', helpers: 'montri', friends: 'boriwan', avoid: 'kalakini' } as const satisfies Record<string, TaksaPosition>
export type Topic = keyof typeof TOPICS

export function colorsFor(start: TaksaDay): Record<Topic, LuckyColorKey> {
  const t = taksa(start)
  return Object.fromEntries(Object.entries(TOPICS).map(([topic, pos]) => [topic, DAY_COLOR[t[pos]]])) as Record<Topic, LuckyColorKey>
}

/** Today's day in Thailand (Wednesday stays พุธ all day for "today"; ราหู is only for people born Wednesday night). */
export function bangkokDay(now: Date): TaksaDay {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Bangkok', weekday: 'short' }).format(now)
  return ({ Sun: 'sun', Mon: 'mon', Tue: 'tue', Wed: 'wed', Thu: 'thu', Fri: 'fri', Sat: 'sat' } as const)[name as 'Sun'] ?? 'sun'
}
