// ใบ้บนหัว (UX_GUIDELINES §4). Pure logic: no React, no DOM. Tested in logic.test.ts.
import { secureRandomInt } from '@/lib/random'

export type Verdict = 'correct' | 'pass'
export type Answer = { word: string; verdict: Verdict }

/** Pack id for "สุ่มทุกหมวด" (all packs mixed). */
export const MIX_PACK = 'mix'

export const ROUND_SECONDS = [60, 90] as const
export type RoundSeconds = (typeof ROUND_SECONDS)[number]

/** Shuffled copy (Fisher–Yates with the fair random source). */
export function shuffle<T>(items: readonly T[], random: (max: number) => number = secureRandomInt): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = random(i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Words for one round: no repeats inside a session. Words already used this session go last,
 * so a long session only repeats after the whole pack has been seen.
 */
export function pickWords(words: readonly string[], used: ReadonlySet<string>, random: (max: number) => number = secureRandomInt): string[] {
  const unique = [...new Set(words.map((w) => w.trim()).filter(Boolean))]
  const fresh = unique.filter((w) => !used.has(w))
  const seen = unique.filter((w) => used.has(w))
  return [...shuffle(fresh, random), ...shuffle(seen, random)]
}

export function score(answers: readonly Answer[]): number {
  return answers.filter((a) => a.verdict === 'correct').length
}

/** Result screen: tap a word to fix a sensor mistake (correct ↔ pass). */
export function toggleAnswer(answers: readonly Answer[], index: number): Answer[] {
  return answers.map((a, i) => (i === index ? { ...a, verdict: a.verdict === 'correct' ? 'pass' : 'correct' } : a))
}

export type TiltOptions = {
  /** m/s² away from neutral that counts as a tilt (~6 ≈ 35–40°). */
  threshold?: number
  /** Must come back within this distance of neutral before the next tilt counts. */
  release?: number
  /** Extra quiet time after each tilt. */
  cooldownMs?: number
  /** Swap the two directions (some phones report the opposite sign). */
  inverted?: boolean
}

/**
 * Tilt detector on the gravity part along the screen normal (z of accelerationIncludingGravity).
 * Phone on the forehead, screen facing friends: z ≈ neutral. Screen toward the floor (nod down) = correct,
 * screen toward the ceiling (tilt back) = pass. z does not depend on landscape left/right, so no angle fix is needed.
 * Call `calibrate(z)` with samples during the 3-2-1 countdown; then `feed(z, t)` returns a verdict or null.
 */
export function createTiltDetector({ threshold = 6, release = 2.5, cooldownMs = 400, inverted = false }: TiltOptions = {}) {
  let neutral: number | null = null
  let samples: number[] = []
  let armed = true
  let quietUntil = 0
  return {
    calibrate(z: number) {
      samples.push(z)
      if (samples.length > 30) samples = samples.slice(-30)
      neutral = samples.reduce((a, b) => a + b, 0) / samples.length
    },
    get neutral() {
      return neutral
    },
    feed(z: number, t: number): Verdict | null {
      if (neutral === null) return null
      const delta = (z - neutral) * (inverted ? -1 : 1)
      if (!armed) {
        if (Math.abs(delta) < release && t >= quietUntil) armed = true
        return null
      }
      if (t < quietUntil) return null
      if (delta <= -threshold || delta >= threshold) {
        armed = false
        quietUntil = t + cooldownMs
        return delta < 0 ? 'correct' : 'pass'
      }
      return null
    },
  }
}

/** Seconds left (never negative), from the round start and its length. Paused time is excluded by the caller. */
export function secondsLeft(startedAt: number, lengthSeconds: number, now: number, pausedMs = 0): number {
  return Math.max(0, Math.ceil((startedAt + lengthSeconds * 1000 + pausedMs - now) / 1000))
}
