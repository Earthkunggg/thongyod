// เซียมซี (DECISIONS #51). Pure logic: no React, no DOM.
// 28 sticks with our own student-life fortunes (text in i18n: fortune.sticks.s1 … s28).
// One draw per day (Bangkok calendar day); drawing again the same day shows the same stick.

import { secureRandomInt } from '@/lib/random'

export const STICK_COUNT = 28

// prettier-ignore
export type StickNo = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28
export type Level = 'great' | 'good' | 'fair' | 'careful'

/** Level of each stick (index 0 = stick 1): 6 great, 10 good, 7 fair, 5 careful. */
// prettier-ignore
const LEVELS: Level[] = [
  'great', 'good', 'fair', 'careful', 'good', 'great', 'fair',
  'good', 'careful', 'good', 'great', 'fair', 'good', 'careful',
  'good', 'great', 'fair', 'good', 'fair', 'good', 'great',
  'careful', 'good', 'fair', 'good', 'great', 'fair', 'careful',
]

export function levelOf(stick: StickNo): Level {
  return LEVELS[stick - 1]
}

export function isStickNo(n: unknown): n is StickNo {
  return Number.isInteger(n) && (n as number) >= 1 && (n as number) <= STICK_COUNT
}

/** Calendar day in Thailand, e.g. "2026-11-04" (same rule as DECISIONS #40). */
export function bangkokDayKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

export type Draw = { day: string; stick: StickNo }

/** How many days of fortune history this device keeps. */
export const HISTORY_DAYS = 60

/** History with `draw` added: one entry per day (the newer one wins), newest first, at most `keep`. */
export function addToHistory(history: Draw[], draw: Draw, keep: number = HISTORY_DAYS): Draw[] {
  const others = history.filter((d) => d.day !== draw.day && isStickNo(d.stick))
  return [draw, ...others].sort((a, b) => b.day.localeCompare(a.day)).slice(0, keep)
}

/** Today's stick: the saved one if it is from today, otherwise a new fair draw. */
export function drawForToday(now: Date, saved: Draw | null, random: (max: number) => number = secureRandomInt): { draw: Draw; isNew: boolean } {
  const day = bangkokDayKey(now)
  if (saved && saved.day === day && isStickNo(saved.stick)) return { draw: saved, isNew: false }
  return { draw: { day, stick: (random(STICK_COUNT) + 1) as StickNo }, isNew: true }
}

/**
 * Shake detector for DeviceMotion samples (m/s², gravity included).
 * A "jolt" = the change between two samples is bigger than `threshold`.
 * A shake = `jolts` jolts within `windowMs`. After a shake it waits `cooldownMs`.
 */
export function createShakeDetector({ threshold = 18, jolts = 3, windowMs = 900, cooldownMs = 1500 } = {}) {
  let last: [number, number, number] | null = null
  let hits: number[] = []
  let quietUntil = 0
  return function feed(x: number, y: number, z: number, t: number): boolean {
    const prev = last
    last = [x, y, z]
    if (!prev || t < quietUntil) return false
    const change = Math.abs(x - prev[0]) + Math.abs(y - prev[1]) + Math.abs(z - prev[2])
    if (change < threshold) return false
    hits = [...hits.filter((h) => t - h <= windowMs), t]
    if (hits.length < jolts) return false
    hits = []
    quietUntil = t + cooldownMs
    return true
  }
}
