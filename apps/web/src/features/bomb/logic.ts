// ระเบิดเวลา (hot potato). Pure logic, tested in logic.test.ts.
import { secureRandomInt } from '@/lib/random'

export type FuseLength = 'short' | 'normal' | 'long'

/** Hidden fuse in seconds [min, max] — nobody knows when it goes off. */
export const FUSE_RANGE: Record<FuseLength, readonly [number, number]> = {
  short: [10, 25],
  normal: [20, 45],
  long: [40, 70],
}

export function pickFuse(length: FuseLength, random: (max: number) => number = secureRandomInt): number {
  const [min, max] = FUSE_RANGE[length] ?? FUSE_RANGE.normal
  return min + random(max - min + 1)
}

/** Time between ticks: slow at first, frantic near the end (but the end time stays secret). */
export function tickGap(elapsedMs: number, fuseMs: number): number {
  const share = Math.max(0, Math.min(1, elapsedMs / fuseMs))
  return Math.round(900 - 750 * share ** 1.6)
}

/** Every tick time (ms from start) until the fuse burns out. */
export function tickTimes(fuseMs: number): number[] {
  const out: number[] = []
  for (let at = 0; at < fuseMs; at += tickGap(at, fuseMs)) out.push(at)
  return out
}
