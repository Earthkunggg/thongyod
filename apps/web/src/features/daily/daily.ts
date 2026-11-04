// Daily missions + streak (DECISIONS #54). No guilt: missing a day is never punished or announced;
// the streak just starts again. Kept on this device until there is a server API.
import { useSyncExternalStore } from 'react'
import { addDays } from '@/lib/date'
import { bangkokDayKey } from '@/features/fortune/logic'
import { loadDraw } from '@/features/fortune/storage'

export type MissionId = 'fortune' | 'pet' | 'tool'
export const MISSIONS: MissionId[] = ['fortune', 'pet', 'tool']

const KEY = 'thongyod-daily'
const KEEP_DAYS = 60

/** day key ("2026-11-04", Bangkok) → missions done that day. */
export type DailyLog = Record<string, MissionId[]>

let log: DailyLog = read()
const listeners = new Set<() => void>()

function read(): DailyLog {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    if (!parsed || typeof parsed !== 'object') return {}
    const out: DailyLog = {}
    for (const [day, ids] of Object.entries(parsed as Record<string, unknown>)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(day) && Array.isArray(ids)) out[day] = ids.filter((id): id is MissionId => MISSIONS.includes(id as MissionId))
    }
    return out
  } catch {
    return {}
  }
}

/** Marks a mission done for today (Bangkok day). Safe to call many times. */
export function markDone(id: MissionId, now: Date = new Date()): void {
  const day = bangkokDayKey(now)
  if (log[day]?.includes(id)) return
  const days = Object.keys({ ...log, [day]: [] }).sort().slice(-KEEP_DAYS)
  const next: DailyLog = {}
  for (const d of days) next[d] = d === day ? [...(log[d] ?? []), id] : log[d]
  log = next
  try {
    localStorage.setItem(KEY, JSON.stringify(log))
  } catch {
    // Storage blocked: still counts for this visit.
  }
  listeners.forEach((l) => l())
}

/** Missions done today. The fortune mission also counts a stick drawn before this feature existed. */
export function doneToday(current: DailyLog, now: Date = new Date()): MissionId[] {
  const day = bangkokDayKey(now)
  const done = new Set(current[day] ?? [])
  if (loadDraw()?.day === day) done.add('fortune')
  return MISSIONS.filter((id) => done.has(id))
}

/**
 * Days in a row with at least one mission. Today not done yet does not break it
 * (it counts from yesterday), so opening the app in the morning never shows a lost streak.
 */
export function streakOf(current: DailyLog, now: Date = new Date()): number {
  const has = (d: Date) => (current[bangkokDayKey(d)]?.length ?? 0) > 0
  let day = has(now) ? now : addDays(now, -1)
  let count = 0
  while (has(day)) {
    count++
    day = addDays(day, -1)
  }
  return count
}

export function useDaily(): DailyLog {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => log,
  )
}
