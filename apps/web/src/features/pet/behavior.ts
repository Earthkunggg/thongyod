// What the pet does and when (DECISIONS #80). Pure: no timers, no DOM. Tested in behavior.test.ts.
// The <Pet> component runs these plans with timers and CSS; this file decides.

export const POSES = ['main', 'blink', 'happy', 'wave', 'shy', 'play1', 'play2', 'play3', 'sleep', 'eat', 'celebrate', 'yawn'] as const
export type PoseId = (typeof POSES)[number]

/** One-shot body motion (CSS keyframes in pet.css, transform only). */
export type Motion = 'none' | 'squish' | 'hop' | 'wave' | 'shy' | 'fly' | 'dash' | 'turn' | 'sneeze' | 'jump' | 'chomp' | 'dance' | 'stretch'
/** Little drawings around the pet. */
export type Overlay = 'none' | 'sparks' | 'hearts' | 'puff' | 'bubbles' | 'z' | 'crumbs' | 'confetti'

export type PetAction = 'happy' | 'wave' | 'shy' | 'love' | 'play1' | 'play2' | 'play3' | 'eat' | 'celebrate' | 'yawn' | 'sleep'
export type Plan = { pose: PoseId; motion: Motion; overlay: Overlay; /** How long before going back to the main pose. 0 = stays (sleep). */ ms: number }

/** Per-species play moves: the same pose slots, different motion. */
export type SpeciesMoves = Record<'play1' | 'play2' | 'play3', { motion: Motion; overlay: Overlay; ms: number }>

export const TAP_ACTIONS = ['happy', 'wave', 'shy'] as const satisfies readonly PetAction[]
export const PLAY_ACTIONS = ['play1', 'play2', 'play3'] as const satisfies readonly PetAction[]

export function planFor(action: PetAction, moves: SpeciesMoves): Plan {
  switch (action) {
    case 'happy':
      return { pose: 'happy', motion: 'hop', overlay: 'sparks', ms: 1300 }
    case 'wave':
      return { pose: 'wave', motion: 'wave', overlay: 'none', ms: 1500 }
    case 'shy':
      return { pose: 'shy', motion: 'shy', overlay: 'hearts', ms: 1600 }
    case 'love':
      return { pose: 'happy', motion: 'squish', overlay: 'hearts', ms: 1800 }
    case 'play1':
    case 'play2':
    case 'play3':
      return { pose: action, ...moves[action] }
    case 'eat':
      return { pose: 'eat', motion: 'chomp', overlay: 'crumbs', ms: 2000 }
    case 'celebrate':
      return { pose: 'celebrate', motion: 'dance', overlay: 'confetti', ms: 2400 }
    case 'yawn':
      return { pose: 'yawn', motion: 'stretch', overlay: 'none', ms: 1900 }
    case 'sleep':
      return { pose: 'sleep', motion: 'none', overlay: 'z', ms: 0 }
  }
}

/** Pick from a list, never the same as last time (when there is a choice). `random(n)` → 0…n-1. */
export function pickOther<T>(list: readonly T[], last: T | null, random: (n: number) => number): T {
  const pool = list.length > 1 ? list.filter((x) => x !== last) : list
  return pool[random(pool.length)]
}

/** 22:00–05:59 local time. */
export const isNight = (hour: number) => hour >= 22 || hour < 6

/** Next idle move: at night mostly yawns, otherwise a play move (not the last one). */
export function pickIdle(last: PetAction | null, hour: number, random: (n: number) => number): PetAction {
  if (isNight(hour) && random(10) < 6) return 'yawn'
  if (random(10) === 0) return 'yawn'
  return pickOther(PLAY_ACTIONS, last as (typeof PLAY_ACTIONS)[number] | null, random)
}

/** Wait before the next idle move: 9–20 s, never the same rhythm. */
export const idleDelayMs = (random: (n: number) => number) => 9000 + random(11001)

/** Fall asleep after this long without being touched: sooner at night. */
export const sleepAfterMs = (hour: number) => (isNight(hour) ? 40_000 : 75_000)

/** Hold this long for "love" (hearts) instead of a tap. */
export const LONG_PRESS_MS = 480
/** Blink every 2.5–6 s, eyes shut ~130 ms. */
export const blinkDelayMs = (random: (n: number) => number) => 2500 + random(3501)
export const BLINK_MS = 130
