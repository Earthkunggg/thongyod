// Wheel of names (single device). Pure logic: no React, no DOM.
// The winner is picked first with secure random, then the wheel animates to it (UX_GUIDELINES §5).

import { secureRandomInt } from '@/lib/random'

export const MIN_OPTIONS = 2
export const MAX_OPTIONS = 12
export const MAX_OPTION_LENGTH = 20
/** Full turns before stopping, so every spin looks like a real spin. */
export const SPIN_TURNS = 4

/** Trim, drop empties, cut long text, keep at most MAX_OPTIONS. */
export function normalizeOptions(options: string[]): string[] {
  return options
    .map((o) => o.trim().slice(0, MAX_OPTION_LENGTH))
    .filter((o) => o !== '')
    .slice(0, MAX_OPTIONS)
}

export function canSpin(options: string[]): boolean {
  return normalizeOptions(options).length >= MIN_OPTIONS
}

/** Size of one slice in degrees. Slice i spans [i * size, (i + 1) * size] clockwise from the top. */
export function sliceSize(count: number): number {
  return 360 / count
}

/**
 * The wheel rotation (degrees, clockwise) that puts slice `index` under the top pointer.
 * Always larger than `current` by at least SPIN_TURNS full turns.
 * `offset` moves the stop point inside the slice: -0.5..0.5 of a slice (0 = center).
 */
export function spinTarget(current: number, index: number, count: number, offset = 0, turns = SPIN_TURNS): number {
  if (!Number.isInteger(count) || count < 1) throw new Error(`count must be a positive integer, got ${count}`)
  if (!Number.isInteger(index) || index < 0 || index >= count) throw new Error(`index out of range: ${index}`)
  const size = sliceSize(count)
  const stopAt = (index + 0.5 + offset) * size // angle on the wheel that must reach the top
  const base = mod(-stopAt - current, 360) // extra rotation to bring it to 0°
  return current + turns * 360 + base
}

/** Which slice is under the top pointer for a given rotation. */
export function indexAtPointer(rotation: number, count: number): number {
  const angle = mod(-rotation, 360)
  return Math.min(count - 1, Math.floor(angle / sliceSize(count)))
}

export type Spin = { index: number; rotation: number }

/** Picks a winner fairly and returns where the wheel should stop. */
export function spin(current: number, count: number, random: (max: number) => number = secureRandomInt): Spin {
  const index = random(count)
  // Stop somewhere inside the slice, never right on an edge (keeps it readable).
  const offset = (random(1000) / 1000 - 0.5) * 0.7
  return { index, rotation: spinTarget(current, index, count, offset) }
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m
}
